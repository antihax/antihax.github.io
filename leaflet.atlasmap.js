/* global L, config */
L.AtlasMap = L.Map.extend({
	initialize: async function (id, options) {
		options = L.extend(options || {}, {});

		return L.Map.prototype.initialize.call(this, id, options);
	},

	ccc: function (x, y) {
		const config = this.options.config;
		let precision = 256 / config.ServersX;
		let gridXName = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
		let gridX = gridXName[Math.floor(x / precision)];
		let gridY = Math.floor(y / precision) + 1;
		let localX = this.constraintInv(x % precision, 0, precision, -700000, 700000).toFixed(0);
		let localY = this.constraintInv(y % precision, 0, precision, -700000, 700000).toFixed(0);

		return [gridX + gridY, localX, localY];
	},

	gridStringToIntegers: function (grid) {
		let gridX = grid.toLowerCase().charCodeAt(0) - 97;
		let gridY = parseInt(grid.substring(1) - 1);
		return [gridX, gridY];
	},

	worldToLeaflet: function (x, y) {
		const config = this.options.config;
		const unrealx = config.GridSize * config.ServersX;
		const unrealy = config.GridSize * config.ServersY;
		let long = -((y / unrealy) * 256),
			lat = (x / unrealx) * 256;
		return [long, lat];
	},

	 GPStoLeaflet: function(x, y) {
		const config = this.options.config;
		let long = (y - config.GPSBounds.min[1]) * config.XScale * 1.28,
			lat = (x - config.GPSBounds.min[0]) * config.YScale * 1.28;
	
		return [long, lat];
	},

	rotateVector2DAroundAxis: function (vec, axis, ang) {
		ang = ang * (Math.PI / 180);
		let cos = Math.cos(ang);
		let sin = Math.sin(ang);

		vec[0] -= axis[0];
		vec[1] -= axis[1];

		let r = new Array(vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos);

		r[0] += axis[0];
		r[1] += axis[1];

		return r;
	},

	worldToLeafletSize: function (size) {
		const config = this.options.config;
		const unrealx = config.GridSize * config.ServersX;
		return (size / unrealx) * 256;
	},

	cheatToLeaflet: function (c) {
		const config = this.options.config;
		let parts = c.split(' ');
		let [gridX, gridY] = this.gridStringToIntegers(parts[0]);

		let pX = parseInt(parts[2]) + config.GridSize / 2;
		let pY = parseInt(parts[1]) + config.GridSize / 2;
		let [long, lat] = this.worldToLeaflet(
			pY + config.GridSize * gridY,
			pX + config.GridSize * gridX,
		);

		return [long, lat];
	},

	worldToLeafletArray: function(a) {
		return this.worldToLeaflet(a[0], a[1]);
	},

	GPSStringtoLeaflet: function (str) {
		const config = this.options.config;
		let a = str.split(',');
		let long = (a[1] - config.GPSBounds.min[1]) * config.YScale * 1.28,
			lat = (a[0] - config.GPSBounds.min[0]) * config.XScale * 1.28;
		return [long, lat];
	},

	worldToGlobalGPS: function (x, y, bounds) {
		const config = this.options.config;
		const worldUnitsX = config.ServersX * config.GridSize;
		const worldUnitsY = config.ServersY * config.GridSize;
		let long = (x / worldUnitsX) * Math.abs(bounds.min[0] - bounds.max[0]) + bounds.min[0];
		let lat = bounds.min[1] - (y / worldUnitsY) * Math.abs(bounds.min[1] - bounds.max[1]);
		return [parseFloat(long.toFixed(1)), parseFloat(lat.toFixed(1))];
	},

	leafletToWorld: function ([x, y]) {
		const config = this.options.config;
		let worldX = this.constraintInv(x, 0, 256, 0, config.GridSize * config.ServersX - 1).toFixed(0);
		let worldY = this.constraintInv(y, 0, -256, 0, config.GridSize * config.ServersY - 1).toFixed(
			0,
		);

		return [worldX, worldY];
	},

	constraintInv: function (value, minVal, maxVal, minRange, maxRange) {
		return this.constraint(value, minVal, maxVal, minRange, maxRange) + minRange;
	},

	constraint: function (value, minVal, maxVal, minRange, maxRange) {
		return ((value - minVal) / (maxVal - minVal)) * (maxRange - minRange);
	},

	getClientParameters: function () {
		let index = window.location.href.indexOf('#');
		if (index > 0)
			return new URLSearchParams(
				window.location.href.substring(window.location.href.indexOf('#') + 1),
			);
		else return new URLSearchParams();
	},

	setClientParameters: function (params) {
		window.location.href = '#' + params.toString();
	},

	addPortalPin: function (icon, location, text, angle = 0) {
		let pin = new L.Marker(location, {
			icon: icon,
			rotationAngle: angle,
		});
		pin.bindPopup(text, {
			showOnMouseOver: true,
			autoPan: true,
			keepInView: true,
		});
		pin.on({
			mouseover: (e) => {
				e.target.firstPin.lines.forEach((line) => {
					line.setStyle({opacity: 1});
				});
			},
			mouseout: (e) => {
				e.target.firstPin.lines.forEach((line) => {
					line.setStyle({opacity: 0.01});
				});
			},
		});
		return pin;
	}
});

L.atlasmap = function (id, options) {
	return new L.AtlasMap(id, options);
};
