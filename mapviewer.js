class WorldMap extends React.Component {
	constructor(props) {
		super(props);
	}

	componentWillUnmount() {
		clearInterval(this.timer);
	}

	componentDidMount() {
		const layerOpts = {
			maxZoom: 9,
			maxNativeZoom: 6,
			minZoom: 1,
			bounds: L.latLngBounds([0, 0], [-256, 256]),
			noWrap: true,
		};

		const baseLayer = L.tileLayer('tiles/{z}/{x}/{y}.png', layerOpts);

		let map = (this.worldMap = L.atlasmap('worldmap', {
			crs: L.CRS.Simple,
			layers: [baseLayer],
			zoomControl: false,
			attributionControl: false,
		}));

		map._originalBounds = layerOpts.bounds;

		// Add zoom control
		L.control
			.zoom({
				position: 'topright',
			})
			.addTo(map);

		map.Grid = new L.AtlasGrid({
			xticks: config.ServersX,
			yticks: config.ServersY,
		}).addTo(map);
		map.IslandTerritories = L.layerGroup(layerOpts);
		map.IslandResources = L.layerGroup(layerOpts);
		map.Discoveries = L.layerGroup(layerOpts);
		map.Bosses = L.layerGroup(layerOpts);
		map.ControlPoints = L.layerGroup(layerOpts);
		map.Portals = L.layerGroup(layerOpts).addTo(map);
		map.Altars = L.layerGroup(layerOpts);
		map.Ships = L.layerGroup(layerOpts);
		map.TradeWinds = L.layerGroup(layerOpts);
		map.Stones = L.layerGroup(layerOpts);
		let SearchBox = L.Control.extend({
			onAdd: function () {
				let element = document.createElement('input');
				element.id = 'searchBox';
				element.onchange = function () {
					let search = document.getElementById('searchBox').value.toLowerCase();
					let exact = false;
					map.IslandResources.eachLayer(function (layer) {
						if (search !== '') {
							if (
								layer.animals.find(function (element) {
									if (element === null) return;
									if (element.toLowerCase() === search) {
										exact = true;
										return true;
									}
									if (exact) return false;
									return element.toLowerCase().includes(search);
								}) ||
								layer.resources.find(function (element) {
									if (element === null) return;
									if (element.toLowerCase() === search) {
										exact = true;
										return true;
									}
									if (exact) return false;
									return element.toLowerCase().includes(search);
								})
							)
								layer.setStyle({
									radius: 1.5,
									color: '#f00',
									opacity: 1,
									fillOpacity: 1,
								});
							else
								layer.setStyle({
									radius: 1.5,
									color: '#f00',
									opacity: 0,
									fillOpacity: 0.0,
								});
						} else {
							exact = false;
							layer.setStyle({
								radius: 1.5,
								color: '#f00',
								opacity: 0,
								fillOpacity: 0.0,
							});
						}
					});
				};
				return element;
			},
		});
		new SearchBox().addTo(map);

		let measureControl = new L.Control.Measure({});
		measureControl.addTo(map);

		// Add Layer Control
		L.control
			.layers(
				{},
				{
					Grid: map.Grid,
					Discoveries: map.Discoveries,
					ControlPoints: map.ControlPoints,
					Resources: map.IslandResources.addTo(map),
					Portals: map.Portals,
					Altars: map.Altars,
					Bosses: map.Bosses,
					Ships: map.Ships,
					TradeWinds: map.TradeWinds.addTo(map),
					Stones: map.Stones,
				},
				{
					position: 'topright',
				},
			)
			.addTo(map);

		let stickyLayers = {};
		map.on('overlayadd', function (e) {
			stickyLayers[e.name] = true;
		});

		map.on('overlayremove', function (e) {
			stickyLayers[e.name] = false;
		});

		map.on('zoomend', function () {
			if (map.getZoom() < 5) {
				if (!stickyLayers.Bosses) map.removeLayer(map.Bosses);
				if (!stickyLayers.Stones) map.removeLayer(map.Stones);
			} else {
				if (!stickyLayers.Bosses) {
					map.addLayer(map.Bosses);
					stickyLayers.Bosses = false;
				}

				if (!stickyLayers.Stones) {
					map.addLayer(map.Stones);
					stickyLayers.Stones = false;
				}
			}
		});

		map.setView([-128, 128], 2);

		L.easyButton('<div>📝</div>', function () {
			window.open('items.html', '_self');
		}).addTo(map);

		L.easyButton('<div>☕</div>', function () {
			window.open('https://ko-fi.com/antihax', '_blank');
		}).addTo(map);

		let ArrowIcon = L.icon({
			iconUrl: 'icons/Arrow.svg',
			iconSize: [12, 12],
			iconAnchor: [6, 6],
		});

		let Portal1Icon = L.icon({
			iconUrl: 'icons/Portal1.svg',
			iconSize: [12, 12],
			iconAnchor: [6, 6],
		});

		let Portal2Icon = L.icon({
			iconUrl: 'icons/Portal2.svg',
			iconSize: [12, 12],
			iconAnchor: [6, 6],
		});
		let Portal3Icon = L.icon({
			iconUrl: 'icons/Portal3.svg',
			iconSize: [12, 12],
			iconAnchor: [6, 6],
		});

		let Portal4Icon = L.icon({
			iconUrl: 'icons/Portal4.svg',
			iconSize: [12, 12],
			iconAnchor: [6, 6],
		});

		let CPIcon = L.icon({
			iconUrl: 'icons/lighthouse.svg',
			iconSize: [12, 12],
			iconAnchor: [6, 6],
		});

		let hydraIcon = L.icon({
			iconUrl: 'icons/Hydra.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let bossIcon = L.icon({
			iconUrl: 'icons/Boss.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let yetiIcon = L.icon({
			iconUrl: 'icons/Yeti.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let drakeIcon = L.icon({
			iconUrl: 'icons/Drake.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let meanWhaleIcon = L.icon({
			iconUrl: 'icons/MeanWhale.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let gentleWhaleIcon = L.icon({
			iconUrl: 'icons/GentleWhale.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let giantSquidIcon = L.icon({
			iconUrl: 'icons/GiantSquid.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		let altarIcon = L.icon({
			iconUrl: 'icons/Altar.svg',
			iconSize: [16, 16],
			iconAnchor: [8, 8],
		});

		let stoneIcon = L.icon({
			iconUrl: 'icons/Stone.svg',
			iconSize: [32, 32],
			iconAnchor: [16, 16],
		});

		fetch('json/regions.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (regions) {
				map._regions = regions;
			});

		fetch('json/portals.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (portals) {
				portals.forEach((d) => {
					let first,
						firstPin = null;
					let icon = Portal1Icon;
					switch (d.PathPortalType) {
						case 0:
							icon = Portal1Icon;
							break;
						case 1:
							icon = Portal2Icon;
							break;
						case 2:
							icon = Portal3Icon;
							break;
						case 3:
							icon = Portal4Icon;
							break;
					}

					d.Nodes.forEach((node) => {
						let pin = map.addPortalPin(
							icon,
							unrealToLeaflet(node.worldX, node.worldY),
							node.PortalName,
						);
						map.Portals.addLayer(pin);
						if (first === undefined) {
							first = node;
							pin.lines = [];
							pin.firstPin = pin;
							firstPin = pin;
						} else {
							let pl = L.polyline(
								[
									unrealToLeaflet(node.worldX, node.worldY),
									unrealToLeaflet(first.worldX, first.worldY),
								],
								{color: 'red', opacity: 0.01},
							);
							firstPin.lines.push(pl);
							pin.firstPin = firstPin;
							map.Portals.addLayer(pl);
						}
					});
				});
			})
			.catch((error) => {
				console.log(error);
			});

		fetch('json/altars.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (altars) {
				altars.forEach((d) => {
					let pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
						icon: altarIcon,
					});
					pin.bindPopup(d.name, {
						showOnMouseOver: true,
						autoPan: true,
						keepInView: true,
					});
					map.Altars.addLayer(pin);
				});
			})
			.catch((error) => {
				console.log(error);
			});
		fetch('json/bosses.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (bosses) {
				bosses.forEach((d) => {
					let pin = {};
					if (d.name === 'Drake') {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: drakeIcon,
						});
					} else if (d.name === 'Hydra') {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: hydraIcon,
						});
					} else if (d.name === 'Yeti') {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: yetiIcon,
						});
					} else if (d.name === 'GiantSquid') {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: giantSquidIcon,
						});
					} else if (d.name === 'GentleWhale') {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: gentleWhaleIcon,
						});
					} else if (d.name === 'MeanWhale') {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: meanWhaleIcon,
						});
					} else {
						pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
							icon: bossIcon,
						});
					}
					if (pin) {
						pin.bindPopup(`${d.name}: ${d.long.toFixed(2)} / ${d.lat.toFixed(2)}`, {
							showOnMouseOver: true,
							autoPan: true,
							keepInView: true,
						});

						map.Bosses.addLayer(pin);
					}
				});
			})
			.catch((error) => {
				console.log(error);
			});

		fetch('json/stones.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (stones) {
				stones.forEach((d) => {
					let pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
						icon: stoneIcon,
					});
					pin.bindPopup(`${d.name}: ${d.long.toFixed(2)} / ${d.lat.toFixed(2)}`, {
						showOnMouseOver: true,
						autoPan: true,
						keepInView: true,
					});

					map.Stones.addLayer(pin);
				});
			})
			.catch((error) => {
				console.log(error);
			});

		fetch('json/shipPaths.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (paths) {
				paths.forEach((path) => {
					let pathing = [];

					let n = path.Nodes[0];
					let center = [n.worldX, n.worldY];
					let previous = rotateVector2DAroundAxis(
						[n.worldX - n.controlPointsDistance, n.worldY],
						center,
						n.rotation,
					);
					let next = rotateVector2DAroundAxis(
						[n.worldX + n.controlPointsDistance, n.worldY],
						center,
						n.rotation,
					);

					pathing.push('M', unrealToLeaflet(n.worldX, n.worldY));
					pathing.push(
						'C',
						unrealToLeafletArray(next),
						unrealToLeafletArray(previous),
						unrealToLeafletArray(center),
					);

					path.Nodes.push(path.Nodes.shift());
					for (let i = 0; i < path.Nodes.length; i++) {
						let n = path.Nodes[i];
						let center = [n.worldX, n.worldY];
						let previous = rotateVector2DAroundAxis(
							[n.worldX - n.controlPointsDistance, n.worldY],
							center,
							n.rotation,
						);
						pathing.push('S', unrealToLeafletArray(previous), unrealToLeafletArray(center));
						let actualang = n.rotation + 90;
						if (path.reverseDir) actualang += 180;
						let pin = new L.Marker(unrealToLeafletArray(center), {
							icon: ArrowIcon,
							rotationAngle: actualang,
						});
						map.Ships.addLayer(pin);
					}

					let color = 'yellow';
					let opacity = 0.5;
					if (path.PathName.includes('Ghost')) {
						color = 'darkred';
						opacity = 1;
					}

					let p = L.curve(pathing, {
						color: color,
						dashArray: '10',
						opacity: opacity,
					});
					map.Ships.addLayer(p);
				});
			})
			.catch((error) => {
				console.log(error);
			});

		fetch('json/tradeWinds.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (paths) {
				paths.forEach((path) => {
					let pathing = [];

					let n = path.Nodes[0];
					let center = [n.worldX, n.worldY];
					let previous = rotateVector2DAroundAxis(
						[n.worldX - n.controlPointsDistance, n.worldY],
						center,
						n.rotation,
					);
					let next = rotateVector2DAroundAxis(
						[n.worldX + n.controlPointsDistance, n.worldY],
						center,
						n.rotation,
					);

					pathing.push('M', unrealToLeaflet(n.worldX, n.worldY));
					pathing.push(
						'C',
						unrealToLeafletArray(next),
						unrealToLeafletArray(previous),
						unrealToLeafletArray(center),
					);

					// path.Nodes.push(path.Nodes.shift());
					for (let i = 0; i < path.Nodes.length; i++) {
						let n = path.Nodes[i];
						let center = [n.worldX, n.worldY];
						let previous = rotateVector2DAroundAxis(
							[n.worldX - n.controlPointsDistance, n.worldY],
							center,
							n.rotation,
						);
						pathing.push('S', unrealToLeafletArray(previous), unrealToLeafletArray(center));

						let actualang = n.rotation + 90;
						if (path.reverseDir) actualang += 180;
						let pin = new L.Marker(unrealToLeafletArray(center), {
							icon: ArrowIcon,
							rotationAngle: actualang,
						});
						map.TradeWinds.addLayer(pin);
					}

					let color = 'white';
					let opacity = 0.7;

					let p = L.curve(pathing, {
						color: color,
						dashArray: '10',
						opacity: opacity,
					});

					map.TradeWinds.addLayer(p);
				});
			})
			.catch((error) => {
				console.log(error);
			});

		fetch('json/islands.json', {
			dataType: 'json',
		})
			.then((res) => res.json())
			.then(function (islands) {
				map._islands = islands;

				for (let k in islands) {
					let island = islands[k];
					if (island.isControlPoint) {
						let pin = new L.Marker(unrealToLeaflet(island.worldX, island.worldY), {
							icon: CPIcon,
						});
						pin.bindPopup(`Control Point`, {
							showOnMouseOver: true,
							autoPan: true,
							keepInView: true,
						});

						map.ControlPoints.addLayer(pin);
						continue;
					}

					if (island.animals || island.resources) {
						let circle = new IslandCircle(unrealToLeaflet(island.worldX, island.worldY), {
							radius: 1.5,
							color: '#f00',
							opacity: 0,
							fillOpacity: 0.0,
						});

						circle.animals = [];
						circle.resources = [];
						circle.biomes = [];
						circle.animals = island.animals.slice();

						if (island.biomes) {
							let seen = {};
							for (let key in island.biomes) {
								let biome = island.biomes[key];
								let k = biome.name + biome.temp[0] + biome.temp[1];
								if (
									!seen[k] &&
									!biome.name.includes('At Land') &&
									!biome.name.includes('Ocean Water')
								) {
									seen[k] = 1;
									circle.biomes.push(island.biomes[key]);
								}
							}
							circle.biomes.sort();
						}

						let html = `<b>${island.name} - ${island.id}</b><br>`;

						for (let b in circle.biomes.sort()) {
							let biome = circle.biomes[b];
							html += `${
								biome.name
							} [Min: ${biome.temp[0].toFixed()}  Max: ${biome.temp[1].toFixed()}]<br>`;
						}

						html += `<ul class='split-ul'>`;
						for (let resource in circle.animals.sort()) {
							html += '<li>' + circle.animals[resource] + '</li>';
						}
						html += '</ul>';

						if (island.resources) {
							for (let key in island.resources) {
								if (key.length > 2) circle.resources.push(key);
							}
							circle.resources.sort();

							html += "<ul class='split-ul'>";
							circle.resources.forEach((v) => {
								html += '<li>' + v + ' (' + island.resources[v] + ')</li>';
							});
							html += '</ul>';
						}
						circle.bindPopup(html, {
							showOnMouseOver: true,
							autoPan: false,
							keepInView: true,
							maxWidth: 560,
						});
						map.IslandResources.addLayer(circle);
					}

					if (island.discoveries) {
						for (let disco in island.discoveries) {
							let d = island.discoveries[disco];
							let circle = new IslandCircle(GPStoLeaflet(d.long, d.lat), {
								radius: 0.05,
								color: '#000000',
								opacity: 0.5,
								fillOpacity: 0.5,
							});
							circle.disco = d;
							circle.bindPopup(`${d.name}: ${d.long.toFixed(2)} / ${d.lat.toFixed(2)}`, {
								showOnMouseOver: true,
								autoPan: false,
								keepInView: true,
							});
							map.Discoveries.addLayer(circle);
						}
					}
				}
			})
			.catch((error) => {
				console.log(error);
			});

		L.Control.MousePosition = L.Control.extend({
			options: {
				position: 'bottomleft',
				separator: ' : ',
				emptyString: 'Unavailable',
				lngFirst: false,
				numDigits: 5,
				lngFormatter: undefined,
				latFormatter: undefined,
				prefix: '',
			},

			onAdd: function (map) {
				this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
				L.DomEvent.disableClickPropagation(this._container);
				map.on('mousemove', this._onMouseMove, this);
				this._container.innerHTML = this.options.emptyString;
				return this._container;
			},

			onRemove: function (map) {
				map.off('mousemove', this._onMouseMove);
			},

			scaleLeafletToAtlas: function (e) {
				return e / 1.28;
			},

			_onMouseMove: function (e) {
				let lng = L.Util.formatNum(
					this.scaleLeafletToAtlas(e.latlng.lng) / config.YScale - config.GPSBounds.min[1],
					2,
				);
				let lat = L.Util.formatNum(
					this.scaleLeafletToAtlas(e.latlng.lat) / config.XScale - config.GPSBounds.min[0],
					2,
				);
				let value = lng + this.options.separator + lat;

				let gridX = Math.floor(e.latlng.lng / (256 / config.ServersX)),
					gridY = Math.floor(-e.latlng.lat / (256 / config.ServersY));

				if (
					map._regions &&
					gridX >= 0 &&
					gridY >= 0 &&
					gridX < config.ServersX &&
					gridY < config.ServersY
				) {
					Object.entries(map._regions).forEach(([region, bounds]) => {
						if (
							gridX >= bounds.MinX &&
							gridX <= bounds.MaxX &&
							gridY >= bounds.MinY &&
							gridY <= bounds.MaxY
						) {
							if (region !== 'undefined') value += ' ' + region;
						}
					});
				}

				//let world = map.leafletToWorld([e.latlng.lng, e.latlng.lat]);

				this._container.innerHTML = value; //+ ' ' + e.latlng + ' ' + world;
			},
		});

		L.Control.TeleportPosition = L.Control.extend({
			options: {
				position: 'bottomright',
				separator: ' : ',
				emptyString: 'Click map for TP command',
				lngFirst: false,
				numDigits: 5,
				lngFormatter: undefined,
				latFormatter: undefined,
				prefix: '',
			},

			onAdd: function (map) {
				this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
				L.DomEvent.disableClickPropagation(this._container);
				map.on('click', this._onMouseClick, this);
				this._container.innerHTML = this.options.emptyString;
				return this._container;
			},

			onRemove: function (map) {
				map.off('click', this._onMouseClick);
			},

			_onMouseClick: function (e) {
				let x = this._map.ccc(e.latlng.lng, -e.latlng.lat);
				let value = `cheat TP ${x[0]} ${x[1]} ${x[2]} 10000`;
				if (top.location !== location) {
					top.location.href = document.location.href;
				}
				this._container.innerHTML = value;
			},
		});

		L.Map.mergeOptions({
			positionControl: false,
		});

		L.Map.addInitHook(function () {
			if (this.options.positionControl) {
				this.positionControl = new L.Control.MousePosition();
				this.addControl(this.positionControl);
				this.teleportControl = new L.Control.TeleportPosition();
				this.addControl(this.teleportControl);
			}
		});

		L.control.mousePosition = function (options) {
			return new L.Control.MousePosition(options);
		};
		L.control.mousePosition().addTo(map);

		L.control.teleportPosition = function (options) {
			return new L.Control.TeleportPosition(options);
		};
		L.control.teleportPosition().addTo(map);
	}

	render() {
		return <div id="worldmap"> </div>;
	}
}

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			notification: {},
			entities: {},
			tribes: {},
			sending: false,
		};
	}

	render() {
		const {notification} = this.state;
		return (
			<div className="App">
				<WorldMap />
				<div className={'notification ' + (notification.type || 'hidden')}>
					{' '}
					{notification.msg}{' '}
					<button
						className="close"
						onClick={() =>
							this.setState({
								notification: {},
							})
						}>
						{' '}
						Dismiss{' '}
					</button>{' '}
				</div>{' '}
			</div>
		);
	}
}

function GPStoLeaflet(x, y) {
	let long = (y - config.GPSBounds.min[1]) * config.XScale * 1.28,
		lat = (x - config.GPSBounds.min[0]) * config.YScale * 1.28;

	return [long, lat];
}

function unrealToLeafletSize(size) {
	const unrealx = config.GridSize * config.ServersX;
	return (size / unrealx) * 256;
}

function unrealToLeaflet(x, y) {
	const unrealx = config.GridSize * config.ServersX;
	const unrealy = config.GridSize * config.ServersY;
	let long = -((y / unrealy) * 256),
		lat = (x / unrealx) * 256;
	return [long, lat];
}

function unrealToLeafletArray(a) {
	return unrealToLeaflet(a[0], a[1]);
}

function rotateVector2DAroundAxis(vec, axis, ang) {
	ang = ang * (Math.PI / 180);
	let cos = Math.cos(ang);
	let sin = Math.sin(ang);

	// Translate to axis
	vec[0] -= axis[0];
	vec[1] -= axis[1];

	let r = new Array(vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos);

	// Translate back to world
	r[0] += axis[0];
	r[1] += axis[1];

	return r;
}

ReactDOM.render(<App refresh={5 * 1000 /* 5 seconds */} />, document.getElementById('app'));

class IslandCircle extends L.Circle {
	constructor(latlng, options) {
		super(latlng, options);
		this.Island = null;
		this.bindPopup = this.bindPopup.bind(this);
		this._popupMouseOut = this._popupMouseOut.bind(this);
		this._getParent = this._getParent.bind(this);
	}
	bindPopup(htmlContent, options) {
		if (options && options.showOnMouseOver) {
			L.Marker.prototype.bindPopup.apply(this, [htmlContent, options]);
			this.off('click', this.openPopup, this);
			this.on(
				'mouseover',
				function (e) {
					let target = e.originalEvent.fromElement || e.originalEvent.relatedTarget;
					let parent = this._getParent(target, 'leaflet-popup');
					if (parent == this._popup._container) return true;
					this.openPopup();
				},
				this,
			);
			this.on(
				'mouseout',
				function (e) {
					let target = e.originalEvent.toElement || e.originalEvent.relatedTarget;
					if (this._getParent(target, 'leaflet-popup')) {
						L.DomEvent.on(this._popup._container, 'mouseout', this._popupMouseOut, this);
						return true;
					}
					this.closePopup();
				},
				this,
			);
		}
	}

	_popupMouseOut(e) {
		L.DomEvent.off(this._popup, 'mouseout', this._popupMouseOut, this);
		let target = e.toElement || e.relatedTarget;
		if (this._getParent(target, 'leaflet-popup')) return true;
		if (target == this._path) return true;
		this.closePopup();
	}
	_getParent(element, className) {
		if (element == null) return false;
		let parent = element.parentNode;
		while (parent != null) {
			if (parent.className && L.DomUtil.hasClass(parent, className)) return parent;
			parent = parent.parentNode;
		}
		return false;
	}
}
