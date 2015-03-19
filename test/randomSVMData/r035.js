#!/usr/local/bin/node --harmony

// Test randomSVMData -> distinct -> lookup

var co = require('co');
var ugrid = require('../../lib/ugrid-context.js')();
var test = require('../ugrid-test.js');

process.on('exit', function () {console.assert(ugrid.grid.id !== undefined);});

co(function *() {
	yield ugrid.init();

	var N = 5, D = 1, seed = 1, key = -1;

	var ref = test.randomSVMData(N, D, seed);
	ref = test.distinct(ref).filter(function (e) {return e[0] == key;});
	var res = yield ugrid.randomSVMData(N, D, seed).distinct().lookup(key);
	console.assert(test.arrayEqual(ref, res));

	ugrid.end();
}).catch(function (err) {
	console.error(err.stack);
	process.exit(1);
});
