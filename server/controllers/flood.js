var mongoose = require('mongoose')
	, Session = require('../models/Workspace').SessionModel
	, Workspace = require('../models/Workspace').WorkspaceModel
	, User = require('../models/User')
	, async = require('async')
	, _ = require('underscore');

var initNonUserSession = function(req, res){

	var user = req.user;
	var nws = new Workspace({name : "My first workspace"});
	var newSesh = new Session({name : "Empty session", workspaces : [ nws ]});

	nws.save(function(errWs){

		if (errWs) return res.status(500).send("Failed to initialize user workspace");

		newSesh.save(function(errSesh){
				
				if (errSesh) return res.status(500).send("Failed to initialize user session");

				Session	
					.findById(newSesh.id)
					.populate('workspaces')
					.exec( function(err, sesh){

						if (err || !sesh ) return res.status(500).send("Failed to obtain user session");
						return res.send(sesh);
					});
			});
	});

}

var initUserSession = function(req, res){

	var user = req.user;
	var nws = new Workspace({name : "My first workspace"});
	var newSesh = new Session({name : "Empty session", workspaces : [ nws ]});

	nws.save(function(errWs){

		if (errWs) return res.status(500).send("Failed to initialize user workspace");

		newSesh.save(function(errSesh){
				
				if (errSesh) return res.status(500).send("Failed to initialize user session");

				user.lastSession = newSesh;
				user.markModified("lastSession");

				user.save(function(err){
					if (err) return res.status(500).send("Failed to save user session");

					Session	
					.findById(user.lastSession )
					.populate('workspaces')
					.exec( function(err, sesh){

						if (err || !sesh ) return res.status(500).send("Failed to obtain user session");
						return res.send(sesh);
					});
				});
			});
	});
	
};

exports.getMySession = function(req, res) {

	var user = req.user;

	if (!req.user) {
		return initNonUserSession(req,res);
	}

	if (!user.lastSession){
		return initUserSession(req, res);
	}	

	Session
	.findById(user.lastSession )
	.populate('workspaces')
	.exec( function(err, sesh){
		if (err || !sesh || !sesh.workspaces || sesh.workspaces.length == 0 ) {
			return initUserSession(req, res);
		}

		return res.send(sesh);
	});

};

exports.putMySession = function(req, res) {

	if (!req.user) {
		return res.status(401).send("You are not logged in");
	}

	if (!req.body || !req.body._id) return res.status(500).send('Malformed body');

  var ns = req.body;
  var sid = ns._id;

	// build all of the workspace saves
	var workspaceSaves = ns.workspaces.map(function(x){

		return function(callback){

			Workspace.findById(x._id, function(e, w){

				if (e || !w) return callback("Failed to find workspace");

				// todo optimize this
				w.name = x.name || w.name;
				w.nodes = x.nodes || w.nodes;
				w.connections = x.connections || w.connections;
				w.currentWorkspace = x.currentWorkspace || w.currentWorkspace;
				w.selectedNodes = x.selectedNodes || w.selectedNodes;
				w.zoom = x.zoom || w.zoom;
				w.lastSaved = Date.now();
				w.redoStack = x.redoStack || w.redoStack;
				w.undoStack = x.undoStack || w.undoStack;
				w.isFirstExperience = false;

				w.markModified("isFirstExperience name nodes connections currentWorkspace selectedNodes zoom lastSaved undoStack redoStack");

				w.save(function(se){
					if (se) return callback(se);
					return callback();
				});	

			});

		};

	});

	async.waterfall(workspaceSaves, function(err) { 

		if (err) return res.status(500).send(err);

		// save session
		Session.findById( sid, function(e, s) {

			if (e || !s) return res.status(500).send('Invalid session id');

			s.name = ns.name || s.name;

			// TODO: validate ids
			s.workspaces = ns.workspaces.map(function(x){ return x._id; });
			s.currentWorkspace = ns.currentWorkspace; 
			s.isModified = true;
			s.lastSaved = Date.now();

			s.markModified('isModified workspaces currentWorkspace lastSave name');

			s.save(function(e){
				if (e) return res.status(500).send("Failed to save session");
				return res.send("Success");
			});

		}); 

	});

};

exports.getNewWorkspace = function(req, res){

	var user = req.user;

	if (!user) return res.status(403).send("Must be logged in to create a new workspace")

	var nws = new Workspace({name : "New workspace", maintainers : [ user._id ] });

	nws.save(function(e){

		if (e) return res.status(500).send("Failed to create new workspace");

		user.workspaces.push(nws);
		user.markModified('workspaces');

		user.save(function(eu){

			if (eu) return res.status(500).send("Failed to update user profile");
			return res.send(nws);

		})

	});

};

var dateSort = function(a, b){

	if (a.lastSaved && !b.lastSaved){
		return -1;
	}

	if (b.lastSaved && !a.lastSaved){
		return 1;
	}

	if ( !b.lastSaved && !a.lastSaved )
		return 0;

	if ( a.lastSaved > b.lastSaved )
     return -1;

  if ( a.lastSaved < b.lastSaved )
     return 1;

  return 0;
}

exports.getWorkspaces = function(req, res) {

	var user = req.user;

	if (!user) return res.status(403).send("Must be logged in to list your workspaces")

	User.findById( user._id )
		.populate('workspaces', 'name lastSaved isPublic maintainers isModified')
		.exec(function(e, u) {
			return res.send( u.workspaces.filter(function(x){ return x.isModified === true; }).sort(dateSort) );
	}); 

};

exports.getWorkspace = function(req, res) {

  var wid = req.params.id;

	Workspace.findById( wid , function(e, ws) {

		if (e) {
	  	return res.send('Workspace not found');
		}

		return res.send(ws);
		
	}); 

};

exports.putWorkspace = function(req, res) {

  var wid = req.params.id;
	var x = req.body;

	if (!req.user) {
		return res.status(401).send("You need to be logged in to save a workspace");
	}

	Workspace.findById( wid , function(e, w) {

		if (e) {
	  		return res.status(404).send('Workspace not found');
		}

		w.name = x.name || w.name;
		w.nodes = x.nodes || w.nodes;
		w.connections = x.connections || w.connections;
		w.currentWorkspace = x.currentWorkspace || w.currentWorkspace;
		w.selectedNodes = x.selectedNodes || w.selectedNodes;
		w.zoom = x.zoom || w.zoom;
		w.lastSaved = Date.now();
		w.redoStack = x.redoStack || w.redoStack;
		w.undoStack = x.undoStack || w.undoStack;
		w.isModified = true;

		w.markModified("name nodes connections currentWorkspace selectedNodes zoom lastSaved undoStack redoStack isModified");

		w.save(function(se){
			if (se) return res.status(500).send('Could not save the workspace');
			return res.status(200).send('Saved workspace');
		});	
		
	}); 

};

