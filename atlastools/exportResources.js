'use strict';

const fs = require('fs');

let rawdata = fs.readFileSync('./json/islands.json');
let islands = JSON.parse(rawdata);
rawdata = fs.readFileSync('./json/resourceTypes.json');
let resourceTypes = JSON.parse(rawdata);
let types = {};
let nodes = {};
var resources = {};
var nodecount = {};
var animals = {};

for (var island in islands) {
    var i = islands[island];
    for (var animal in i.animals) {
        animals[i.animals[animal]] = "";
    }
    for (var resource in i.resources) {
        let res = resource.replace(/ \(Rock\)/g, '');
        if (!resources[res])
            resources[res] = {
                count: 0,
                type: resourceTypes[res]
            };
        if (!nodecount[res])
            nodecount[res] = {
                count: 0,
                type: resourceTypes[res]
            };
        if (!resources[res].type) {
            console.log("Missing " + res)
        }

        resources[res].count++;
        nodecount[res].count += i.resources[resource];
    }
}

for (var type in resourceTypes) {
    types[resourceTypes[type]] = new Array();
    nodes[resourceTypes[type]] = new Array();
}

for (var type in types) {
    for (var resource in resources) {
        if (resources[resource].type === type) {
            let add = {};
            add[resource] = resources[resource].count;
            types[type].push(add);
        }
    }
    for (var resource in nodecount) {
        if (nodecount[resource].type === type) {
            let add = {};
            add[resource] = nodecount[resource].count;
            nodes[type].push(add);
        }
    }

}
fs.writeFileSync('./json/nodeCount.json', JSON.stringify(nodes, null, "\t"));
fs.writeFileSync('./json/animalCheck.json', JSON.stringify(animals, null, "\t"));
fs.writeFileSync('./json/resourceCheck.json', JSON.stringify(types, null, "\t"));


console.log("done")

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