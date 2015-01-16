define(['backbone', 'underscore', 'jquery', 'BaseWidgetView'], function(Backbone, _, $, BaseWidgetView) {

  return BaseWidgetView.extend({

    initialize: function(args) {

      BaseWidgetView.prototype.initialize.apply(this, arguments);

      this.model.on('change:selected', this.colorSelected, this);
      this.model.on('change:visible', this.changeVisibility, this);
      this.model.on('remove', this.onRemove, this);
      this.model.on('change:prettyLastValue', this.onEvalComplete, this );
      this.model.workspace.on('change:current', this.changeVisibility, this);

      this.onEvalComplete();

    },

    setMaterials: function(partMat, meshMat, lineMat){

      this.threeGeom.traverse(function(ele) {
        if (ele instanceof THREE.Mesh) {
          ele.material = meshMat;
        } else if (ele instanceof THREE.Line) {
          ele.material = lineMat;
        } else {
          ele.material = partMat;
        }
      });

    },

    colorSelected: function(){

      BaseWidgetView.prototype.colorSelected.apply(this, arguments);

      if ( !( this.threeGeom && this.model.get('visible')) ) return this;

      if (this.model.get('selected')) {

        var meshMat = new THREE.MeshPhongMaterial({color: 0x66d6ff });
        var partMat = new THREE.ParticleBasicMaterial({color: 0x66d6ff, size: 5, sizeAttenuation: false});
        var lineMat = new THREE.LineBasicMaterial({ color: 0x66d6ff });

      } else {

        var meshMat = new THREE.MeshPhongMaterial({color: 0x999999});
        var partMat = new THREE.ParticleBasicMaterial({color: 0x999999, size: 5, sizeAttenuation: false});
        var lineMat = new THREE.LineBasicMaterial({ color: 0x000000 });

      }

      this.setMaterials(partMat, meshMat, lineMat);

      return this;

    }, 

    // 3D move to node subclass
    onRemove: function(){
      this.model.workspace.off('change:current', this.changeVisibility, this);
      scene.remove(this.threeGeom); 
    }, 

    evaluated: false,

    toThreeGeom: function( rawGeom ) {

      var threeGeom = new THREE.Geometry(), face;

      if (!rawGeom) return threeGeom;

      if (!rawGeom.vertices && !rawGeom.linestrip ) return threeGeom;

      if (rawGeom.linestrip) return this.addLineStrip( rawGeom, threeGeom );

      if (rawGeom.vertices && !rawGeom.faces) return this.addPoints( rawGeom, threeGeom );

      for ( var i = 0; i < rawGeom.vertices.length; i++ ) {
        var v = rawGeom.vertices[i];
        threeGeom.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      if (!rawGeom.faces) return threeGeom;

      for ( var i = 0; i < rawGeom.faces.length; i++ ) {
        var f = rawGeom.faces[i];
        face = new THREE.Face3( f[0], f[1], f[2], new THREE.Vector3( f[3][0], f[3][1], f[3][2] ) );
        threeGeom.faces.push( face );
      }
      
      threeGeom._floodType = 0;

      return threeGeom;

    },

    addPoints: function( rawGeom, threeGeom ){

      for ( var i = 0; i < rawGeom.vertices.length; i++ ) {
        var v = rawGeom.vertices[i];
        threeGeom.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      threeGeom._floodType = 1;

      return threeGeom;
    },

    addLineStrip: function( rawGeom, threeGeom ){

      for ( var i = 0; i < rawGeom.linestrip.length; i++ ) {
        var v = rawGeom.linestrip[i];
        threeGeom.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      threeGeom._floodType = 2;

      return threeGeom;
      
    },

    onEvalComplete: function(a, b, newValue){

      if (!newValue && this.evaluated) return;

      this.evaluated = true;

      var lastValue = this.model.get('prettyLastValue');
      var temp;

      if ( !lastValue ) return;

      if ( lastValue.vertices || lastValue.linestrip ){ 
        temp = [];
        temp.push(lastValue);
      } else {
        temp = lastValue; // extract the list
      } 

      var threeTemp = new THREE.Object3D();
      this.drawChunked( threeTemp, temp, function() { 

        if ( this.threeGeom ){
          scene.remove( this.threeGeom );
        }

        this.threeGeom = threeTemp;
        scene.add( this.threeGeom );
        this.changeVisibility();

      }, this );

    }, 

    // creating this data may be quite slow, we'll need to be careful
    drawChunked: function(geom, list, callback, that){

      var i = 0;
      var tick = function() {

        var start = new Date().getTime();
        for (; i < list.length && (new Date().getTime()) - start < 50; i++) {
        
          var g3  = that.toThreeGeom( list[i] );

          if (that.model.get('selected')){
            var color = 0x66d6ff;
          } else {
            var color = 0x999999;
          }

          switch (g3._floodType) {
            case 0:
              geom.add( new THREE.Mesh(g3, new THREE.MeshPhongMaterial({color: color})) );
              break;
            case 1:
              geom.add( new THREE.ParticleSystem(g3, new THREE.ParticleBasicMaterial({color: color, size: 5, sizeAttenuation: false}) ));
              break;
            case 2:
              geom.add( new THREE.Line(g3, new THREE.LineBasicMaterial({ color: 0x000000 })));
              break;
          }

        }

        if (i < list.length) {
          setTimeout(tick, 25);
        } else {
          callback.call(that);
        }

      };

      setTimeout(tick, 0);

    },

    changeVisibility: function(){

      if ( !this.threeGeom ){
        return;
      }
        
      if (!this.model.get('visible') || !this.model.workspace.get('current') )
      {
        this.threeGeom.traverse(function(e) { e.visible = false; });
      } else if ( this.model.get('visible') )
      {
        this.threeGeom.traverse(function(e) { e.visible = true; });
      }

    },

    renderNode: function() {
      
      BaseWidgetView.prototype.renderNode.apply(this, arguments);

      // this.$toggleVis = this.$el.find('.toggle-vis');
      // this.$toggleVis.show();

      // var icon = this.$toggleVis.find('i');
      // var label = this.$toggleVis.find('span');

      // if (this.model.get('visible')){
      //   icon.addClass('icon-eye-open');
      //   icon.removeClass('icon-eye-close');
      //   label.html('Hide geometry');
      // } else {
      //   icon.removeClass('icon-eye-open');
      //   icon.addClass('icon-eye-close');
      //   label.html('Show geometry');
      // }

      return this;

    },

  });

});