function getDistance(p1, p2) {
	let distance = Math.sqrt((p1.lng - p2.lng) ** 2 + (p1.lat - p2.lat) ** 2);
	return distance * (182000 / 256);
}

L.Control.Measure = L.Control.extend({
	options: {
		position: 'topleft',
		//  weather to use keyboard control for this plugin
		keyboard: true,
		//  shortcut to activate measure
		cancelKeyCode: 27,
		//  line color
		lineColor: 'black',
		//  line weight
		lineWeight: 2,
		//  line dash
		lineDashArray: '6, 6',
		//  line opacity
		lineOpacity: 1,
		//  format distance method
		formatDistance: null,
		//  define text color
		textColor: 'black',
	},

	initialize: function (options) {
		//  apply options to instance
		L.Util.setOptions(this, options);
	},

	onAdd: function (map) {
		let className = 'leaflet-control-zoom leaflet-bar leaflet-control';
		let container = L.DomUtil.create('div', className);
		this._createButton(
			'&#8674;',
			'Warehouse Planner / Measure',
			'leaflet-control-measure leaflet-bar-part leaflet-bar-part-top-and-bottom',
			container,
			this._toggleMeasure,
			this,
		);

		if (this.options.keyboard) {
			L.DomEvent.on(document, 'keydown', this._onKeyDown, this);
		}

		return container;
	},

	onRemove: function (map) {
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

	_toggleMeasure: function () {
		this._measuring = !this._measuring;
		if (this._measuring) {
			L.DomUtil.addClass(this._container, 'leaflet-control-measure-on');
			this._startMeasuring();
		} else {
			L.DomUtil.removeClass(this._container, 'leaflet-control-measure-on');
			this._stopMeasuring();
		}
	},

	_startMeasuring: function () {
		this._oldCursor = this._map._container.style.cursor;
		this._map._container.style.cursor = 'crosshair';
		this._doubleClickZoom = this._map.doubleClickZoom.enabled();
		this._map.doubleClickZoom.disable();
		this._isRestarted = false;

		L.DomEvent.on(this._map, 'mousemove', this._mouseMove, this)
			.on(this._map, 'click', this._mouseClick, this)
			.on(this._map, 'dbclick', this._finishPath, this);

		if (!this._layerPaint) {
			this._layerPaint = L.layerGroup().addTo(this._map);
		}

		if (!this._points) {
			this._points = [];
		}
	},

	_stopMeasuring: function () {
		this._map._container.style.cursor = this._oldCursor;

		L.DomEvent.off(this._map, 'mousemove', this._mouseMove, this)
			.off(this._map, 'click', this._mouseClick, this)
			.off(this._map, 'dbclick', this._finishPath, this);

		if (this._doubleClickZoom) {
			this._map.doubleClickZoom.enabled();
		}
		if (this._layerPaint) {
			this._layerPaint.clearLayers();
		}

		this._restartPath();
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

		//  tooltip
		if (this._tooltip) {
			//if (!this._distance) {
			this._distance = 0;
			//}
			this._updateTooltipPosition(e.latlng);
			this._updateTooltipDistance(getDistance(e.latlng, this._lastPoint));
		}
	},

	_mouseClick: function (e) {
		if (!e.latlng) {
			return;
		}

		if (this._isRestarted) {
			this._isRestarted = false;
			return;
		}

		if (this._lastPoint && this._tooltip) {
			if (!this._distance) {
				this._distance = 0;
			}

			this._updateTooltipPosition(e.latlng);
			this._updateTooltipDistance(getDistance(e.latlng, this._lastPoint));

			this._distance += distance;
		}

		this._createTooltip(e.latlng);

		//  main layer add to layerPaint
		if (this._lastPoint && !this._layerPaintPath) {
			this._layerPaintPath = L.polyline([this._lastPoint], {
				color: this.options.lineColor,
				weight: this.options.lineWeight,
				opacity: this.options.lineOpacity,
				clickable: false,
				interactive: false,
			}).addTo(this._layerPaint);
		}

		//  push current point to the main layer
		if (this._layerPaintPath) {
			this._layerPaintPath.addLatLng(e.latlng);
		}

		this._lastPoint = L.circle(e.latlng, {
			radius: 0.6329230769230769,
			interactive: false,
		}).addTo(this._layerPaint);

		if (this._lastPoint) {
			if (this._lastCircle) {
				this._lastCircle.off('click', this._finishPath, this);
			}
			this._lastCircle = this._createCircle(e.latlng).addTo(this._layerPaint);
			this._lastCircle.on('click', this._finishPath, this);
		}

		this._lastPoint = e.latlng;
	},

	_finishPath: function (e) {
		if (e) {
			L.DomEvent.preventDefault(e);
		}
		if (this._lastCircle) {
			this._lastCircle.off('click', this._finishPath, this);
		}
		if (this._tooltip) {
			//  when remove from map, the _icon property becomes null
			this._layerPaint.removeLayer(this._tooltip);
		}
		if (this._layerPaint && this._layerPaintPathTemp) {
			this._layerPaint.removeLayer(this._layerPaintPathTemp);
		}

		//  clear everything
		this._restartPath();
	},

	_restartPath: function () {
		this._distance = 0;
		this._lastCircle = undefined;
		this._lastPoint = undefined;
		this._tooltip = undefined;
		this._layerPaintPath = undefined;
		this._layerPaintPathTemp = undefined;

		//  flag to stop propagation events...
		this._isRestarted = true;
	},

	_createCircle: function (latlng) {
		return new L.CircleMarker(latlng, {
			color: 'black',
			opacity: 1,
			weight: 1,
			fillColor: 'white',
			fill: true,
			fillOpacity: 1,
			radius: 4,
			clickable: Boolean(this._lastCircle),
		});
	},

	_createTooltip: function (position) {
		let icon = L.divIcon({
			className: 'leaflet-measure-tooltip',
			iconAnchor: [-5, -5],
		});
		this._tooltip = L.marker(position, {
			icon: icon,
			clickable: false,
		}).addTo(this._layerPaint);
	},

	_updateTooltipPosition: function (position) {
		this._tooltip.setLatLng(position);
	},

	_updateTooltipDistance: function (total) {
		if (!this._tooltip._icon) {
			return;
		}
		let totalRound = this._formatDistance(total);
		let text =
			'<div class="leaflet-measure-tooltip-total" style="color:' +
			this.options.textColor +
			'">' +
			totalRound +
			'</div>';
		this._tooltip._icon.innerHTML = text;
	},

	_formatDistance: function (val) {
		if (typeof this.options.formatDistance === 'function') {
			return this.options.formatDistance(val);
		}
		return Math.round(val) + 'm';
	},

	_onKeyDown: function (e) {
		// key control
		switch (e.keyCode) {
			case this.options.cancelKeyCode:
				//  if measuring, cancel measuring
				if (this._measuring) {
					if (!this._lastPoint) {
						this._toggleMeasure();
					} else {
						this._finishPath();
						this._isRestarted = false;
					}
				}
				break;
		}
	},
});

L.control.measure = function (options) {
	return new L.Control.Measure(options);
};

L.Map.mergeOptions({
	measureControl: false,
});

L.Map.addInitHook(function () {
	if (this.options.measureControl) {
		this.measureControl = new L.Control.Measure();
		this.addControl(this.measureControl);
	}
});
