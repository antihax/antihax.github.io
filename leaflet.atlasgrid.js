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
            weight: 1
        },
    },

    initialize: function(options) {
        L.LayerGroup.prototype.initialize.call(this);
        L.Util.setOptions(this, options);
    },

    onAdd: function(map) {
        this._map = map;
        var grid;
        var me = this;

        this.eachLayer(map.addLayer, map);

        fetch('json/gridList.json', {
                dataType: 'json'
            })
            .then(res => res.json())
            .then(function(grids) {

                grid = me.draw(grids);
            })
            .catch(error => {
                console.log(error)
            });
    },

    onRemove: function(map) {
        this.eachLayer(this.removeLayer, this);
    },

    draw: function(grids) {
        var bounds = this._map._originalBounds;
        let xTickSize = (bounds.getEast() - bounds.getWest()) / this.options.xticks;
        let yTickSize = (bounds.getSouth() - bounds.getNorth()) / this.options.yticks;
        for (let i = 0; i < this.options.xticks + 1; i++) {
            this.addLayer(new L.Polyline([
                [bounds.getNorth(), bounds.getWest() + (xTickSize * i)],
                [bounds.getSouth(), bounds.getWest() + (xTickSize * i)]
            ], this.options.lineStyle));
        }
        for (let i = 0; i < this.options.yticks + 1; i++) {
            this.addLayer(new L.Polyline([
                [bounds.getNorth() + (yTickSize * i), bounds.getWest()],
                [bounds.getNorth() + (yTickSize * i), bounds.getEast()]
            ], this.options.lineStyle));
        }

        for (let x = 0; x < this.options.xticks; x++) {
            for (let y = 0; y < this.options.yticks; y++) {
                const grid = String.fromCharCode(65 + x) + (y + 1);

                let color = "white";
                let dropcolor = "black";
                switch (findGlobalBiome(grids[grid].biomes)) {
                    case "Temperate":
                        color = "Red"
                        dropcolor = "Grey"
                        break
                    case "Tundra":
                        color = "Blue"
                        dropcolor = "White"
                        break
                    case "Equatorial":
                        color = "Yellow"
                        dropcolor = "White"
                        break
                    case "Polar":
                        color = "Blue"
                        dropcolor = "Black"
                        break
                    case "Desert":
                        color = "Yellow"
                        dropcolor = "Black"
                        break
                    case "Tropical":
                        color = "Green"
                        dropcolor = "White"
                        break
                    case "Tropics":
                        color = "Green"
                        dropcolor = "White"
                        break

                    default:
                        color = "White";
                }

                let serverType = "";
                let serverTypeName = "Lawless";
                switch (grids[grid].forceServerRules) {
                    case 1: // Lawless
                        serverType = ""
                        serverTypeName = "Lawless"
                        break;
                    case 2: // Lawless claim
                        serverType = "&#9760;"
                        serverTypeName = "Claimable"
                        break;
                    case 3: // island claim
                        serverType = "&#9813;"
                        serverTypeName = "Settlements"
                        break;
                    case 4:
                        serverType = "&#9774;"
                        serverTypeName = "Freeport"
                    default:
                }

                let text = `<div><div class="leaflet-grid-header">${grid}</div> <div class="leaflet-grid-icon">${serverType}</div>`
                let tooltip = L.marker([bounds.getWest() + (yTickSize * y), bounds.getNorth() + (xTickSize * x)], {
                    icon: L.divIcon({
                        className: 'leaflet-grid-marker',
                        iconAnchor: [-2, -2]
                    }),
                    title: `${findGlobalBiome(grids[grid].biomes)} ${serverTypeName}`,
                    clickable: false
                });
                this.addLayer(tooltip);
                tooltip._icon.innerHTML = text

                console.dir(tooltip)
            }
        }

        return this;
    }
});

L.atlasgrid = function(options) {
    return new L.Grid(options);
};

function findGlobalBiome(list) {
    for (let x in list) {
        if (list[x].includes(" Ocean Water"))
            return list[x].replace(" Ocean Water", "");

        let name = list[x];
        name = name.replace("Western ", "");
        name = name.replace("Eastern ", "");
        name = name.replace("Central ", "");
        name = name.replace("At Land", "");
        name = name.replace("Ocean Water", "");
        name = name.replace(" Mountain Peak", "");
        name = name.replace("High ", "");
        name = name.replace("Low ", "");
        name = name.trim();
        if (name)
            return name;
    }
    return false;
}