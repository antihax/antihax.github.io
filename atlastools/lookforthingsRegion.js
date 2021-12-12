'use strict';
require('tty')
const fs = require('fs');
const {
    nextTick
} = require('process');

let rawdata = fs.readFileSync('./json/islands.json');
let islands = JSON.parse(rawdata);

rawdata = fs.readFileSync('./json/resourceTypes.json');
let types = JSON.parse(rawdata);

var regions = {};
for (var island in islands) {
    var i = islands[island];
    if (i.name.includes("Trench") || i.name.includes("Cave") || i.name.includes("PVE")  || i.name.includes("ControlPoint")  ) {
        continue;
    }
        
    for (var resource in i.resources) {
        if (!regions[i.region]) {
            regions[i.region] = {};
        }
        regions[i.region][resource] = 1;
    }
}

for (var region in regions) {
    var i = regions[region];
    regions[region]["resources"] = [];
    for (var r in i) {
        regions[region]["resources"].push(r);
    }
}

for (var region in regions) {
    var i = regions[region];
    i.types = {};

  /*  if (!contains(i.resources, ["Quartz", "Herkimer", "Crystal", "Pearl", "Calcite", "Tellurite", "Amethyst"]))
        continue;
    if (!contains(i.resources, ["Opal", "Diamond", "Gem", "Garnet", "Ruby", "Sunstone", "Emerald"]))
        continue;*/

  /*  if (!contains(i.resources, ["Sugar", "Sugars", "Gum", "Honey", "Saps", "Sap", "Nectar", "Sugarcane", "Syrup", "Resin"]))
        continue;

    if (!contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
        continue;*/
    
    /* if (contains(i.resources, ["Flake Salt", "Salt", "Pink Salt", "Iodine", "Rock Salt", "Kala Namak", "Sea Salt"]))
         if (contains(i.resources, ["Iridium", "Tin", "Silver", "Copper", "Cobalt", "Iron"]))
             if (contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
                 // if (!i.animals.includes("Snake") && !i.animals.includes("GiantSnake"))*/

    for (var type in types) {
        if (hasType(i.resources, type))
            if (i.types[types[type]])
                i.types[types[type]]++;
            else
                i.types[types[type]] = 1;
    }

    var count = i.types["Stone"] + i.types["Metal"] + i.types["Thatch"] ;
    var total = i.types["Metal"] + i.types["Thatch"] + i.types["Fiber"] + i.types["Wood"] + i.types["Stone"] + i.types["Crystal"] + i.types["Gem"];
    if (count >= 10)
        console.log(count, total, region, i.types);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {

    await sleep(200000000);


    // Sleep in loop
    for (let i = 0; i < 50; i++) {
        if (i === 3)
            await sleep(200000000);

    }
}

demo();

function contains(list, search) {
    for (var i in search) {
        for (var x in list) {
            if (list[x] == search[i]) {
                return true;
            }
        }
    }
    return false;
}

function hasType(list, type) {
    for (var x in list) {
        if (list[x].startsWith(type)) {
            return true;
        }
    }
    return false;
}