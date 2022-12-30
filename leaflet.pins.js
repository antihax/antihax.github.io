/* global L, config, createGraph,ngraphPath */

L.Control.Pin = L.Control.extend({
	options: {
		position: 'topleft',
	},
	_gPins: [],
	_lPins: [],

	initialize: async function (options) {
		//  apply options to instance
		L.Util.setOptions(this, options);
		if (this.options.keyboard) {
			L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
		}
	},

	getDistance: function (p1, p2) {
		let distance = Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
		return distance;
	},

	GPSStringtoLeaflet: function (str) {
		let a = str.split(',');
		let long = (a[1] - config.GPSBounds.min[1]) * config.YScale * 1.28,
			lat = (a[0] - config.GPSBounds.min[0]) * config.XScale * 1.28;
		return [long, lat];
	},

	onAdd: function () {
		let className = 'leaflet-control-zoom leaflet-bar leaflet-control';
		let container = L.DomUtil.create('div', className);
		this._createButton(
			'&#128204;',
			'Pin',
			'leaflet-control-pin leaflet-bar-part',
			container,
			this._togglePin,
			this,
		);
		let me = this;
		fetch('json' + this._map.options.config.version + '/regions.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (regions) {
				me._regions = regions;
				me._addPins();
			});

		return container;
	},

	onRemove: function () {
		if (this.options.keyboard) {
			L.DomEvent.off(document, 'keydown', this._onKeyDown, this);
		}
	},

	_createButton: function (html, title, className, container, fn, context) {
		let link = L.DomUtil.create('a', className, container);
		link.innerHTML = html;
		link.href = '#';
		link.title = title;

		L.DomEvent.on(link, 'click', L.DomEvent.stopPropagation)
			.on(link, 'click', L.DomEvent.preventDefault)
			.on(link, 'click', fn, context)
			.on(link, 'dbclick', L.DomEvent.stopPropagation);
		return link;
	},

	_togglePin: function () {
		this._pinning = !this._pinning;
		if (this._pinning) {
			L.DomUtil.addClass(this._container, 'leaflet-control-pin-on');
			this._startPinning();
		} else {
			L.DomUtil.removeClass(this._container, 'leaflet-control-pin-on');
			this._stopPinning();
		}
	},

	_startPinning: function () {
		this._oldCursor = this._map._container.style.cursor;
		this._map._container.style.cursor = 'crosshair';
		this._doubleClickZoom = this._map.doubleClickZoom.enabled();
		this._map.doubleClickZoom.disable();
		this._isRestarted = false;

		L.DomEvent.on(this._map, 'mousemove', this._mouseMove, this).on(
			this._map,
			'click',
			this._mouseClick,
			this,
		);

		if (!this._layerPaint) {
			this._layerPaint = L.layerGroup().addTo(this._map);
		}

		if (!this._points) {
			this._points = [];
		}
	},

	_stopPinning: function () {
		this._map._container.style.cursor = this._oldCursor;

		L.DomEvent.off(this._map, 'mousemove', this._mouseMove, this).off(
			this._map,
			'click',
			this._mouseClick,
			this,
		);

		if (this._doubleClickZoom) {
			this._map.doubleClickZoom.enabled();
		}
		if (this._layerPaint) {
			this._layerPaint.clearLayers();
		}
	},

	_mouseMove: function (e) {
		if (!e.latlng || !this._lastPoint) {
			return;
		}
		if (!this._layerPaintPathTemp) {
			//  customize style
			this._layerPaintPathTemp = L.polyline([this._lastPoint, e.latlng], {
				color: this.options.lineColor,
				weight: this.options.lineWeight,
				opacity: this.options.lineOpacity,
				clickable: false,
				dashArray: this.options.lineDashArray,
				interactive: false,
			}).addTo(this._layerPaint);
		} else {
			//  replace the current layer to the newest draw points
			this._layerPaintPathTemp.getLatLngs().splice(0, 2, this._lastPoint, e.latlng);
			//  force path layer update
			this._layerPaintPathTemp.redraw();
		}
	},

	_localGPStoWorld: function (grid, long, lat) {
		let [gridX, gridY] = this._map.gridStringToIntegers(grid);
		let outX, outY;
		Object.values(this._regions).forEach((v) => {
			if (gridX <= v.MaxX && gridX >= v.MinX && gridY <= v.MaxY && gridY >= v.MinY) {
				let xEdge = config.GridSize * (v.MaxX - v.MinX + 1);
				let yEdge = config.GridSize * (v.MaxY - v.MinY + 1);
				outX = this._map.constraintInv(long, -100, 100, 0, xEdge) + v.MinX * config.GridSize;
				outY = this._map.constraintInv(lat, 100, -100, 0, yEdge) + v.MinY * config.GridSize;
				return false;
			}
		});
		return [outX, outY];
	},

	_addPins: function () {
		const params = new URLSearchParams(
			window.location.href.substring(window.location.href.indexOf('#') + 1),
		);
		if (params.has('gps')) {
			let pins = params.get('gps').split(',');
			pins.forEach((v) => {
				this._gPins.push(v);
				L.marker(v.split(';'), {name: 'globalPin', v: v, parent: this})
					.addTo(this._map)
					.on('click', this._gMarkerClick);
			});
		}
		if (params.has('localgps')) {
			let pins = params.get('localgps').split(',');
			pins.forEach((v) => {
				this._lPins.push(v);
				let pinDetail = v.split(';');
				let [x, y] = this._localGPStoWorld(
					pinDetail[0],
					parseInt(pinDetail[1]),
					parseInt(pinDetail[2]),
				);
				L.marker(this._map.worldToLeaflet(x, y), {name: 'localPin', v: v, parent: this})
					.addTo(this._map)
					.on('click', this._lMarkerClick);
			});
		}
	},

	_gMarkerClick: function () {
		let parent = this.options.parent;
		parent._gPins.forEach((v) => {
			if (v === this._latlng.lat + ';' + this._latlng.lng) {
				this.options.parent._gPins.splice(this.options.parent._gPins.indexOf(v), 1);
			}
		});
		this._map.removeLayer(this);
		parent._updateURI();
	},

	_lMarkerClick: function () {
		let parent = this.options.parent;
		parent._lPins.forEach((v) => {
			if (v === this._latlng.lat + ';' + this._latlng.lng) {
				this.options.parent._lPins.splice(this.options.parent._lPins.indexOf(v), 1);
			}
		});
		this._map.removeLayer(this);
		parent._updateURI();
	},

	_updateURI: function () {
		let params = this._map.getClientParameters();
		let lPins = [],
			gPins = [];

		this._map.eachLayer(function (layer) {
			if (layer.options.name === 'globalPin') {
				gPins.push([layer.options.v]);
			} else if (layer.options.name === 'localPin') {
				lPins.push([layer.options.v]);
			}
		});
		if (lPins.length > 0) params.set('localgps', lPins.join(','));
		else params.delete('localgps');
		if (gPins.length > 0) params.set('gps', gPins.join(','));
		else params.delete('gps');

		this._map.setClientParameters(params);
	},

	_mouseClick: function (e) {
		if (!e.latlng) {
			return;
		}

		this._gPins.push(e.latlng.lat + ';' + e.latlng.lng);
		L.marker(e.latlng, {
			name: 'globalPin',
			v: e.latlng.lat + ';' + e.latlng.lng,
			parent: this,
		})
			.addTo(this._map)
			.on('click', this._markerClick);
		this._updateURI();
	},

	_onKeyDown: function (e) {
		// key control
		switch (e.keyCode) {
			case this.options.activeKeyCode:
				if (!this._pinning) {
					this._togglePin();
				}
				break;
			case this.options.cancelKeyCode:
				//  if pinning, cancel pinning
				if (this._pinning) {
					if (!this._lastPoint) {
						this._togglePin();
					} else {
						this._isRestarted = false;
					}
				}
				break;
		}
	},
});

L.control.pin = function (options) {
	return new L.Control.Pin(options);
};

L.Map.mergeOptions({
	pinControl: false,
});

L.Map.addInitHook(function () {
	this.pinControl = new L.Control.Pin();
	this.addControl(this.pinControl);
});
