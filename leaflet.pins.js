/* global L, config, createGraph,ngraphPath */

L.Control.Pin = L.Control.extend({
	options: {
		position: 'topleft',
	},

	_pins: [],
	_path: [],
	_graph: createGraph(),

	initialize: async function (options) {
		//  apply options to instance
		L.Util.setOptions(this, options);
		if (this.options.keyboard) {
			L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
		}
		const res = await fetch('json/pathfinder.json');
		const json = await res.json();

		json.forEach((v) => {
			this._graph.addLink(v.f, v.t);
		});
		this._pathfinder = ngraphPath.aStar(this._graph, {
			oriented: true,
		});

		this._addPins();
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
			'leaflet-control-pin leaflet-bar-part leaflet-bar-part-top-and-bottom',
			container,
			this._togglePin,
			this,
		);

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

	_addPins: function () {
		let index = window.location.href.indexOf('#');
		if (index > 0) {
			let component = window.location.href.substring(window.location.href.indexOf('#') + 1);
			if (component) {
				let pins = decodeURIComponent(component).split(',');
				if (pins.length > 0) {
					pins.forEach((v) => {
						this._pins.push(v);
						let latlng = v.split(';');
						L.marker(latlng, {name: 'pin', parent: this})
							.addTo(this._map)
							.on('click', this._markerClick);
					});
				}
			}
		}
		this._updatePaths();
	},

	_markerClick: function () {
		this.options.parent._pins.forEach((v) => {
			if (v === this._latlng.lat + ';' + this._latlng.lng) {
				this.options.parent._pins.splice(this.options.parent._pins.indexOf(v), 1);
			}
		});

		this._map.removeLayer(this);
		this._updateURI();
	},

	_updateURI: function () {
		let pins = [];
		this._map.eachLayer(function (layer) {
			if (layer.options.name === 'pin') {
				pins.push([layer._latlng.lat + ';' + layer._latlng.lng]);
			}
		});
		window.location.href = '#' + encodeURIComponent(pins);
		this._updatePaths();
	},

	closestNode: function ([x1, y1]) {
		let [x, y] = this._map.leafletToWorld([y1, x1]);
		return [this._roundNodeLocation(x), this._roundNodeLocation(y)];
	},

	_roundNodeLocation: function (v) {
		let step = config.GridSize / config.NodesPerAxis;
		if (v % step === 0) {
			return Math.floor(v / step) * step + config.GridOffset;
		}
		return Math.floor(v / step) * step + step + config.GridOffset;
	},

	_updatePaths: function () {
		if (this._pins.length === 2) {
			let pin1 = this.closestNode(this._pins[0].split(';'));
			let pin2 = this.closestNode(this._pins[1].split(';'));

			let p = this._pathfinder.find(
				this._map.worldToGPS(pin1[0], pin1[1], config.GPSBounds).toString(),
				this._map.worldToGPS(pin2[0], pin2[1], config.GPSBounds).toString(),
			);
			for (let j = 1; j < p.length; j++) {
				let p1 = this.GPSStringtoLeaflet(p[j - 1].id);
				let p2 = this.GPSStringtoLeaflet(p[j].id);
				let options = {};
				if (this.getDistance(p1, p2) > 2) {
					options.dashArray = '5, 20';
					options.opacity = 0.75;
				}

				let line = L.polyline([p1, p2], options).addTo(this._map);
				this._path.push(line);
			}
		} else {
			this._path.forEach((v) => {
				this._map.removeLayer(v);
			});
		}
	},

	_mouseClick: function (e) {
		if (!e.latlng) {
			return;
		}

		this._pins.push(e.latlng.lat + ';' + e.latlng.lng);
		L.marker(e.latlng, {
			name: 'pin',
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
