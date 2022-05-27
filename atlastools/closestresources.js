'use strict';
require('tty');
const fs = require('fs');
const {nextTick} = require('process');

let rawdata = fs.readFileSync('./json/islands.json');
let islands = JSON.parse(rawdata);

rawdata = fs.readFileSync('./json/resourceTypes.json');
let types = JSON.parse(rawdata);

var home = islands[1641];

for (var h in islands) {
	var home = islands[h];
	home.types = {};
	if (home.name.includes('Trench') || home.name.includes('PVE') || home.name.includes('Cave'))
		continue;
	for (var island in islands) {
		var i = islands[island];
		if (i.name.includes('Trench') || i.name.includes('PVE') || i.name.includes('Cave')) continue;
		var dist = distance(home.worldX, home.worldY, i.worldX, i.worldY);

		for (var type in types) {
			if (hasType(i.resources, type)) {
				if (types[type] == 'Metal' || types[type] == 'Stone') {
					// if (types[type] != "Berry" && types[type] != "Vegetable" && types[type] != "BAD" && types[type] != "Base" && types[type] != "Herb" && types[type] != "Coal" && types[type] != "Ignore" && types[type] != "Coral") {
					if (!home.types[type] || home.types[type].distance > dist) {
						home.types[type] = {
							distance: dist,
							grid: i.grid,
							id: i.id,
							type: types[type],
						};
					}
				}
			}
		}
	}
	var avgDist = 0,
		count = 0;

	for (var type in home.types) {
		count++;
		avgDist += home.types[type].distance;
	}
	avgDist /= count;
	if (home.claimable === 1) console.log(home.grid, home.name, home.id, avgDist);
}
console.log(home.types);

// distance in toroidal space
function distance(x1, y1, x2, y2) {
	var dx = Math.abs(x2 - x1);
	var dy = Math.abs(y2 - y1);

	if (dx > 7700000) dx = 15400000 - dx;

	if (dy > 7700000) dy = 15400000 - dy;

	return Math.sqrt(dx * dx + dy * dy);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function demo() {
	await sleep(20000);

	// Sleep in loop
	for (let i = 0; i < 50; i++) {
		if (i === 3) await sleep(2000);
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

function isA(type, search) {
	for (var x in search) {
		if (x === type) {
			return true;
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
