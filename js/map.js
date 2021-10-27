var params = {};
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
  params[key] = value;
});

var lpi_nsw_imagery = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  attribution: '&copy; Land and Property Information 2016'
});
var lpi_nsw_topo_map = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  maxNativeZoom: 16,
  attribution: '&copy; Land and Property Information 2016',
  opacity: 0.7
});

var lat = params.lat || -33.7067; //katoomba
var lng = params.lng || 150.3156; //katoomba
var map = L.map('map', {
  center: [lat, lng], 
  zoom: params.zoom || 13, 
  layers: [lpi_nsw_imagery, lpi_nsw_topo_map],
  zoomControl: true
});

var opacitySlider = new L.Control.opacitySlider();
map.addControl(opacitySlider);
opacitySlider.setOpacityLayer(lpi_nsw_topo_map);
L.control.scale({metric: true, imperial: false}).addTo(map);
L.control.mouseCoordinateNSW({utm:true,nswmap:true}).addTo(map);

//-----------------
//Leaflet.FileLayer
var style = {color:'red', opacity: 1.0, fillOpacity: 1.0, weight: 2, clickable: false};
L.Control.FileLayerLoad.LABEL = '<i class="fa fa-folder-open"></i>';
L.Control.fileLayerLoad({
    fitBounds: true,
    layerOptions: {style: style,
                   pointToLayer: function (data, latlng) {
                      return L.marker(latlng);
                   }
                   , onEachFeature: function (feature, layer) {layer.bindPopup(feature.properties.name);}
                   },
}).addTo(map);

// -----------
// Leaflet.Draw
// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialise the draw control and pass it the FeatureGroup of editable layers
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
      circle: false,
      rectangle: false
    }
});
map.addControl(drawControl);

var getShapeType = function(layer) {
  if (layer instanceof L.Circle) { return 'circle'; }
  if (layer instanceof L.Marker) { return 'marker'; }
  if (layer instanceof L.Rectangle) { return 'rectangle'; }
  if (layer instanceof L.Polygon) { return 'polygon'; }
  if (layer instanceof L.Polyline) { return 'polyline'; }
};

map.on('draw:created', function(e) {
  if (e.layerType === 'polygon') {
    var area = L.GeometryUtil.geodesicArea(e.layer.getLatLngs());
    e.layer.bindPopup((area / 1000000).toFixed(2) + ' km<sup>2</sup>');
  }
  drawnItems.addLayer(e.layer);
  e.layer.openPopup();
});

map.on('draw:edited', function(e) {
  var layers = e.layers;
  layers.eachLayer(function (layer) {
    if (getShapeType(layer) === 'polygon') {
      var area = L.GeometryUtil.geodesicArea(layer.getLatLngs())
      layer.bindPopup((area / 1000000).toFixed(2) + ' km<sup>2</sup>');
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

var saveKML = new L.Control.Save(drawnItems, {exportType: 'kml', label: '<span class="fa-stack">\n' +
'    <i class="fa fa-save fa-pull-left"></i>\n'+
'    <i class="fa fa-stack-1x">K</i>\n'+
'</span>'});
map.addControl(saveKML);
var saveGPX = new L.Control.Save(drawnItems, {exportType: 'gpx', label: '<span class="fa-stack">\n' +
'    <i class="fa fa-save fa-pull-left"></i>\n'+
'    <i class="fa fa-stack-1x">G</i>\n'+
'</span>'});
map.addControl(saveGPX);

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

// Add previously saved GeoJSON to map
function onEachFeature(feature, layer) {
  if (feature.properties && feature.properties.name) {
    layer.bindLabel(feature.properties.name);
  }
}
if (params.id) {
  var geojsonLayer = new L.geoJson.ajax('data/' + params.id + '.geojson', { onEachFeature: onEachFeature } );
  geojsonLayer.on('data:progress', function(e) {
    map.fitBounds(geojsonLayer.getBounds(),{ padding: [50,50], maxZoom: 16 });
  });
  geojsonLayer.addTo(map);
}
