/* global L, config */
L.AtlasMap = L.Map.extend({
	initialize: async function (id, options) {
		options = L.extend(options || {}, {});

		return L.Map.prototype.initialize.call(this, id, options);
	},

	ccc: function (x, y) {
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
		const unrealx = config.GridSize * config.ServersX;
		const unrealy = config.GridSize * config.ServersY;
		let long = -((y / unrealy) * 256),
			lat = (x / unrealx) * 256;
		return [long, lat];
	},

	worldToLeafletSize: function (size) {
		const unrealx = config.GridSize * config.ServersX;
		return (size / unrealx) * 256;
	},

	cheatToLeaflet: function (c) {
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

	localGPStoWorld: function (grid, long, lat) {
		let [gridX, gridY] = this.gridStringToIntegers(grid);
		let outX, outY;
		Object.values(this._regions).forEach((v) => {
			if (gridX <= v.MaxX && gridX >= v.MinX && gridY <= v.MaxY && gridY >= v.MinY) {
				let xEdge = config.GridSize * (v.MaxX - v.MinX + 1);
				let yEdge = config.GridSize * (v.MaxY - v.MinY + 1);
				console.log(v, lat, long, xEdge, yEdge, this.constraintInv(99, -100, 100, 0, 100));
				outX = this.constraintInv(long, -100, 100, 0, xEdge) + v.MinX * config.GridSize;
				outY = this.constraintInv(lat, 100, -100, 0, yEdge) + v.MinY * config.GridSize;
				return false;
			}
		});
		return [outX, outY];
	},

	worldToGlobalGPS: function (x, y, bounds) {
		const worldUnitsX = config.ServersX * config.GridSize;
		const worldUnitsY = config.ServersY * config.GridSize;
		let long = (x / worldUnitsX) * Math.abs(bounds.min[0] - bounds.max[0]) + bounds.min[0];
		let lat = bounds.min[1] - (y / worldUnitsY) * Math.abs(bounds.min[1] - bounds.max[1]);
		return [parseFloat(long.toFixed(1)), parseFloat(lat.toFixed(1))];
	},

	leafletToWorld: function ([x, y]) {
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
	},
});

L.atlasmap = function (id, options) {
	return new L.AtlasMap(id, options);
};
