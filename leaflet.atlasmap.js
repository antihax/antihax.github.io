L.AtlasMap = L.Map.extend({
    initialize: function(id, options) {
        options = L.extend(options || {}, {});
        return L.Map.prototype.initialize.call(this, id, options);
    },
    addPortalPin: function(icon, location, text, angle = 0) {
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
                    line.setStyle({ opacity: 1 });
                });
            },
            mouseout: (e) => {
                e.target.firstPin.lines.forEach((line) => {
                    line.setStyle({ opacity: 0.01 });
                });
            },
        });
        return pin;
    },
});

L.atlasmap = function(id, options) {
    return new L.AtlasMap(id, options);
};