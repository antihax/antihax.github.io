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

    if (!contains(i.resources, ["Twigs", "Reeds", "Ironwood", "Iridium", "Cobalt"]))
        continue;
    /* if (!contains(i.resources, ["Opal", "Diamond", "Gem", "Garnet", "Ruby", "Sunstone", "Emerald"]))
         continue;

     if (!contains(i.resources, ["Sugar", "Sugars", "Gum", "Honey", "Saps", "Sap", "Nectar", "Sugarcane", "Syrup", "Resin"]))
         continue;

     if (!contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
         continue;

      if (contains(i.resources, ["Flake Salt", "Salt", "Pink Salt", "Iodine", "Rock Salt", "Kala Namak", "Sea Salt"]))
          if (contains(i.resources, ["Iridium", "Tin", "Silver", "Copper", "Cobalt", "Iron"]))
              if (contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
                  // if (!i.animals.includes("Snake") && !i.animals.includes("GiantSnake"))*/

    /* if (i.claimable !== 1)
         continue;*/

    for (var type in types) {
        if (hasType(i.resources, type))
            if (i.types[types[type]])
                i.types[types[type]]++;
            else
                i.types[types[type]] = 1;
    }
    var count = i.types["Stone"] + i.types["Thatch"] + i.types["Metal"] + i.types["Fiber"];
    if (count >= 6 && i.types["Fiber"] > 2)
        console.log(count, "\t", i.resources["Maps"], "\t", i.grid, "\t", i.name);

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