define(['backbone', 'underscore', 'jquery', 'BaseNodeView'], function(Backbone, _, $, BaseNodeView) {

    var colors = {
        selected: 0x00FFFF,
        notSelected: 0x999999,
        notSelectedLine: 0x000000
    };

    return BaseNodeView.extend({

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);

      this.model.on('change:selected', this.colorSelected, this);
      this.model.on('change:visible', this.changeVisibility, this);
      this.model.on('remove', this.onRemove, this);
      this.model.workspace.on('change:current', this.changeVisibility, this);
      this.listenTo( this.model, 'change:prettyLastValue', this.onEvalComplete);
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

      render();

    },

    colorSelected: function(){

      BaseNodeView.prototype.colorSelected.apply(this, arguments);

      if ( !( this.threeGeom && this.model.get('visible')) ) return this;

      if (this.model.get('selected')) {

        var meshMat = new THREE.MeshPhongMaterial({color: colors.selected, side: THREE.DoubleSide});
        var partMat = new THREE.ParticleBasicMaterial({color: colors.selected, size: 5, sizeAttenuation: false, side: THREE.DoubleSide});
        var lineMat = new THREE.LineBasicMaterial({color: colors.selected});

      } else {

        var meshMat = new THREE.MeshPhongMaterial({color: colors.notSelected, side: THREE.DoubleSide});
        var partMat = new THREE.ParticleBasicMaterial({color: colors.notSelected, size: 5, sizeAttenuation: false, side: THREE.DoubleSide});
        var lineMat = new THREE.LineBasicMaterial({color: colors.notSelectedLine});

      }

      this.setMaterials(partMat, meshMat, lineMat);

      return this;

    }, 

    formatPreview: function(data){

      // ugh this is terrible code

      if (data == null || data === undefined)
        return BaseNodeView.prototype.formatPreview.apply(this, arguments);

      if (data.length === undefined && !data.normal && !data.polygons && !data.vertices) 
        return BaseNodeView.prototype.formatPreview.apply(this, arguments);

      if (data.length > 0 && !data[0].normal && !data[0].polygons && !data[0].vertices) 
        return BaseNodeView.prototype.formatPreview.apply(this, arguments);

      if (data.normal) return "Plane";
      if (data.polygons) return "Solid";
      if (data.vertices) return "Polygon";

      if (data.length) {

        var solidCount = 0;
        var polyCount = 0;
        var planeCount = 0;

        for (var i = 0; i < data.length; i++) {
          if ( data[i].polygons ) solidCount++;
          if ( data[i].normal ) planeCount++;
          if ( data[i].vertices ) polyCount++;
        }

        var solidString = solidCount + " Solids";
        var polyString = polyCount + " Polygons";
        var planeString = planeCount + " Planes";

        var stringArr = [];

        if (solidCount > 0) stringArr.push(solidString);
        if (planeCount > 0) stringArr.push(planeString);
        if (polyCount > 0) stringArr.push(polyString);

        if (planeCount === 0 && solidCount === 0 && polyCount === 0) return "Nothing";

        return stringArr.join(',');

      }
      return "Nothing";

    },

    // 3D move to node subclass
    onRemove: function(){
      this.model.workspace.off('change:current', this.changeVisibility, this);
      scene.remove(this.threeGeom); 
      render();
    }, 

    evaluated: false,

    toThreeGeom: function( rawGeom ) {

      var threeGeom = new THREE.Geometry(), face;

      if (!rawGeom || !rawGeom.vertices && !rawGeom.linestrip )
          return threeGeom;

      //rawGeom.vertices || rawGeom.linestrip
      if (rawGeom.linestrip)
          return this.addLineStrip( rawGeom, threeGeom );

      // !linestrip, rawGeom.vertices
      if (!rawGeom.faces)
          return this.addPoints( rawGeom, threeGeom );

      // rawGeom.faces, !linestrip, rawGeom.vertices
      for ( var i = 0; i < rawGeom.vertices.length; i++ ) {
        var v = rawGeom.vertices[i];
        threeGeom.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      // impossible case
      //if (!rawGeom.faces)
          //return threeGeom;

      for ( var i = 0; i < rawGeom.faces.length; i++ ) {
        var f = rawGeom.faces[i];
        face = new THREE.Face3( f[0], f[1], f[2],
          [ new THREE.Vector3( f[3][0], f[3][1], f[3][2] ),
            new THREE.Vector3( f[3][3], f[3][4], f[3][5] ),
            new THREE.Vector3( f[3][6], f[3][7], f[3][8] )
          ]);
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

    onEvalComplete: function(newValue){

      //if (!newValue && this.evaluated)
          //return;

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
        var color, colorLine;
        if (that.model.get('selected')){
          color = colorLine = colors.selected;
        }
        else {
          color = colors.notSelected;
          colorLine = colors.notSelectedLine;
        }
        var meshMat = new THREE.MeshPhongMaterial({color: color, side: THREE.DoubleSide});
        var partMat = new THREE.ParticleBasicMaterial({color: color, size: 5, sizeAttenuation: false, side: THREE.DoubleSide});
        var lineMat = new THREE.LineBasicMaterial({ color: colorLine });

        var start = new Date().getTime();
        for (; i < list.length && (new Date().getTime()) - start < 50; i++) {
        
          var g3  = that.toThreeGeom( list[i] );



          switch (g3._floodType) {
            case 0:
              geom.add( new THREE.Mesh(g3, meshMat));
              break;
            case 1:
              geom.add( new THREE.ParticleSystem(g3, partMat));
              break;
            case 2:
              geom.add( new THREE.Line(g3, lineMat));
              break;
          }

        }

        if (i < list.length) {
          setTimeout(tick, 25);
        }
        else {
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
        scene.remove(this.threeGeom);
      } else if ( this.model.get('visible') )
      {
        scene.add(this.threeGeom);
      }

      render();

    },

    renderNode: function() {
      
      BaseNodeView.prototype.renderNode.apply(this, arguments);

      this.$toggleVis = this.$el.find('.toggle-vis');
      this.$toggleVis.show();

      var icon = this.$toggleVis.find('i');
      var label = this.$toggleVis.find('span');

      if (this.model.get('visible')){
        icon.addClass('icon-eye-open');
        icon.removeClass('icon-eye-close');
        label.html('Hide geometry');
      } else {
        icon.removeClass('icon-eye-open');
        icon.addClass('icon-eye-close');
        label.html('Show geometry');
      }

      return this;

    }

  });

});