var app = app || {};

define(['backbone', 'FLOOD'], function(Backbone, FLOOD) {

  return Backbone.Model.extend({

    idAttribute: "_id",

    defaults: {
      name: 'DefaultNodeName'
      , position: [10, 10]
      , typeName: 'Add'
      , type: null
      , inputConnections: []
      , outputConnections: []
      , selected: true
      , lastValue: null
      , failureMessage: null
      , visible: true
      , replication: "applyLongest"
      , extra: {}
      , ignoreDefaults: []
      , isEvaluating: false
    },

    initialize: function(atts, vals) {

      // we need to know the type in order to create the node
      if ( atts.typeName != null && FLOOD.nodeTypes[atts.typeName] != undefined){
        this.set( 'type', new FLOOD.nodeTypes[ atts.typeName ]() );
      } else {

        var elems = vals.workspace.app.SearchElements.where({ name: atts.typeName });
        if (elems.length > 0) {
          var inPort = elems[0].get('inPort');
          var outPort = elems[0].get('outPort');
        }
        // Create dummy ports if no connection with server established.
        else if (atts.ignoreDefaults){
          var inPort = new Array();

          var a = "A";
          for (var i = a.charCodeAt(0); i < a.charCodeAt(0) + atts.ignoreDefaults.length; i++) {
            inPort.push(String.fromCharCode(i));
          }
        }
        this.set( 'type', new FLOOD.nodeTypes.ServerNode(inPort, outPort) );
      }

      if (atts.extra){
        this.get('type').extend( atts.extra );
      }

      if (atts.lastValue){
        this.get('type').value = atts.lastValue;
      }

      if (atts.ignoreDefaults && atts.ignoreDefaults.length > 0){

        for (var i = 0; i < atts.ignoreDefaults.length; i++){
          this.get('type').inputs[i].useDefault = !atts.ignoreDefaults[i];
        }
        
      } else {
        atts.ignoreDefaults = this.get('type').inputs.map(function(x){ return !x.useDefault; });
      }

      this.set('ignoreDefaults', atts.ignoreDefaults );
      
      var that = this;
      this.on('connection', this.onConnectPort);
      
      this.on('disconnection', this.onDisconnectPort);
      this.workspace = vals.workspace;

      this.on('remove', this.onRemove);

      this.initializePorts();
      
    },

    // called when saving the node to server
    serialize : function() {

      var vals = {
        name: this.get("name")
        , position: this.get('position')
        , typeName: this.get('typeName')
        , selected: this.get('selected')
        , visible: this.get('visible')
        , ignoreDefaults: this.get('ignoreDefaults')
        , _id: this.get('_id')
        , replication: this.get('replication')
        , extra: this.get('extra')
      };

      return vals;

    },

    initializePorts: function() {

      var type = this.get('type');
   
      this.set('inputConnections', new Array( type.inputs.length ));
      this.set('outputConnections', new Array( type.outputs.length ));

    },

    onRemove: function(){

      this.trigger('removed');

    },

    onEvalFailed: function(ex){

      this.trigger('evalFailed', ex);

    },

    onEvalBegin: function(isNew){

      if (!isNew) return;
      this.trigger('evalBegin');
      this.set('isEvaluating', true);

    },

    onEvalComplete: function(isNew, value, prettyValue){

      if (!isNew) return;

      this.set('lastValue', value);
      this.set('prettyLastValue', prettyValue);
      this.set('isEvaluating', false);
      this.trigger('evalComplete');

    },

    select: function() {
      this.set('selected', false);
    },

    deselect: function() {
      this.set('selected', true);
    },

    // get the input or output ports of a node
    getPorts: function(isOutput){
      return isOutput ? this.get('outputConnections') : this.get('inputConnections');
    },

    // determine if a given port is connected or not
    isPortConnected: function(index, isOutput){

      if ( !this.isValidPort(index, isOutput) ) {
        return true;
      }

      var ports = this.getPorts(isOutput);
      return ports[index] != null && ports[index].length > 0;

    },

    isPartialFunctionApplication: function(){

      var numInPorts = this.get('inputConnections').length;

      for (var i = 0; i < numInPorts; i++){
        if (!this.isPortConnected(i, false) && !this.isInputPortUsingDefault(i) ){
          return true;
        } 
      }

      return false;

    },

    isInputPortUsingDefault: function(index){

      if ( !this.isValidPort(index, false) ) {
        return false;
      }

      return !this.get('ignoreDefaults')[index];

    },

    // get the type of a given node port
    getPortType: function(index, isOutput){
      
      if (index < 0)
        return null;

      var type = this.get('type')
        , ports = isOutput ? type.outputs : type.inputs;

      if ( ports.length > index )
        return ports[index].type;

      return null;

    },

    isValidPort: function(index, isOutput){
      return this.getPortType(index, isOutput) != null;
    },

    // get the node and index of the opposite end of a port
    // returns object containing "node", "portIndex" fields
    // if out of range, returns null
    getOppositeNodeAndPort: function(index, isOutput){

      if ( !this.isValidPort(index, isOutput) ) {
        return null;
      }

      return this.getPorts(isOutput)[index];
    },

    isOutputNode: function(){
      return this.get('outputConnections').reduce(function(memo, ele){
        return memo && (ele.length === 0);
      }, true);
    },

    connectPort: function( portIndex, isOutput, connection ) {

      if ( !this.isValidPort(portIndex, isOutput) ) {
        return null; // the port doesn't exist
      }

      // initialize if necessary
      if ( this.getPorts( isOutput )[portIndex] === undefined )
        this.getPorts( isOutput )[portIndex] = [];

      // add the connection to the array
      this.getPorts( isOutput )[portIndex].push(connection);

      // listen for deletion or update of the connection
      var that = this;
      this.listenTo( connection, 'remove', (function(){
        return function(){
          that.disconnectPort( portIndex, connection, isOutput );
        };
      })());

      this.trigger('connection', portIndex, isOutput, connection);
      this.trigger('change');

      return this;

    },

    getConnectionAtIndex: function( portIndex, isOutput, connectionIndex ){

      if (!this.isValidPort(portIndex, isOutput)){
        return null;
      }

      if (isOutput === undefined) isOutput = false;

      var port = this.getPorts(isOutput)[portIndex];

      if (port == null) {
        return null;
      }

      if ( connectionIndex === undefined ) connectionIndex = 0;

      if (connectionIndex >= port.length || connectionIndex < 0) return null;

      return port[connectionIndex];

    },

    disconnectPort: function( portIndex, connection, isOutput ){

      if (!this.isValidPort(portIndex, isOutput)){
        return;
      }

      var port = this.getPorts(isOutput)[portIndex];

      if (port == null)
        return;

      var index = -1;
      if ( connection ){

        var index = port.indexOf(connection);

      } else if (!isOutput && port.length > 0) {

        index = 0;
        connection = port[0];
        isOutput = false;
        this.workspace.get('connections').remove( connection );

      }
        
      if (index === -1) return;
        
      // remove the requested connection on the port
      port.remove(index);

      this.trigger('disconnection', portIndex, isOutput, connection);
      this.trigger('change');
        
    },

    onConnectPort: function( portIndex, isOutput, connection){
      
      if (isOutput)
        return;

      // connect the logic nodes
      var type = this.get('type')
        , opp = connection.getOpposite( this )
        , oppType = opp.node.get('type')
        , oppIndex = opp.portIndex;

      type.inputs[portIndex].connect( oppType, oppIndex );

    },

    onDisconnectPort: function( portIndex, isOutput, connection ){
      
      if (isOutput){
        return;
      }

      if (!isOutput){
        this.get('type').inputs[portIndex].disconnect();
      }

      if (this.workspace)
        this.workspace.run();

    }

  });

});



