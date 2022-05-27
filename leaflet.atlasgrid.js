/* global L, console */

function findGlobalBiome(list) {
	for (let x in list) {
		if (list[x].includes(' Ocean Water')) return list[x].replace(' Ocean Water', '');

		let name = list[x];
		name = name.replace('Western ', '');
		name = name.replace('Eastern ', '');
		name = name.replace('Central ', '');
		name = name.replace('At Land', '');
		name = name.replace('Ocean Water', '');
		name = name.replace(' Mountain Peak', '');
		name = name.replace('High ', '');
		name = name.replace('Low ', '');
		name = name.trim();
		if (name) return name;
	}
	return false;
}

L.AtlasGrid = L.LayerGroup.extend({
	options: {
		xticks: 2,
		yticks: 3,
		grids: [],
		// Path style for the grid lines
		lineStyle: {
			stroke: true,
			color: '#111',
			opacity: 0.2,
			weight: 1,
		},
	},

	initialize: function (options) {
		L.LayerGroup.prototype.initialize.call(this);
		L.Util.setOptions(this, options);
	},

	onAdd: function (map) {
		this._map = map;
		let bounds = map._originalBounds;
		this._xTickSize = (bounds.getEast() - bounds.getWest()) / this.options.xticks;
		this._yTickSize = (bounds.getSouth() - bounds.getNorth()) / this.options.yticks;

		let grid;
		this.eachLayer(map.addLayer, map);

		fetch('json/gridList.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then((grids) => {
				grid = this.draw(grids);
			})
			.catch((error) => {
				console.log(error);
			});
	},

	onRemove: function () {
		this.eachLayer(this.removeLayer, this);
	},

	_drawGridBoarderOverrides: function (x, y, g) {
		let icon = L.icon({
			iconUrl: 'icons/Arrow2.svg',
			iconSize: [8, 8],
			iconAnchor: [4, 0],
		});

		if (
			g.DestEast.reduce(function (a, b) {
				return a + b;
			}, 2) > 0
		) {
			let sX1 = this._xTickSize * (x + 1);
			let sY1 = this._yTickSize * y + this._yTickSize / 2;
			let sX2 = this._xTickSize * g.DestEast[0] + this._xTickSize / 2;
			let sY2 = this._yTickSize * g.DestEast[1] + this._yTickSize / 2;
			this._drawGridBorderPin(sX1, sY1, sX2, sY2, icon, 'Grid Transfer', 90);
		}
		if (
			g.DestWest.reduce(function (a, b) {
				return a + b;
			}, 2) > 0
		) {
			let sX1 = this._xTickSize * x;
			let sY1 = this._yTickSize * y + this._yTickSize / 2;
			let sX2 = this._xTickSize * g.DestWest[0] + this._xTickSize / 2;
			let sY2 = this._yTickSize * g.DestWest[1] + this._yTickSize / 2;
			this._drawGridBorderPin(sX1, sY1, sX2, sY2, icon, 'Grid Transfer', 270);
		}
		if (
			g.DestNorth.reduce(function (a, b) {
				return a + b;
			}, 2) > 0
		) {
			let sX1 = this._xTickSize * x + this._xTickSize / 2;
			let sY1 = this._yTickSize * y;
			let sX2 = this._xTickSize * g.DestNorth[0] + this._xTickSize / 2;
			let sY2 = this._yTickSize * g.DestNorth[1] + this._yTickSize / 2;
			this._drawGridBorderPin(sX1, sY1, sX2, sY2, icon, 'Grid Transfer', 0);
		}
		if (
			g.DestSouth.reduce(function (a, b) {
				return a + b;
			}, 2) > 0
		) {
			let sX1 = this._xTickSize * x + this._xTickSize / 2;
			let sY1 = this._yTickSize * (y + 1);
			let sX2 = this._xTickSize * g.DestSouth[0] + this._xTickSize / 2;
			let sY2 = this._yTickSize * g.DestSouth[1] + this._yTickSize / 2;
			this._drawGridBorderPin(sX1, sY1, sX2, sY2, icon, 'Grid Transfer', 180);
		}
	},

	_drawGridBorderPin: function (sX1, sY1, sX2, sY2, icon, title, angle) {
		let pin1 = this._map.addPortalPin(icon, [sY1, sX1], title, angle);
		this._map.Portals.addLayer(pin1);
		let pl = L.polyline(
			[
				[sY1, sX1],
				[sY2, sX2],
			],
			{color: 'red', opacity: 0.01},
		);
		pin1.lines = [pl];
		pin1.firstPin = pin1;
		this._map.Portals.addLayer(pl);
	},

	draw: function (grids) {
		let bounds = this._map._originalBounds;
		for (let i = 0; i < this.options.xticks + 1; i++) {
			this.addLayer(
				new L.Polyline(
					[
						[bounds.getNorth(), bounds.getWest() + this._xTickSize * i],
						[bounds.getSouth(), bounds.getWest() + this._xTickSize * i],
					],
					this.options.lineStyle,
				),
			);
		}
		for (let i = 0; i < this.options.yticks + 1; i++) {
			this.addLayer(
				new L.Polyline(
					[
						[bounds.getNorth() + this._yTickSize * i, bounds.getWest()],
						[bounds.getNorth() + this._yTickSize * i, bounds.getEast()],
					],
					this.options.lineStyle,
				),
			);
		}

		for (let x = 0; x < this.options.xticks; x++) {
			for (let y = 0; y < this.options.yticks; y++) {
				const grid = String.fromCharCode(65 + x) + (y + 1);

				this._drawGridBoarderOverrides(x, y, grids[grid]);

				let color = 'white';
				let dropcolor = 'black';
				switch (findGlobalBiome(grids[grid].biomes)) {
					case 'Temperate':
						color = 'Red';
						dropcolor = 'Grey';
						break;
					case 'Tundra':
						color = 'Blue';
						dropcolor = 'White';
						break;
					case 'Equatorial':
						color = 'Yellow';
						dropcolor = 'White';
						break;
					case 'Polar':
						color = 'Blue';
						dropcolor = 'Black';
						break;
					case 'Desert':
						color = 'Yellow';
						dropcolor = 'Black';
						break;
					case 'Tropical':
						color = 'Green';
						dropcolor = 'White';
						break;
					case 'Tropics':
						color = 'Green';
						dropcolor = 'White';
						break;

					default:
						color = 'White';
				}

				let serverType = '';
				let serverTypeName = 'Lawless';
				switch (grids[grid].forceServerRules) {
					case 1: // Lawless
						serverType = '';
						serverTypeName = 'Lawless';
						break;
					case 2: // Lawless claim
						serverType = '&#9760;';
						serverTypeName = 'Claimable';
						break;
					case 3: // island claim
						serverType = '&#9813;';
						serverTypeName = 'Settlements';
						break;
					case 4:
						serverType = '&#9774;';
						serverTypeName = 'Freeport';
						break;
					case 5:
						serverType = '&#9774;';
						serverTypeName = 'Golden Age';
						break;
				}

				let text = `<div><div class="leaflet-grid-header">${grid}</div> <div class="leaflet-grid-icon">${serverType}</div>`;
				let tooltip = L.marker(
					[bounds.getWest() + this._yTickSize * y, bounds.getNorth() + this._xTickSize * x],
					{
						icon: L.divIcon({
							className: 'leaflet-grid-marker',
							iconAnchor: [-2, -2],
						}),
						title: `${findGlobalBiome(grids[grid].biomes)} ${serverTypeName}`,
						clickable: false,
					},
				);
				this.addLayer(tooltip);
				tooltip._icon.innerHTML = text;
			}
		}

		return this;
	},
});

L.atlasgrid = function (options) {
	return new L.Grid(options);
};
