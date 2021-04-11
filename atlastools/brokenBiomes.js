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
    if (!i.biomes || i.biomes.length == 0)
        console.log(i.grid, ",", i.name);
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