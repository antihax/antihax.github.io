/* global L, config, createGraph,ngraphPath */

L.Control.PathFinder = L.Control.extend({
	options: {
		position: 'topleft',
	},

	_icon: L.divIcon({
		iconSize: [16, 16],
		iconAnchor: [8, 8],
		className: 'div-marker',
		html: '&#x274C;',
	}),

	_arrowIcon: L.icon({
		iconUrl: 'icons/Arrow.svg',
		iconSize: [12, 12],
		iconAnchor: [6, 6],
	}),

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
		const json = await res.json().then((data) => {
			data.forEach((v) => {
				this._graph.addLink(v.f, v.t, {weight: 20});
			});
			this._pathfinder = ngraphPath.aStar(this._graph, {
				oriented: true,
				distance(fromNode, toNode, link) {
					return link.data.weight;
				},
			});
			this._addPins();
		});
	},

	getDistance: function (p1, p2) {
		let distance = Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
		return distance;
	},

	onAdd: function () {
		let className = 'leaflet-control-zoom leaflet-bar';
		let container = L.DomUtil.create('div', className);
		this._createButton(
			'&#x1F6A2;',
			'PathFinder',
			'leaflet-control-pathfinder',
			container,
			this._togglePin,
			this,
		);
		this._createButton(
			'&#128269;',
			'Optimize Path',
			'leaflet-control-pathfinder',
			container,
			this._optimize,
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

	_optimize: function () {
		if (this._pins.length >= 3) {
			let pins = [this._pins[0]];
			let last = this._pins.shift();

			while (this._pins.length > 0) {
				let shortest = 0,
					shortestDistance = 0;

				for (let i = 0; i < this._pins.length; i++) {
					let pin1 = this._closestNode(last.split(';')),
						pin2 = this._closestNode(this._pins[i].split(';'));

					let p = this._pathfinder.find(pin1.toString(), pin2.toString());
					if (shortestDistance == 0 || p.length < shortestDistance) {
						shortestDistance = p.length;
						shortest = i;
					}
				}
				pins.push(this._pins[shortest]);
				last = this._pins[shortest];
				this._pins.splice(shortest, 1);
			}
			this._pins = pins;
			this._updatePaths();
			this._updateURI();
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
		const params = new URLSearchParams(
			window.location.href.substring(window.location.href.indexOf('#') + 1),
		);

		if (params.has('pathFinder')) {
			let pins = params.get('pathFinder').split(',');
			pins.forEach((v) => {
				this._pins.push(v);
				L.marker(v.split(';'), {name: 'pathFinder', icon: this._icon, v: v, parent: this})
					.addTo(this._map)
					.on('click', this._markerClick);
			});
		}
		this._updatePaths();
	},

	_markerClick: function () {
		let parent = this.options.parent;
		parent._pins.forEach((v) => {
			if (v === this._latlng.lat + ';' + this._latlng.lng) {
				this.options.parent._pins.splice(this.options.parent._pins.indexOf(v), 1);
			}
		});
		this._map.removeLayer(this);
		parent._updateURI();
		parent._updatePaths();
	},

	_updateURI: function () {
		let pins = [];
		let params = this._map.getClientParameters();
		if (this._pins.length > 0) params.set('pathFinder', this._pins.join(','));
		else params.delete('pathFinder');

		this._map.setClientParameters(params);
	},

	_getNode: function (x, y) {
		const config = this._map.options.config;
		let node = this._map.worldToGlobalGPS(
			this._roundNodeLocation(x),
			this._roundNodeLocation(y),
			config.GPSBounds,
		);
		if (this._graph.getNode(node.toString())) return node;
		else return undefined;
	},

	_closestNode: function ([x1, y1]) {
		const config = this._map.options.config;
		let [x, y] = this._map.leafletToWorld([y1, x1]);
		let step = config.GridSize / config.NodesPerAxis;
		let node = this._getNode(x, y);
		if (node) return node;

		for (let stepCount = 1; stepCount < 6; stepCount++) {
			const steps = step * stepCount;
			for (let a = -1; a <= 1; a++) {
				for (let b = -1; b <= 1; b++) {
					let node = this._getNode(+x + steps * a, +y + steps * b);
					if (node) return node;
				}
			}
		}

		return undefined;
	},

	_roundNodeLocation: function (v) {
		const config = this._map.options.config;
		let step = config.GridSize / config.NodesPerAxis;
		if (v % step === 0) {
			return Math.floor(v / step) * step + config.GridOffset;
		}
		return Math.floor(v / step) * step + step + config.GridOffset;
	},

	_pointFromLine: function (along, dist, p1, p2) {
		let res = [];
		const dx = p2[0] - p1[0];
		const dy = p2[1] - p1[1];

		return [p1[0] + dx * along - dy * dist, p1[1] + dy * along + dx * dist];
	},

	_updatePaths: function () {
		this._path.forEach((v) => {
			this._map.removeLayer(v);
		});

		if (this._pins.length >= 2) {
			for (let i = 1; i < this._pins.length; i++) {
				let pin1 = this._closestNode(this._pins[i - 1].split(';')),
					pin2 = this._closestNode(this._pins[i].split(';'));

				let p = this._pathfinder.find(pin1.toString(), pin2.toString());
				for (let j = 1; j < p.length; j++) {
					let p1 = this._map.GPSStringtoLeaflet(p[j - 1].id);
					let p2 = this._map.GPSStringtoLeaflet(p[j].id);
					let options = {name: 'path'};

					let pathing = [];
					pathing.push('M', p1);

					if (this.getDistance(p1, p2) > 2) {
						options.dashArray = '10, 10';
						options.opacity = 0.5;
						pathing.push(
							'C',
							this._pointFromLine(0.333, 0.2, p1, p2),
							this._pointFromLine(1 - 0.333, 0.2, p1, p2),
							p2,
						);
						
						let c1 = this._pointFromLine(1 - 0.333, 0.2, p1, p2)

						let pin = new L.Marker(p2, {
							icon: this._arrowIcon,
							rotationAngle: (Math.atan2(p2[1] - c1[1], p2[0] - c1[0]) * 180) / Math.PI ,
						}).addTo(this._map);

						this._path.push(pin);
						/*
						path.Nodes.push(path.Nodes.shift());
						for (let i = 0; i < path.Nodes.length; i++) {
							let n = path.Nodes[i];
							let center = [n.worldX, n.worldY];
							let previous = rotateVector2DAroundAxis(
								[n.worldX - n.controlPointsDistance, n.worldY],
								center,
								n.rotation,
							);
							pathing.push('S', worldToLeafletArray(previous), worldToLeafletArray(center));
							let actualang = n.rotation + 90;
							if (path.reverseDir) actualang += 180;
							let pin = new L.Marker(worldToLeafletArray(center), {
								icon: ArrowIcon,
								rotationAngle: actualang,
							});
							*/
					} else {
						pathing.push('L', p2);
					}

					let line = L.curve(pathing, options).addTo(this._map);
					this._path.push(line);
				}
			}
		}
	},

	_mouseClick: function (e) {
		if (!e.latlng) {
			return;
		}

		this._pins.push(e.latlng.lat + ';' + e.latlng.lng);
		L.marker(e.latlng, {
			name: 'pathFinder',
			icon: this._icon,
			v: e.latlng.lat + ';' + e.latlng.lng,
			parent: this,
		})
			.addTo(this._map)
			.on('click', this._markerClick);
		this._updateURI();
		this._updatePaths();
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

L.control.pathFinder = function (options) {
	return new L.Control.PathFinder(options);
};

L.Map.mergeOptions({
	pinControl: false,
});

L.Map.addInitHook(function () {
	this.pinControl = new L.Control.PathFinder();
	this.addControl(this.pinControl);
});
