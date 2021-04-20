if (!window) {
  function require() {}
  const
    React = require("react"),
    ReactDOM = require("react-dom"),
    L = require("leaflet");
}

class WorldMap extends React.Component {
  constructor(props) {
    super(props)
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

    const baseLayer = L.tileLayer("tiles/{z}/{x}/{y}.webp", layerOpts)

    var map = this.worldMap = L.map("worldmap", {
      crs: L.CRS.Simple,
      layers: [baseLayer],
      zoomControl: false,
      attributionControl: false,
    })

    map._originalBounds = layerOpts.bounds;

    // Add zoom control
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    map.Islands = L.layerGroup(layerOpts);
    map.Grid = new L.AtlasGrid({
      xticks: config.ServersX,
      yticks: config.ServersY
    }).addTo(map);
    map.IslandTerritories = L.layerGroup(layerOpts);
    map.IslandResources = L.layerGroup(layerOpts);
    map.Discoveries = L.layerGroup(layerOpts);
    map.Bosses = L.layerGroup(layerOpts);
    map.ControlPoints = L.layerGroup(layerOpts);
    map.Ships = L.layerGroup(layerOpts).addTo(map);
    map.Stones = L.layerGroup(layerOpts);
    map.Treasure = L.layerGroup(layerOpts);
    var SearchBox = L.Control.extend({
      onAdd: function () {
        var element = document.createElement("input");
        element.id = "searchBox";
        element.onchange = function (ev) {
          var search = document.getElementById("searchBox").value.toLowerCase();
          map.IslandResources.eachLayer(function (layer) {
            if (search !== "" &&
              (
                layer.animals.find(function (element) {
                  return element.toLowerCase().includes(search);
                }) ||
                layer.resources.find(function (element) {
                  return element.toLowerCase().includes(search);
                }))
            )
              layer.setStyle({
                radius: 1.5,
                color: "#f00",
                opacity: 1,
                fillOpacity: 1,
              })
            else
              layer.setStyle({
                radius: 1.5,
                color: "#f00",
                opacity: 0,
                fillOpacity: 0.1,
              })
          })

        };
        return element;
      }
    });
    (new SearchBox).addTo(map);
    var input = document.getElementById("searchBox");

    var measureControl = new L.Control.Measure({});
    measureControl.addTo(map);

    // Add Layer Control
    L.control.layers({}, {
      Grid: map.Grid,
      Discoveries: map.Discoveries,
      Treasure: map.Treasure,
      ControlPoints: map.ControlPoints,
      Islands: map.Islands.addTo(map),
      Resources: map.IslandResources.addTo(map),
      Bosses: map.Bosses,
      Ships: map.Ships,
      Stones: map.Stones,
    }, {
      position: 'topright'
    }).addTo(map);

    var stickyLayers = {};
    map.on('overlayadd', function (e) {
      stickyLayers[e.name] = true;
    });

    map.on('overlayremove', function (e) {
      stickyLayers[e.name] = false;
    });

    map.on('zoomend', function () {
      if (map.getZoom() < 5) {
        if (!stickyLayers["Bosses"]) map.removeLayer(map.Bosses);
        if (!stickyLayers["Stones"]) map.removeLayer(map.Stones);
      } else {
        if (!stickyLayers["Bosses"]) {
          map.addLayer(map.Bosses);
          stickyLayers["Bosses"] = false;
        }

        if (!stickyLayers["Stones"]) {
          map.addLayer(map.Stones);
          stickyLayers["Stones"] = false;
        }
      }
    });

    map.setView([-128, 128], 2)

    var createIslandLabel = function (island) {
      var label = "";
      label += '<div id="island_' + island.IslandID + '" class="islandlabel">';
      label += '<div class="islandlabel_icon"><img class="islandlabel_size" src="' + getIslandIcon(island) + '" width="32" height="32"/></div>';
      label += '</div>'
      return L.divIcon({
        className: "islandlabel",
        html: label
      })
    }
    var createLabelIcon = function (labelClass, labelText) {
      return L.divIcon({
        className: labelClass,
        html: labelText
      })
    }

    var CPIcon = L.icon({
      iconUrl: 'icons/lighthouse.svg',
      iconSize: [16, 16],
      iconAnchor: [16, 16],
    });

    var hydraIcon = L.icon({
      iconUrl: 'icons/Hydra.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var yetiIcon = L.icon({
      iconUrl: 'icons/Yeti.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var drakeIcon = L.icon({
      iconUrl: 'icons/Drake.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var meanWhaleIcon = L.icon({
      iconUrl: 'icons/MeanWhale.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var gentleWhaleIcon = L.icon({
      iconUrl: 'icons/GentleWhale.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var giantSquidIcon = L.icon({
      iconUrl: 'icons/GiantSquid.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    var stoneIcon = L.icon({
      iconUrl: 'icons/Stone.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    fetch('json/bosses.json', {
        dataType: 'json'
      })
      .then(res => res.json())
      .then(function (bosses) {
        bosses.forEach(d => {
          if (d.name === "Drake") {
            var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
              icon: drakeIcon,
            });
          } else if (d.name === "Hydra") {
            var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
              icon: hydraIcon,
            });
          } else if (d.name === "Yeti") {
            var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
              icon: yetiIcon,
            });
          } else if (d.name === "GiantSquid") {
            var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
              icon: giantSquidIcon,
            });
          } else if (d.name === "GentleWhale") {
            var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
              icon: gentleWhaleIcon,
            });
          } else if (d.name === "MeanWhale") {
            var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
              icon: meanWhaleIcon,
            });
          }

          pin.bindPopup(`${d.name}: ${d.long.toFixed(2)} / ${d.lat.toFixed(2)}`, {
            showOnMouseOver: true,
            autoPan: true,
            keepInView: true,
          });

          map.Bosses.addLayer(pin)

        });

        var krakenSpawn = L.circle([-128, 128], {
          radius: 1.68,
          interactive: true,
          color: "red",
          fillOpacity: 0,
        }).bindPopup("Kraken Spawn Area");
        var krakenWall = L.circle([-128, 128], {
          radius: 2.35,
          interactive: true,
          color: "blue",
          fillOpacity: 0,
        }).bindPopup("Kraken Border Wall");
        map.Bosses.addLayer(krakenWall);
        map.Bosses.addLayer(krakenSpawn);
      })
      .catch(error => {
        console.log(error)
      });

    fetch('json/stones.json', {
        dataType: 'json'
      })
      .then(res => res.json())
      .then(function (stones) {
        stones.forEach(d => {
          var pin = new L.Marker(GPStoLeaflet(d.long, d.lat), {
            icon: stoneIcon,
          });
          pin.bindPopup(`${d.name}: ${d.long.toFixed(2)} / ${d.lat.toFixed(2)}`, {
            showOnMouseOver: true,
            autoPan: true,
            keepInView: true,
          });

          map.Stones.addLayer(pin)
        })
      })
      .catch(error => {
        console.log(error)
      });

    fetch('json/shipPaths.json', {
        dataType: 'json'
      })
      .then(res => res.json())
      .then(function (paths) {
        paths.forEach(path => {
          var pathing = [];

          var n = path.Nodes[0];
          var center = [n.worldX, n.worldY];
          var previous = rotateVector2DAroundAxis([n.worldX - n.controlPointsDistance, n.worldY], center, n.rotation);
          var next = rotateVector2DAroundAxis([n.worldX + n.controlPointsDistance, n.worldY], center, n.rotation);

          pathing.push('M', unrealToLeaflet(n.worldX, n.worldY))
          pathing.push('C', unrealToLeafletArray(next), unrealToLeafletArray(previous), unrealToLeafletArray(center))

          path.Nodes.push(path.Nodes.shift());
          for (var i = 0; i < path.Nodes.length; i++) {
            var n = path.Nodes[i];
            var center = [n.worldX, n.worldY];
            var previous = rotateVector2DAroundAxis([n.worldX - n.controlPointsDistance, n.worldY], center, n.rotation);
            pathing.push('S', unrealToLeafletArray(previous), unrealToLeafletArray(center))
          }

          var p = L.curve(pathing, {
            color: 'red',
            dashArray: '10',
          }).addTo(map);
          map.Ships.addLayer(p)
        })
      })
      .catch(error => {
        console.log(error)
      });

    fetch('json/islands.json', {
        dataType: 'json'
      })
      .then(res => res.json())
      .then(function (islands) {
        map._islands = islands;

        for (let k in islands) {
          var island = islands[k];
          if (island.isControlPoint) {
            var pin = new L.Marker(unrealToLeaflet(island.worldX, island.worldY), {
              icon: CPIcon,
            });
            pin.bindPopup(`Control Point`, {
              showOnMouseOver: true,
              autoPan: true,
              keepInView: true,
            });

            map.ControlPoints.addLayer(pin)
            continue;
          }

          if (island.animals || island.resources) {
            var circle = new IslandCircle(unrealToLeaflet(island.worldX, island.worldY), {
              radius: 1.5,
              color: "#f00",
              opacity: 0,
              fillOpacity: 0.1,
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
                if (!seen[k] && !biome.name.includes("At Land") && !biome.name.includes("Ocean Water")) {
                  seen[k] = 1;
                  circle.biomes.push(island.biomes[key]);
                }
              }
              circle.biomes.sort();
            }

            var html = `<b>${island.name} - ${island.id}</b><br>`;

            for (let b in circle.biomes.sort()) {
              let biome = circle.biomes[b];
              html += `${biome.name} [Min: ${biome.temp[0].toFixed()}  Max: ${biome.temp[1].toFixed()}]<br>`;
            }

            html += `<ul class='split-ul'>`;
            for (let resource in circle.animals.sort()) {
              html += "<li>" + circle.animals[resource] + "</li>";
            }
            html += "</ul>";

            if (island.resources) {
              var resources = [];
              for (let key in island.resources) {
                if (key.length > 2)
                  circle.resources.push(key);
              }
              circle.resources.sort();

              html += "<ul class='split-ul'>";
              circle.resources.forEach(function (v) {
                html += "<li>" + v + " (" + island.resources[v] + ")</li>";
              });
              html += "</ul>";
            }
            circle.bindPopup(html, {
              showOnMouseOver: true,
              autoPan: false,
              keepInView: true,
              maxWidth: 560,
            });
            map.IslandResources.addLayer(circle);

            var center = unrealToLeaflet(island.worldX, island.worldY),
              offsets = unrealToLeaflet(island.islandWidth, island.islandHeight),
              islandBounds = rotatePoints(center, [
                [center[0] - (offsets[0] / 2), center[1] - (offsets[1] / 2)], // Top left
                [center[0] - (offsets[0] / 2), center[1] + (offsets[1] / 2)], // Top right
                [center[0] + (offsets[0] / 2), center[1] - (offsets[1] / 2)] //  Bottom left
              ], island.rotation);

            var islandImage = L.imageOverlay.rotated("islandImages/" + island.name + ".webp",
              L.latLng(islandBounds[0]),
              L.latLng(islandBounds[1]),
              L.latLng(islandBounds[2]), {
                opacity: 1,
                interactive: true
              });
            map.Islands.addLayer(islandImage);
          }

          if (island.treasureMapSpawnPoints) {
            var center = unrealToLeaflet(island.worldX, island.worldY);
            const points = rotatePoints(center,
              island.treasureMapSpawnPoints.map(x => {
                var coords = x.split(" ").map(x => parseFloat(x));
                return unrealToLeaflet(island.worldX + coords[0], island.worldY + coords[1])
              }), island.rotation);

            for (var spawn in points) {
              var circle = new IslandCircle(points[spawn], {
                radius: .03,
                color: "#00FF00",
                opacity: 0.5,
                fillOpacity: 0.5,
              });
              map.Treasure.addLayer(circle);
            }
          }
          if (island.discoveries) {
            for (let disco in island.discoveries) {
              var d = island.discoveries[disco];
              var circle = new IslandCircle(GPStoLeaflet(d.long, d.lat), {
                radius: .05,
                color: "#000000",
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
      .catch(error => {
        console.log(error)
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
        prefix: ""
      },

      onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
        L.DomEvent.disableClickPropagation(this._container);
        map.on('mousemove', this._onMouseMove, this);
        this._container.innerHTML = this.options.emptyString;
        return this._container;
      },

      onRemove: function (map) {
        map.off('mousemove', this._onMouseMove)
      },

      _onMouseMove: function (e) {
        var lng = L.Util.formatNum(scaleLeafletToAtlas(e.latlng.lng) - 100, 2);
        var lat = L.Util.formatNum(100 - scaleLeafletToAtlas(-e.latlng.lat), 2);
        var value = lng + this.options.separator + lat;
        var prefixAndValue = this.options.prefix + ' ' + value;
        this._container.innerHTML = prefixAndValue;
      }
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
        prefix: ""
      },

      onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
        L.DomEvent.disableClickPropagation(this._container);
        map.on('click', this._onMouseClick, this);
        this._container.innerHTML = this.options.emptyString;
        return this._container;
      },

      onRemove: function (map) {
        map.off('click', this._onMouseClick)
      },

      _onMouseClick: function (e) {
        var x = ccc(e.latlng.lng, -e.latlng.lat);
        var lng = L.Util.formatNum(scaleLeafletToAtlas(e.latlng.lng) - 100, 2);
        var lat = L.Util.formatNum(100 - scaleLeafletToAtlas(-e.latlng.lat), 2);
        var value = `cheat TP ${x[0]} ${x[1]} ${x[2]} 10000`;
        if (top.location != location) {
          top.location.href = document.location.href;
        }
        this._container.innerHTML = value;
      }
    });

    L.Map.mergeOptions({
      positionControl: false
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
    return ( <
      div id = "worldmap" > < /div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      notification: {},
      entities: {},
      tribes: {},
      sending: false,
    }
  }

  render() {
    const {
      notification
    } = this.state
    return ( <
      div className = "App" >
      <
      WorldMap / >
      <
      div className = {
        "notification " + (notification.type || "hidden")
      } > {
        notification.msg
      } <
      button className = "close"
      onClick = {
        () => this.setState({
          notification: {}
        })
      } > Dismiss < /button> < /
      div > <
      /div>
    )
  }
}

function scaleAtlasToLeaflet(e) {
  return (e + 100) * (1.28);
}

function scaleLeafletToAtlas(e) {
  return (e / 1.28);
}

function GPStoLeaflet(x, y) {
  var long = (y - 100) * 1.28,
    lat = (100 + x) * 1.28;

  return [long, lat];
}

function unrealToLeaflet(x, y) {
  const unrealx = config.GridSize * config.ServersX;
  const unrealy = config.GridSize * config.ServersY;
  var long = -((y / unrealy) * 256),
    lat = ((x / unrealx) * 256);
  return [long, lat];
}

function rotateVector2DAroundAxis(vec, axis, ang) {
  ang = ang * (Math.PI / 180);
  var cos = Math.cos(ang);
  var sin = Math.sin(ang);

  // Translate to axis
  vec[0] -= axis[0];
  vec[1] -= axis[1];

  var r = new Array(vec[0] * cos - vec[1] * sin, vec[0] * sin + vec[1] * cos);

  // Translate back to world
  r[0] += axis[0];
  r[1] += axis[1];

  return r;
}

function rotatePoints(center, points, yaw) {
  var res = []
  var angle = yaw * (Math.PI / 180)
  for (var i = 0; i < points.length; i++) {
    var p = points[i]
    var p2 = [p[0] - center[0], p[1] - center[1]]
    var p3 = [Math.cos(angle) * p2[0] - Math.sin(angle) * p2[1], Math.sin(angle) * p2[0] + Math.cos(angle) * p2[1]]
    var p4 = [p3[0] + center[0], p3[1] + center[1]]
    res.push(p4)
  }
  return res
}

function unrealToLeafletArray(a) {
  return unrealToLeaflet(a[0], a[1]);
}

function constraint(value, minRange, maxRange, minVal, maxVal) {
  return (((value - minVal) / (maxVal - minVal)) * (maxRange - minRange) + minRange);
}

function ccc(x, y) {
  var precision = (256 / config.ServersX);
  var gridXName = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
  var gridX = gridXName[Math.floor(x / precision)];
  var gridY = Math.floor(y / precision) + 1;
  var localX = constraint(x % precision, -700000, 700000, 0, precision).toFixed(0);
  var localY = constraint(y % precision, -700000, 700000, 0, precision).toFixed(0);

  return [gridX + gridY, localX, localY];
}

// Get local URI for requests
function getLocalURI() {
  var loc = window.location,
    new_uri;
  if (loc.protocol === "https:") {
    new_uri = "wss:";
  } else {
    new_uri = "ws:";
  }
  new_uri += "//" + loc.host;
  return new_uri;
}

ReactDOM.render( <
  App refresh = {
    5 * 1000 /* 5 seconds */
  }
  />,
  document.getElementById("app")
)

class QElement {
  constructor(element, priority) {
    this.element = element;
    this.priority = priority;
  }
}
class PriorityQueue {
  constructor() {
    this.items = [];
  }
  enqueue(element, priority) {
    var qElement = new QElement(element, priority);
    var contain = false;
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].priority > qElement.priority) {
        this.items.splice(i, 0, qElement);
        contain = true;
        break;
      }
    }
    if (!contain) {
      this.items.push(qElement);
    }
  }
  dequeue() {
    return this.items.shift();
  }
  front() {
    return this.items[0];
  }
  isEmpty() {
    return this.items.length == 0;
  }
  clear() {
    this.items = []
  }
}

function formatSeconds(InTime) {
  var Days = 0
  var Hours = Math.floor(InTime / 3600);
  var Minutes = Math.floor((InTime % 3600) / 60);
  var Seconds = Math.floor((InTime % 3600) % 60);
  if (Hours >= 24) {
    Days = Math.floor(Hours / 24);
    Hours = Hours - (Days * 24)
  }
  if (Days > 0)
    return Days + "d:" + Hours + "h:" + Minutes + "n:" + Seconds + "s";
  else if (Hours > 0)
    return Hours + "h:" + Minutes + "m:" + Seconds + "s";
  else if (Minutes > 0)
    return Minutes + "m:" + Seconds + "s";
  else
    return Seconds + "s";
}

function getWarState(Island) {
  var now = Math.floor(Date.now() / 1000)
  if (now >= Island.WarStartUTC && now < Island.WarEndUTC) {
    Island.bWar = true;
    Island.WarNextUpdateSec = Island.WarEndUTC - now;
    return "AT WAR! ENDS IN " + formatSeconds(Island.WarNextUpdateSec)
  } else if (now < Island.WarStartUTC) {
    Island.bWar = false;
    Island.WarNextUpdateSec = Island.WarStartUTC - now;
    return "WAR BEGINS IN " + formatSeconds(Island.WarNextUpdateSec)
  } else if (now < Island.WarEndUTC + 5 * 24 * 3600) {
    Island.bWar = false;
    Island.WarNextUpdateSec = Island.WarEndUTC + 5 * 24 * 3600 - now;
    return "CAN DECLARE WAR IN " + formatSeconds(Island.WarNextUpdateSec)
  } else {
    Island.bWar = false;
    Island.WarNextUpdateSec = Number.MAX_SAFE_INTEGER;
    return "War can be declared on this settlement."
  }
}

function getPeaceState(Island) {
  var now = new Date();
  var CombatStartSeconds = Island.CombatPhaseStartTime;
  var CombatEndSeconds = (CombatStartSeconds + 32400) % 86400;
  var CurrentDaySeconds = (3600 * now.getUTCHours()) + (60 * now.getUTCMinutes()) + now.getUTCSeconds();
  if (CombatEndSeconds > CombatStartSeconds) {
    if (CurrentDaySeconds < CombatStartSeconds) {
      Island.bCombat = false;
      Island.CombatNextUpdateSec = CombatStartSeconds - CurrentDaySeconds;
      return "In Peace Phase. " + formatSeconds(Island.CombatNextUpdateSec) + " remaining"
    } else if (CurrentDaySeconds >= CombatStartSeconds && CurrentDaySeconds < CombatEndSeconds) {
      Island.bCombat = true;
      Island.CombatNextUpdateSec = CombatEndSeconds - CurrentDaySeconds;
      return "In Combat Phase! " + formatSeconds(Island.CombatNextUpdateSec) + " remaining"
    } else {
      Island.bCombat = false;
      Island.CombatNextUpdateSec = 86400 - CurrentDaySeconds + CombatStartSeconds
      return "In Peace Phase." + formatSeconds(Island.CombatNextUpdateSec) + " remaining"
    }
  } else {
    if (CurrentDaySeconds >= CombatStartSeconds) {
      Island.bCombat = true;
      Island.CombatNextUpdateSec = 86400 - CurrentDaySeconds + CombatEndSeconds;
      return "In Combat Phase! " + formatSeconds(Island.CombatNextUpdateSec) + " remaining"
    } else if (CurrentDaySeconds < CombatEndSeconds) {
      Island.bCombat = true;
      Island.CombatNextUpdateSec = CombatEndSeconds - CurrentDaySeconds;
      return "In Combat Phase! " + formatSeconds(Island.CombatNextUpdateSec) + " remaining"
    } else {
      Island.bCombat = false;
      Island.CombatNextUpdateSec = CombatStartSeconds - CurrentDaySeconds;
      return "In Peace Phase. " + formatSeconds(Island.CombatNextUpdateSec) + " remaining"
    }
  }
}

function getIslandIcon(Island) {
  if (Island.bWar || Island.bCombat)
    return "HUD_War_Icon.png";
  else
    return "HUD_Peace_Icon.png";
}
var GlobalSelectedIsland = null;
var GlobalPriortyQueue = new PriorityQueue();
setInterval(updateIsland, 1000)

function updateIsland() {
  while (!GlobalPriortyQueue.isEmpty()) {
    var now = Math.floor(Date.now() / 1000);
    if (GlobalPriortyQueue.front().priority > now)
      break;
    var Island = GlobalPriortyQueue.dequeue().element;
    getWarState(Island);
    getPeaceState(Island);
    var el = document.getElementById("island_" + Island.IslandID);
    if (el != null) {
      var img = el.getElementsByClassName("islandlabel_size")[0];
      img.src = getIslandIcon(Island);
    }
    var nextUpdate = Island.CombatNextUpdateSec;
    if (Island.WarNextUpdateSec < nextUpdate)
      nextUpdate = Island.WarNextUpdateSec;
    GlobalPriortyQueue.enqueue(Island, now + nextUpdate + 1);
  }
  if (GlobalSelectedIsland != null) {
    var phase = document.getElementById("pop_up_phase")
    if (phase != null)
      phase.innerHTML = getPeaceState(GlobalSelectedIsland)
    var war = document.getElementById("pop_up_war")
    if (war != null)
      war.innerHTML = getWarState(GlobalSelectedIsland)
  }
}
class IslandCircle extends L.Circle {
  constructor(latlng, options) {
    super(latlng, options)
    this.Island = null
    this.bindPopup = this.bindPopup.bind(this)
    this._popupMouseOut = this._popupMouseOut.bind(this)
    this._getParent = this._getParent.bind(this)
  }
  bindPopup(htmlContent, options) {
    if (options && options.showOnMouseOver) {
      L.Marker.prototype.bindPopup.apply(this, [htmlContent, options]);
      this.off("click", this.openPopup, this);
      this.on("mouseover", function (e) {
        var target = e.originalEvent.fromElement || e.originalEvent.relatedTarget;
        var parent = this._getParent(target, "leaflet-popup");
        if (parent == this._popup._container)
          return true;
        GlobalSelectedIsland = this.Island
        this.openPopup();
      }, this);
      this.on("mouseout", function (e) {
        var target = e.originalEvent.toElement || e.originalEvent.relatedTarget;
        if (this._getParent(target, "leaflet-popup")) {
          L.DomEvent.on(this._popup._container, "mouseout", this._popupMouseOut, this);
          return true;
        }
        this.closePopup();
        GlobalSelectedIsland = null
      }, this);
    }
  }
  _popupMouseOut(e) {
    L.DomEvent.off(this._popup, "mouseout", this._popupMouseOut, this);
    var target = e.toElement || e.relatedTarget;
    if (this._getParent(target, "leaflet-popup"))
      return true;
    if (target == this._path)
      return true;
    this.closePopup();
    GlobalSelectedIsland = null;
  }
  _getParent(element, className) {
    if (element == null)
      return false;
    var parent = element.parentNode;
    while (parent != null) {
      if (parent.className && L.DomUtil.hasClass(parent, className))
        return parent;
      parent = parent.parentNode;
    }
    return false;
  }
}

function escapeHTML(unsafe_str) {
  return unsafe_str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/\"/g, '"').replace(/\'/g, '\'');
}