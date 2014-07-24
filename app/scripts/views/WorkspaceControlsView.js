define(['backbone', 'List', 'SearchElement', 'SearchElementView', 'bootstrap'], function(Backbone, List, SearchElement, SearchElementView, bootstrap) {

  return Backbone.View.extend({

    tagName: 'div',
    className: 'workspace-search',

    initialize: function(atts, arr) {
      this.app = arr.app;
      this.appView = arr.appView;

      //Bind to document's click event for hiding toolbox
      //Unbind first to avoid duplicate bindings
      $(window).off('click.models-view');
      $(window).on('click.models-view', function(e){

        if(e.target!==this.$input[0]){
          this.$list.hide();
        }
      }.bind(this));

      this.app.SearchElements.on('add remove', this.render, this);

    },

    template: _.template( $('#workspace-search-template').html() ),

    events: {
      'keyup .library-search-input': 'searchKeyup',
      'focus .library-search-input': 'focus',
      'click #delete-button': 'deleteClick',
      'click #undo-button': 'undoClick',
      'click #redo-button': 'redoClick',
      'click #copy-button': 'copyClick',
      'click #paste-button': 'pasteClick',
      'click #zoomin-button': 'zoominClick',
      'click #zoomout-button': 'zoomoutClick',
      'click #zoomreset-button': 'zoomresetClick',
      'click #export-button': 'exportClick'
    },

    render: function(arg) {

      this.$el.html( this.template( this.model.toJSON() ) );

      this.$input = this.$('.library-search-input');
      this.$list = this.$('.search-list');

      this.$list.empty();

      var that = this;
      var prevCategory = '';

      this.app.SearchElements.forEach(function(ele) {

        if (ele.attributes.category !== null) {
          var category = ele.attributes.category.split('.')[0];
          if (category !== prevCategory) {
            prevCategory = category;

            var elem = new SearchElement({name: '==> ' + category + ' <==', category: category, app: that.app});

            var eleView = new SearchElementView({ model: elem }, { appView: that.appView, app: that.app });

             eleView.render();
             that.$list.append(eleView.$el);
          }
        }

        var eleView = new SearchElementView({ model: ele }, { appView: that.appView, app: that.app, 
          click: function(e){ that.elementClick.call(that, e); } });

        eleView.render();
        that.$list.append( eleView.$el );

      });

      var options = {
          valueNames: [ 'name' ]
      };

      this.list = new List(this.el, options);

      var del = { show: 300 };

      // build button tooltips
      this.$el.find('#undo-button').tooltip({title: "Ctrl/Cmd Z", delay: del});
      this.$el.find('#redo-button').tooltip({title: "Ctrl/Cmd Y", delay: del});

      this.$el.find('#copy-button').tooltip({title: "Ctrl/Cmd C", delay: del});
      this.$el.find('#paste-button').tooltip({title: "Ctrl/Cmd V", delay: del});

      this.$el.find('#delete-button').tooltip({title: "Backspace/Delete", delay: del});

      this.$el.find('#zoomin-button').tooltip({title: "Ctrl/Cmd +", delay: del});
      this.$el.find('#zoomout-button').tooltip({title: "Ctrl/Cmd -", delay: del});
      this.$el.find('#zoomreset-button').tooltip({title: "Ctrl/Cmd 0", delay: del});

    },

    focus: function(event){
      this.$('.search-list').show();
      this.$('.library-search-input').select();
    },

    currentWorkspace: function(){
      return this.app.get('workspaces').get( this.app.get('currentWorkspace') );
    },

    deleteClick: function(){
      this.currentWorkspace().removeSelected();
    },

    copyClick: function(){
      this.currentWorkspace().copy();
    },

    pasteClick: function(){
      this.currentWorkspace().paste();
    },

    undoClick: function(){
      this.currentWorkspace().undo();
    },

    redoClick: function(){
      this.currentWorkspace().redo();
    },

    zoomresetClick: function(){
      this.currentWorkspace().set('zoom', 1.0);
    },

    zoominClick: function(){
      this.currentWorkspace().zoomIn();
    },

    zoomoutClick: function(){
      this.currentWorkspace().zoomOut();
    },

    getWorkspaceCenter: function(){

      var w = this.appView.currentWorkspaceView.$el.width()
        , h = this.appView.currentWorkspaceView.$el.height()
        , ho = this.appView.currentWorkspaceView.$el.scrollTop()
        , wo = this.appView.currentWorkspaceView.$el.scrollLeft()
        , zoom = 1 / this.currentWorkspace().get('zoom');

      return [zoom * (wo + w / 2), zoom * (ho + h / 2)];
    },

    addNode: function(name){

      if (name === undefined ) return;

      this.currentWorkspace().addNodeByNameAndPosition( name, this.getWorkspaceCenter() );

    },

    objConverter: function(x, vertexOffset, index){

        if ( !x || !( x.vertices && x.faces ) ) return "";

        var text = "";

        // OBJ used 1-based indexing
        vertexOffset = vertexOffset + 1;

        x.vertices.forEach(function(v){

          text += "v"
          text += " " + v[0];
          text += " " + v[1];
          text += " " + v[2];
          text += "\n";

        });

        x.faces.forEach(function(f){
          
          text += "f"
          text += " " + (vertexOffset + f[0]);
          text += " " + (vertexOffset + f[1]);
          text += " " + (vertexOffset + f[2]);
          text += "\n";

        });

        return text;
    },

    stlConverter: function(x, vertexOffset, index){

        if ( !x || !( x.vertices && x.faces ) ) return "";

        var text = "solid s" + index + "\n";

        x.faces.forEach(function(f){
          
          var v1 = x.vertices[ f[0] ];
          var v2 = x.vertices[ f[1] ];
          var v3 = x.vertices[ f[2] ];
          var n = f[3];

          text += "facet normal"
          text += " " + n[0];
          text += " " + n[1];
          text += " " + n[2];
          text += "\n";

            text += "\touter loop\n";

              text += "\t\tvertex"
              text += " " + v1[0];
              text += " " + v1[1];
              text += " " + v1[2];
              text += "\n";

              text += "\t\tvertex"
              text += " " + v2[0];
              text += " " + v2[1];
              text += " " + v2[2];
              text += "\n";

              text += "\t\tvertex"
              text += " " + v3[0];
              text += " " + v3[1];
              text += " " + v3[2];
              text += "\n";

            text += "\tendloop\n";

          text += "\tendfacet\n";

        });

        text += "endsolid\n";

        return text;
    },

    exportClick: function(e){

      var res = this.getFileFromSelected( this.objConverter );

      var wsName = this.currentWorkspace().get('name');

      this.download(wsName + ".obj", res);

    },

    getFileFromSelected: function(converterFunc){

      var ws = this.currentWorkspace();

      var text = "";
      var vertexOffset = 0;

      return ws.get('nodes')
        .filter(function(x){ return x.get('selected'); })
        .map(function(x){ return x.get('prettyLastValue'); })
        .flatten()
        .reduce(function(a, x, i){

          var t = converterFunc(x, vertexOffset, i) || "";

          if ( x && x.vertices && x.vertices.length != undefined) 
            vertexOffset += x.vertices.length;

          return a + t;

        }, text);

    },

    download: function(filename, text) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
        pom.click();
    },

    elementClick: function(ele){

      this.addNode( ele.model.get('name') );

    },

    searchKeyup: function(event) {

      // enter key causes first result to be inserted
      if ( event.keyCode === 13) {

        var nodeName = this.$list.find('.search-element').first().find('.name').first().html();
        if (nodeName === undefined ) return;

        this.addNode( nodeName );

      } 

    } 

  });

});

