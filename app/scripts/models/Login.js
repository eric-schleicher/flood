define(['backbone', 'Storage'], function(Backbone, Storage) {

	return Backbone.Model.extend({

	  defaults: {
	  	isLoggedIn : false,
	  	failed : false,
	  	failureMessage : "",
	  	showing: false,
	  	email : ""
	  },

		initialize: function(atts, vals) {
	  	this.app = vals.app;
	  },

	  fetch : function(){

	  	var that = this;
	  	Storage.fetchLogin().done(function(e){
	  		if (e.email) {
	  			that.set('email', e.email);
	  			that.set('isLoggedIn', true); 
	  		} else {
	  			that.set('isLoggedIn', false);
	  		}
	  	});

	  },

		toggle: function(){
		  return this.get('showing') ? this.hide() : this.show();
		},

		show: function() {
		  this.set('showing', true);
		},

		hide: function() {
		  this.set('showing', false);
		},

	  signup: function(data){

	  	var that = this;
	  	$.post('/signup', data, function(e){

	  		if (e.length && e.length > 0 ) {
	  			that.set('failureMessage', e[0].msg);
	  			return that.set('failed', true);
	  		}

	  		that.set('failed', false);
	  		that.app.fetch();
	  	});

	  },

	  login: function(data){

	  	var that = this;
	  	$.post('/login', data, function(e){

	  		if (e.length && e.length > 0 ) {
	  			that.set('failureMessage', e[0].msg);
	  			return that.set('failed', true);
	  		}

	  		that.set('failed', false);
	  		that.app.fetch();
	  	});

	  },

	  logout: function(){

	  	var that = this;
	  	Storage.logout().done(function(e){
	  		that.app.fetch();
	  	});

	  }

	});
});
