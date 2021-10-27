var params = {};
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
  params[key] = value;
});
var init = {"lat": -33.7067, "lng": 150.3156, "zoom": 13 } //katoomba

var lpi_nsw_imagery = L.tileLayer.fallback('https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  attribution: '&copy; Department Finance, Services and Innovation 2017'
});
var lpi_nsw_topo_map = L.tileLayer('https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  maxNativeZoom: 16,
  attribution: '&copy; Department Finance, Services and Innovation 2017',
  opacity: 0.7
});
var lpi_nsw_basemap = L.tileLayer('https://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Base_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  //attribution: '&copy; Department Finance, Services and Innovation 2017'
});

var lat = params.lat || init.lat;
var lng = params.lng || init.lng;
var map = L.map('map', {
  center: [lat, lng], 
  zoom: params.zoom || init.zoom, 
  layers: [lpi_nsw_imagery, lpi_nsw_topo_map],
  zoomControl: true
});

//-----------------
//From
//http://stackoverflow.com/questions/31221088/how-to-calculate-the-distance-of-a-polyline-in-leaflet-like-geojson-io
L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
    getDistance: function(latlngs, system) {
        // distance in meters
        var mDistance = 0,
            length = latlngs.length;
        for (var i = 1; i < length; i++) {
            mDistance += latlngs[i].distanceTo(latlngs[i - 1]);
        }
        // optional
        if (system === 'imperial') {
            return mDistance / 1609.34;
        } else {
            return mDistance / 1000;
        }
	}
});

var opacitySlider = new L.Control.opacitySlider();
map.addControl(opacitySlider);
opacitySlider.setOpacityLayer(lpi_nsw_topo_map);
L.control.scale({metric: true, imperial: false}).addTo(map);
L.control.mouseCoordinateNSW({utm:true,nswmap:true}).addTo(map);
map.addControl(new L.Control.MiniMap(lpi_nsw_basemap,{toggleDisplay:true,minimized:true}));

//-----------------
//Leaflet.FileLayer
var style = {color:'red', opacity: 1.0, fillOpacity: 0.1, weight: 2, clickable: true};
L.Control.FileLayerLoad.LABEL = '<i class="fa fa-folder-open"></i>';
L.Control.fileLayerLoad({
  fitBounds: true,
  layerOptions: {
    style: style,
    pointToLayer: function (data, latlng) {
      return L.marker(latlng);
    }
    ,onEachFeature: onEachFeature
  },
  fileSizeLimit: 4096
}).addTo(map);

// -----------
// Leaflet.Draw
// Initialise the FeatureGroup to store editable layers
//var drawnItems = new L.FeatureGroup();
var drawnItems = new L.GeoJSON();
map.addLayer(drawnItems);

var drawOptions = {
  draw: {
    polyline: {
      shapeOptions: {
        color: 'red',
        weight: 2,
        opacity: 1
      }
    },
    polygon: {
      allowIntersection: false, // Restricts shapes to simple polygons
      drawError: {
        color: '#e1e100', // Color the shape will turn when intersects
        message: 'Polygon can\'t overlap' // Message that will show when intersect
      },
      shapeOptions: {
        color: 'red',
        weight: 2
      }
    },
    circle: false, 
    rectangle: false, 
  },
  edit: {
    featureGroup: drawnItems
  }  
}


// Initialise the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw(drawOptions);
map.addControl(drawControl);

var getShapeType = function(layer) {
  if (layer instanceof L.Circle) { return 'circle'; }
  if (layer instanceof L.Marker) { return 'marker'; }
  if (layer instanceof L.Rectangle) { return 'rectangle'; }
  if (layer instanceof L.Polygon) { return 'polygon'; }
  if (layer instanceof L.Polyline) { return 'polyline'; }
};

map.on('draw:created', function(e) {
  var measure = '';
  if (e.layerType === 'polygon') {
    measure = (L.GeometryUtil.geodesicArea(e.layer.getLatLngs()) / 1000000).toFixed(2) + ' km<sup>2</sup>';
  }
  if (e.layerType === 'polyline') {
    measure = L.GeometryUtil.getDistance(e.layer.getLatLngs()).toFixed(2) + ' km';
  }
  var input = L.DomUtil.create('input', 'my-input');
  input.value = '';
  e.layer.feature = {"properties":{"name":""}};
  e.layer.feature.type = "Feature";
  if (e.layerType === 'marker') {e.layer.feature.geometry = {"type":"Point"}};
  if (e.layerType === 'polyline') {e.layer.feature.geometry = {"type":"LineString"}};
  if (e.layerType === 'polygon') {e.layer.feature.geometry = {"type":"Polygon"}};
  L.DomEvent.addListener(input, 'change', function () {
    e.layer.feature.properties.name = input.value;
    e.layer.bindLabel(e.layer.feature.properties.name);
    if (e.layer.feature.properties.name && (e.layer.feature.geometry.type === "LineString" || e.layer.feature.geometry.type === "Polygon" )) {e.layer.bindLabel(e.layer.feature.properties.name + ' - ' + measure)}
    else if (e.layer.feature.geometry.type === "LineString" || e.layer.feature.geometry.type === "Polygon" ) {e.layer.bindLabel(measure)}
  });
  L.DomEvent.addListener(input, 'keydown', function (v) {
    if (v.keyCode == 13) {e.layer.closePopup();} //close on enter
  });
  e.layer.bindPopup(input);
  if (e.layer.feature.properties.name) {e.layer.bindLabel(e.layer.feature.properties.name + ' - ' + measure)}
  else {e.layer.bindLabel(measure)};
  drawnItems.addLayer(e.layer);
  if (e.layerType === 'marker') {
    e.layer.openPopup();
    input.focus();
  }
});

map.on('draw:edited', function(e) {
  var layers = e.layers;
  layers.eachLayer(function (layer) {
    if (getShapeType(layer) === 'polygon') {
      measure = ((L.GeometryUtil.geodesicArea(layer.getLatLngs()) / 1000000).toFixed(2) + ' km<sup>2</sup>');
      if (layer.feature.properties.name) {layer.bindLabel(layer.feature.properties.name + ' - ' + measure)}
      else {layer.bindLabel(measure)};
    }
    if (getShapeType(layer) === 'polyline') {
      measure = L.GeometryUtil.getDistance(layer.getLatLngs()).toFixed(2) + ' km';
      if (layer.feature.properties.name) {layer.bindLabel(layer.feature.properties.name + ' - ' + measure)}
      else {layer.bindLabel(measure)};
    }
    if (getShapeType(layer) === 'marker') {
      layer.bindLabel(name);
    }
  });
});


// Leaflet.Save 
// Save to KML requires tokml.js, Save to GPX requires togpx.js
L.Control.Save = L.Control.extend({
    statics: {
    },
    options: {
        position: 'topleft',
        fitBounds: true,
        layerOptions: {},
        addToMap: true,
        exportType: 'geojson', // 'geojson','kml','gpx'
				title: 'Export drawn data to GeoJSON',
				label: '&#8965;'
    },

    initialize: function (featureGroup, options) {
        L.Util.setOptions(this, options);
				if (this.options.exportType === 'kml') { this.options.title = 'Export drawn data to KML'}
				if (this.options.exportType === 'gpx') { this.options.title = 'Export drawn data to GPX'}
        this._featureGroup = featureGroup;
    },

    onAdd: function (map) {
        // Initialize map control
				return this._initContainer();
    },

    _initContainer: function () {
        var zoomName = 'leaflet-control-save leaflet-control-zoom',
            barName = 'leaflet-bar',
            partName = barName + '-part',
            container = L.DomUtil.create('div', zoomName + ' ' + barName);
        var link = L.DomUtil.create('a', zoomName + '-in ' + partName, container);
        link.innerHTML = this.options.label;
        link.href = '#';
        link.title = this.options.title;

        L.DomEvent.disableClickPropagation(link);
        L.DomEvent.on(link, 'click', function (e) {
          var data = this._featureGroup.toGeoJSON();
          var json = JSON.stringify(data);
          if (this.options.exportType === 'geojson') {
            blob = new Blob([json], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "data.geojson");
          } else if (this.options.exportType === 'kml') {
						var kml = tokml(data);
						blob = new Blob([kml], {type: "application/vnd.google-earth.kml+xml;charset=utf-8"});
						saveAs(blob, "data.kml");          
          } else if (this.options.exportType === 'gpx') {
						var gpx = togpx(data);
						blob = new Blob([gpx], {type: "application/gpx+xml;charset=utf-8"});
						saveAs(blob, "data.gpx");          
          }
          e.preventDefault();
        }, this);
        return container;
    }
});

var saveGPX = new L.Control.Save(drawnItems, {exportType: 'gpx', label: '<span class="fa-stack">\n' +
'    <i class="fa fa-save fa-pull-left"></i>\n'+
'    <i class="fa fa-stack-1x">G</i>\n'+
'</span>'});
map.addControl(saveGPX);
var saveKML = new L.Control.Save(drawnItems, {exportType: 'kml', label: '<span class="fa-stack">\n' +
'    <i class="fa fa-save fa-pull-left"></i>\n'+
'    <i class="fa fa-stack-1x">K</i>\n'+
'</span>'});
map.addControl(saveKML);
var saveGeoJSON = new L.Control.Save(drawnItems, {exportType: 'geojson', label: '<span class="fa-stack">\n' +
'    <i class="fa fa-save fa-pull-left"></i>\n'+
'    <i class="fa fa-stack-1x">G</i>\n'+
'</span>'});
map.addControl(saveGeoJSON);
// Leaflet.Permalink 
// Allows sharing of a permanent link. 
// Requires 
L.Control.Permalink = L.Control.extend({
    statics: {
    },
    options: {
        position: 'topleft',
        layerOptions: {},
        addToMap: true,
				title: 'Share via link',
				label: '&#8965;'
    },

    initialize: function (featureGroup, options) {
        L.Util.setOptions(this, options);
        this._featureGroup = featureGroup;
    },

    onAdd: function (map) {
        // Initialize map control
				return this._initContainer();
    },

    _initContainer: function () {
        var zoomName = 'leaflet-control-permalink leaflet-control-zoom',
            barName = 'leaflet-bar',
            partName = barName + '-part',
            container = L.DomUtil.create('div', zoomName + ' ' + barName);
        var link = L.DomUtil.create('a', zoomName + '-in ' + partName, container);
        link.innerHTML = this.options.label;
        link.href = '#';
        link.title = this.options.title;

        L.DomEvent.disableClickPropagation(link);
        L.DomEvent.on(link, 'click', function (e) {
          var _params = {};
          _params.lat = map.getCenter().lat;
          _params.lng = map.getCenter().lng;
          _params.zoom = map.getZoom();
          if (this._featureGroup.getLayers().length > 0) {
            var data = this._featureGroup.toGeoJSON();
            var id = Date.now();
            _params.id = id;
            $.ajax({
              type : "POST",
              url : "save_geojson.php",
              data : { id: id, json : JSON.stringify(data) },
              error: function(xhr){ alert("An error occured: " + xhr.status + " " + xhr.statusText); },
              success: function(xhr){ window.prompt("Copy to clipboard: Ctrl/Cmd+C, Enter", [location.protocol, '//', location.host, location.pathname].join('') + '?' + $.param(_params)); }
            });
          } else {
            window.prompt("Copy to clipboard: Ctrl/Cmd+C, Enter", [location.protocol, '//', location.host, location.pathname].join('') + '?' + $.param(_params));
          }
          e.preventDefault();
        }, this);
        return container;
    }
});

var shareLink = new L.Control.Permalink(drawnItems, {label: '<i class="fa fa-link"></i>'});
map.addControl(shareLink);

//Leaflet.Search
var nsw_map_loc = [];
nsw_map_bounds.forEach(function(e) {
  var x = e["mapnumber"].substr(0,2);
  var y = e["mapnumber"].substr(2,2);
  var lng = (parseInt(x,10)+211)/2;
  var lat = (parseInt(y,10)-98)/2;
  if (e["mapnumber"].charAt(4) == "-") {//50K & 25K
    if (e["mapnumber"].charAt(e["mapnumber"].length-2) == "-") { //50K
      if(e["mapnumber"].charAt(5) =='N') {
        lat += 0.25;
      }
      var clat = lat+0.125;
      var clng = lng+0.25;
    } else if (e["mapnumber"].charAt(e["mapnumber"].length-3) == "-") { //25K
      if (e["mapnumber"].charAt(5)=="1" || e["mapnumber"].charAt(5)=="2") { 
        lng += 0.25;
      }
      if (e["mapnumber"].charAt(5)=="1" || e["mapnumber"].charAt(5)=="4") { 
        lat += 0.25;
      }
      if (e["mapnumber"].charAt(6)=="N") {
        lat += 0.125;
      }
      var clat = lat+0.0625;
      var clng = lng+0.125;
    } else {//Inset
      return;
    }
  } else {//100K
    var clat = lat+0.25;
    var clng = lng+0.25;
  }
  nsw_map_loc.push({"loc":[clat,clng],"title":e.maptitle});
});

function localData(text, callResponse) {
  callResponse(nsw_map_loc);
  return {	//called to stop previous requests on map move
    abort: function() {
      console.log('aborted request:'+ text);
    }
  };
}
var searchOptions = {
  position: 'topright',
  sourceData: localData,
  textPlaceholder:'Find a map by name...',
  minLength: 2,
  hideMarkerOnCollapse: true
  //,collapsed: false
  //,autoCollapse: true
}
var search = new L.Control.Search(searchOptions);
map.addControl(search);

// Add previously saved GeoJSON or loaded file to map, and allow editing?
function onEachFeature(feature, layer) {
  var measure = '';
  if (feature.geometry.type === 'Polygon') {
    measure = (L.GeometryUtil.geodesicArea(layer.getLatLngs()) / 1000000).toFixed(2) + ' km<sup>2</sup>';
  }
  if (feature.geometry.type === 'LineString') {
    measure = L.GeometryUtil.getDistance(layer.getLatLngs()).toFixed(2) + ' km';
  }  
  var input = L.DomUtil.create('input', 'my-input');
  if (feature.properties && feature.properties.name) {
    input.value = feature.properties.name;
  } else {feature.properties.name = ''}
  L.DomEvent.addListener(input, 'change', function () {
    feature.properties.name = input.value;
    layer.bindLabel(feature.properties.name);
    if (feature.properties.name && (feature.geometry.type === "LineString" || feature.geometry.type === "Polygon" )) {layer.bindLabel(feature.properties.name + ' - ' + measure)}
    else if (feature.geometry.type === "LineString" || feature.geometry.type === "Polygon" ) {layer.bindLabel(measure)}
  });
  L.DomEvent.addListener(input, 'keydown', function (v) {
    if (v.keyCode == 13) {layer.closePopup();}
  });
  layer.bindPopup(input);
  layer.bindLabel(feature.properties.name);
  if (feature.properties.name && (feature.geometry.type === "LineString" || feature.geometry.type === "Polygon" )) {layer.bindLabel(feature.properties.name + ' - ' + measure)}
  else if (feature.geometry.type === "LineString" || feature.geometry.type === "Polygon" ) {layer.bindLabel(measure)}
  drawnItems.addLayer(layer); //dodgy adding to global?
}

if (params.id) {
  var geojsonLayer = new L.geoJson.ajax('data/' + params.id + '.geojson', { onEachFeature: onEachFeature, color: 'red', weight: 2, opacity: 1 } );
  geojsonLayer.on('data:progress', function(e) {
    map.fitBounds(geojsonLayer.getBounds(),{ padding: [50,50], maxZoom: 16 });
  });
  geojsonLayer.addTo(map);
}

// from https://github.com/mapbox/geojson-flatten/blob/master/index.js

function flatten(gj) {
    switch ((gj && gj.type) || null) {
        case 'FeatureCollection':
            gj.features = gj.features.reduce(function(mem, feature) {
                return mem.concat(flatten(feature));
            }, []);
            return gj;
        case 'Feature':
            if (!gj.geometry) return gj;
            return flatten(gj.geometry).map(function(geom) {
                return {
                    type: 'Feature',
                    properties: JSON.parse(JSON.stringify(gj.properties)),
                    geometry: geom
                };
            });
        case 'MultiPoint':
            return gj.coordinates.map(function(_) {
                return { type: 'Point', coordinates: _ };
            });
        case 'MultiPolygon':
            return gj.coordinates.map(function(_) {
                return { type: 'Polygon', coordinates: _ };
            });
        case 'MultiLineString':
            return gj.coordinates.map(function(_) {
                return { type: 'LineString', coordinates: _ };
            });
        case 'GeometryCollection':
            return gj.geometries.map(flatten).reduce(function(memo, geoms) {
                return memo.concat(geoms);
            }, []);
        case 'Point':
        case 'Polygon':
        case 'LineString':
            return [gj];
    }
}
