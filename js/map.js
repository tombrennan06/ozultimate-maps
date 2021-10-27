var lpi_nsw_topo_map_s1 = L.tileLayer('http://maps.six.nsw.gov.au/arcgis/rest/services/sixmaps/LPITopoMap_S1/MapServer/tile/{z}/{y}/{x}', {
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
  layers: [lpi_nsw_topo_map_s1, lpi_nsw_topo_map],
  zoomControl: true
});

var opacitySlider = new L.Control.opacitySlider();
map.addControl(opacitySlider);
opacitySlider.setOpacityLayer(lpi_nsw_topo_map);
L.control.scale({metric: true, imperial: false}).addTo(map);
L.control.mouseCoordinate({utm:true,utmref:false}).addTo(map);