define(['AbstractRunner', 'commandsMap', 'RecordableCommandsMessage', 'CreateNodeCommand', 'CreateProxyNodeCommand', 'MakeConnectionCommand', 'UpdateModelValueCommand'],
    function (AbstractRunner, commandsMap, RecordableCommandsMessage, CreateNodeCommand, CreateProxyNodeCommand, MakeConnectionCommand, UpdateModelValueCommand) {

    var DynamoRunner =  AbstractRunner.extend({
        initialize: function (attrs, vals) {
            AbstractRunner.prototype.initialize.call(this, attrs, vals);
        },

        postMessage: function (data, quiet) {
            if (commands.hasOwnProperty(data.kind)) {
                this.app.socket.send(commands[data.kind].call(this, data));
            }

            AbstractRunner.prototype.postMessage.call(this, data, quiet);
        },

        reset: function () {
            AbstractRunner.prototype.reset.call(this);
        },

        updateNode: function (node) {
            this.app.socket.send(createMessage.call(this, UpdateModelValueCommand.syncProperties({ full: true }, node.attributes)));

            AbstractRunner.prototype.updateNode.call(this, node);
        }
    });

    var commands = {
        addNode: function (data) {
            var commands = [instantiateCommand(data)];
            Array.prototype.push.apply(commands, UpdateModelValueCommand.syncProperties({ full: true }, data));
            return createMessage.call(this, commands);
        },
        updateNode: function (data) {
            return createMessage.call(this, UpdateModelValueCommand.syncProperties({}, data));
        },
        removeNode: function (data) {
            return createMessage.call(this, instantiateCommand(data));
        },
        addConnection: function(data){
            return createMessage.call(this, instantiateCommand(data));
        },
        removeConnection: function(data){
            return createMessage.call(this, instantiateCommand(data));
        },
        setWorkspaceContents: function(data){
            //Create batch of commands to be executed on server
            var i = 0,
                len = data.nodes.length,
                commands = [];
            for( ; i < len; i++ ){
                // if there is no definition for custom node
                // the dynamo won't be able to create an instance
                if (data.nodes[i].extra.isProxy) {
                    commands.push(new CreateProxyNodeCommand({}, data.nodes[i]));
                }
                else {
                    commands.push(new CreateNodeCommand({}, data.nodes[i]));
                }

                Array.prototype.push.apply(commands, UpdateModelValueCommand.syncProperties({full: true}, data.nodes[i]));
            }

            for( i = 0, len = data.connections.length; i < len; i++ ){
                //Leave empty object parameter just for now to be in sync with Backbone models
                 Array.prototype.push.apply(commands, new MakeConnectionCommand({}, data.connections[i]));
            }

            return createMessage.call(this, commands);
        },
        run: function(data){
            return createMessage.call(this, instantiateCommand(data));
        },
        addWorkspace: function(data){
            if(this.workspace.get('isCustomNode') === true)
            {
                data.guid = this.workspace.get('guid');
                data.name = this.workspace.get('name');
                return createMessage.call(this, instantiateCommand(data));
            }
        }
    },
    instantiateCommand = function(data){
        return new commandsMap[data.kind]({}, data);
    },
    createMessage = function (commands) {
        //If commands is a single command, make an array from it
        if(!(commands instanceof Array)){
            commands = [commands];
        }

        return JSON.stringify(new RecordableCommandsMessage(commands, this.workspace.get('guid')));
    };

    return DynamoRunner;
});