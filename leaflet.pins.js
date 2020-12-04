L.Control.Pin = L.Control.extend({
  options: {
    position: 'topleft'
  },

  _pins: [],

  initialize: function (options) {
    //  apply options to instance
    L.Util.setOptions(this, options)
  },

  onAdd: function (map) {
    var className = 'leaflet-control-zoom leaflet-bar leaflet-control'
    var container = L.DomUtil.create('div', className)
    this._createButton('&#128204;', 'Pin',
      'leaflet-control-pin leaflet-bar-part leaflet-bar-part-top-and-bottom',
      container, this._togglePin, this)

    if (this.options.keyboard) {
      L.DomEvent.on(document, 'keydown', this._onKeyDown, this)
    }

    this._addPins()
    return container
  },

  onRemove: function (map) {
    if (this.options.keyboard) {
      L.DomEvent.off(document, 'keydown', this._onKeyDown, this)
    }
  },

  _createButton: function (html, title, className, container, fn, context) {
    var link = L.DomUtil.create('a', className, container)
    link.innerHTML = html
    link.href = '#'
    link.title = title

    L.DomEvent
      .on(link, 'click', L.DomEvent.stopPropagation)
      .on(link, 'click', L.DomEvent.preventDefault)
      .on(link, 'click', fn, context)
      .on(link, 'dbclick', L.DomEvent.stopPropagation)
    return link
  },

  _togglePin: function () {
    this._pinning = !this._pinning
    if (this._pinning) {
      L.DomUtil.addClass(this._container, 'leaflet-control-pin-on')
      this._startPinning()
    } else {
      L.DomUtil.removeClass(this._container, 'leaflet-control-pin-on')
      this._stopPinning()
    }
  },

  _startPinning: function () {
    this._oldCursor = this._map._container.style.cursor
    this._map._container.style.cursor = 'crosshair'
    this._doubleClickZoom = this._map.doubleClickZoom.enabled()
    this._map.doubleClickZoom.disable()
    this._isRestarted = false

    L.DomEvent
      .on(this._map, 'mousemove', this._mouseMove, this)
      .on(this._map, 'click', this._mouseClick, this)

    if (!this._layerPaint) {
      this._layerPaint = L.layerGroup().addTo(this._map)
    }

    if (!this._points) {
      this._points = []
    }
  },

  _stopPinning: function () {
    this._map._container.style.cursor = this._oldCursor

    L.DomEvent
      .off(this._map, 'mousemove', this._mouseMove, this)
      .off(this._map, 'click', this._mouseClick, this)

    if (this._doubleClickZoom) {
      this._map.doubleClickZoom.enabled()
    }
    if (this._layerPaint) {
      this._layerPaint.clearLayers()
    }
  },

  _mouseMove: function (e) {
    if (!e.latlng || !this._lastPoint) {
      return
    }
    if (!this._layerPaintPathTemp) {
      //  customize style
      this._layerPaintPathTemp = L.polyline([this._lastPoint, e.latlng], {
        color: this.options.lineColor,
        weight: this.options.lineWeight,
        opacity: this.options.lineOpacity,
        clickable: false,
        dashArray: this.options.lineDashArray,
        interactive: false
      }).addTo(this._layerPaint)
    } else {
      //  replace the current layer to the newest draw points
      this._layerPaintPathTemp.getLatLngs().splice(0, 2, this._lastPoint, e.latlng)
      //  force path layer update
      this._layerPaintPathTemp.redraw()
    }

    //  tooltip
    if (this._tooltip) {
      //if (!this._distance) {
      this._distance = 0
      //}
      this._updateTooltipPosition(e.latlng)
      var distance = getDistance(e.latlng, this._lastPoint)
      this._updateTooltipDistance(distance)
    }
  },

  _addPins: function () {
    let index = window.location.href.indexOf("#");
    if (index > 0) {
      let component = window.location.href.substring(window.location.href.indexOf("#") + 1);
      if (component) {
        let pins = decodeURIComponent(component).split(",")
        if (pins.length > 0) {
          pins.forEach(v => {
            this._pins.push(v);
            let latlng = v.split(';')
            var marker = L.marker(latlng, {name: "pin"}).addTo(this._map).on('click', this._markerClick);
          })
        }
      }
    }
  },

  _markerClick: function (e) {
    this._map.removeLayer(this)
    pinControl._updateURI()
  },

  _updateURI: function () {
    let pins = [];
    this._map.eachLayer(function (layer) {
      if (layer.options.name === 'pin') {
        pins.push([layer._latlng.lat + ";" + layer._latlng.lng]);
      }
    });
    window.location.href = "#" + encodeURIComponent(pins);
  },

  _mouseClick: function (e) {
    if (!e.latlng) {
      return
    }

    var marker = L.marker(e.latlng, {
      name: "pin"
    }).addTo(this._map).on('click', this._markerClick);
    this._updateURI()
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
      clickable: Boolean(this._lastCircle)
    })
  },

  _onKeyDown: function (e) {
    // key control
    switch (e.keyCode) {
      case this.options.activeKeyCode:
        if (!this._pinning) {
          this._togglePin()
        }
        break
      case this.options.cancelKeyCode:
        //  if pinning, cancel pinning
        if (this._pinning) {
          if (!this._lastPoint) {
            this._togglePin()
          } else {
            this._isRestarted = false
          }
        }
        break
    }
  }
})

L.control.pin = function (options) {
  return new L.Control.Pin(options)
}

L.Map.mergeOptions({
  pinControl: false
})
var pinControl;
L.Map.addInitHook(function () {
  this.pinControl = new L.Control.Pin()
  pinControl = this.pinControl;
  this.addControl(this.pinControl)
})