// Leaflet.Search
L.Control.Search = L.Control.extend({
    statics: {
    },
    options: {
        position: 'topright',
        fitBounds: true,
        layerOptions: {},
        addToMap: true,
		textPlaceholder: 'Search...' //placeholder value
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
    },

/*    onAdd: function (map) {
        // Initialize map control
				return this._initContainer();
    },

    _initContainer: function () {
	},*/
	onAdd: function (map) {
		this._map = map;
		this._container = L.DomUtil.create('div', 'leaflet-control-search');
		this._input = this._createInput(this.options.textPlaceholder, 'search-input');
		//this._tooltip = this._createTooltip('search-tooltip');
		//this._cancel = this._createCancel(this.options.textCancel, 'search-cancel');
		this._button = this._createButton(this.options.textPlaceholder, 'search-button');
		//this._alert = this._createAlert('search-alert');
    return this._container;
	},
		
	_createInput: function (text, className) {
		var label = L.DomUtil.create('label', className, this._container);
		var input = L.DomUtil.create('input', className, this._container);
		input.type = 'text';
		input.size = 10;//this._inputMinSize;
		input.value = '';
		input.autocomplete = 'off';
		input.autocorrect = 'off';
		input.autocapitalize = 'off';
		input.placeholder = text;
		input.style.display = 'none';
		input.role = 'search';
		input.id = input.role + input.type + input.size;
		
		label.htmlFor = input.id;
		label.style.display = 'none';
		label.value = text;

		/*L.DomEvent
			.disableClickPropagation(input)
			.on(input, 'keydown', this._handleKeypress, this)
			.on(input, 'blur', this.collapseDelayed, this)
			.on(input, 'focus', this.collapseDelayedStop, this);*/
		
		return input;
	},

  _createButton: function (title, className) {
		var button = L.DomUtil.create('a', className, this._container);
		button.href = '#';
		button.title = title;

/*		L.DomEvent
			.on(button, 'click', L.DomEvent.stop, this)
			.on(button, 'click', this._handleSubmit, this)			
			.on(button, 'focus', this.collapseDelayedStop, this)
			.on(button, 'blur', this.collapseDelayed, this);
*/
		return button;
}
});
