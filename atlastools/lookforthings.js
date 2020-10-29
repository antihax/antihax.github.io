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

for (var island in islands) {
    var i = islands[island];
    i.types = {};
    /*if (contains(i.resources, ["Quartz", "Herkimer", "Crystal", "Pearl", "Calcite", "Tellurite", "Amethyst"]))
        if (contains(i.resources, ["Opal", "Diamond", "Gem", "Garnet", "Ruby", "Sunstone", "Emerald"]))
            if (contains(i.resources, ["Sugar", "Sugars", "Gum", "Honey", "Saps", "Sap", "Nectar", "Sugarcane", "Syrup", "Resin"]))
                if (contains(i.resources, ["Flake Salt", "Salt", "Pink Salt", "Iodine", "Rock Salt", "Kala Namak", "Sea Salt"]))
                    if (contains(i.resources, ["Iridium", "Tin", "Silver", "Copper", "Cobalt", "Iron"]))
                        if (contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
                           // if (!i.animals.includes("Snake") && !i.animals.includes("GiantSnake"))*/
    if (i.claimable !== 1)
        continue;

    for (var type in types) {
        if (hasType(i.resources, type))
            if (i.types[types[type]])
                i.types[types[type]]++;
            else
                i.types[types[type]] = 1;
    }
    var count = i.types["Wood"] + i.types["Thatch"] + i.types["Fiber"] ;
    if (count >= 5 && (i.types["Coal"] > 0 || i.types["Oil"]) > 0)
        console.log(count, i.grid, i.name, i.types, i.discoveries);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {

    await sleep(20000);


    // Sleep in loop
    for (let i = 0; i < 50; i++) {
        if (i === 3)
            await sleep(2000);

    }
}

demo();

function contains(list, search) {
    for (var i in search) {
        for (var x in list) {
            if (x == search[i]) {
                return true;
            }
        }
    }
    return false;
}

function hasType(list, type) {
    for (var x in list) {
        if (x.startsWith(type)) {
            return true;
        }
    }
    return false;
}