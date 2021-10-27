var lpi_nsw_imagery = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  attribution: '&copy; Land and Property Information 2016'
});
var lpi_nsw_topo_map = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/public/NSW_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 21,
  maxNativeZoom: 16,
  attribution: '&copy; Land and Property Information 2016',
  opacity: 0.5
});

var lat = -33.7067; //katoomba
var lng = 150.3156; //katoomba
var map = L.map('map', {
  center: [lat, lng], 
  zoom: 13, 
  layers: [lpi_nsw_imagery, lpi_nsw_topo_map],
  zoomControl: true
	//,	maxBounds: [[-38.83, 135],[-27.05, 159.43]]
});

var opacitySlider = new L.Control.opacitySlider();
map.addControl(opacitySlider);
opacitySlider.setOpacityLayer(lpi_nsw_topo_map);
L.control.scale({metric: true, imperial: false}).addTo(map);
L.control.mouseCoordinate({utm:true,utmref:false}).addTo(map);

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

// ------------
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