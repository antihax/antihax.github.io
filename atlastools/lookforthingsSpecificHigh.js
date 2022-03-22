'use strict';

const fs = require('fs');


let rawdata = fs.readFileSync('./json/islandExtended.json');
let islands = JSON.parse(rawdata);

rawdata = fs.readFileSync('./json/resourceTypes.json');
let types = JSON.parse(rawdata);

rawdata = fs.readFileSync('./json/gridList.json');
let gridList = JSON.parse(rawdata);

for (var island in islands) {
    var i = islands[island];
    i.types = {};

    /* if (!contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
         continue;
     if (!contains(i.resources, ["Silk"]))
         continue;
         if (contains(i.resources, ["Iridium"]))
         continue;        */
    /*if (!contains(i.resources, ["Twigs", "Reeds", "Ironwood", "Iridium", "Cobalt"]))
        continue;
     if (!contains(i.resources, ["Opal", "Diamond", "Gem", "Garnet", "Ruby", "Sunstone", "Emerald"]))
         continue;

     if (!contains(i.resources, ["Sugar", "Sugars", "Gum", "Honey", "Saps", "Sap", "Nectar", "Sugarcane", "Syrup", "Resin"]))
         continue;

     if (!contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
         continue;

      if (contains(i.resources, ["Flake Salt", "Salt", "Pink Salt", "Iodine", "Rock Salt", "Kala Namak", "Sea Salt"]))
          if (contains(i.resources, ["Iridium", "Tin", "Silver", "Copper", "Cobalt", "Iron"]))
              if (contains(i.resources, ["Mineral Oil", "Crude Oil", "Shale Oil", "Naptha"]))
                  // if (!i.animals.includes("Snake") && !i.animals.includes("GiantSnake"))*/

    /*if (gridList[i.grid].forceServerRules != 3)
       continue;*/




    var totalTypes = 0;
    for (var type in types) {
        if (hasType(i.resources, type))
            if (i.types[types[type]]) {
                i.types[types[type]]++;
            } else {
                i.types[types[type]] = 1;
                totalTypes++;
            }
    }
    var count = i.types["Stone"] + i.types["Thatch"] + i.types["Metal"] + i.types["Fiber"];
    if (count > 1 && i.resources["Slate"] > 2000)
        console.log(i.grid, "\t", count, i.name, "\t", i.types["Stone"], i.types["Thatch"], i.types["Metal"], i.types["Fiber"]);
    //console.dir(i.assets)
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