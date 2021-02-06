'use strict';
require('tty')
const fs = require('fs');
const {
    nextTick
} = require('process');

let rawdata = fs.readFileSync('./json/islands-sge.json');
let islands = JSON.parse(rawdata);

var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('./json/allislands.txt')
});

lineReader.on('line', function (isl) {
    let found = false;
    for (var island in islands) {
        var i = islands[island];
        if (contains(isl, i.sublevelNames)) {
            found = true;
            console.log("found " + isl);
        }
    }
    if (!found)
        console.log(isl);
});

function contains(list, search) {
    for (var i in search) {
            if (list == search[i]) {
                return true;
            }
    }
    return false;
}