#!/usr/local/bin/node --harmony

// Test randomSVMData -> sample -> collect

var co = require('co');
var ugrid = require('../../lib/ugrid-context.js')();
var ml = require('../../lib/ugrid-ml.js');
var test = require('../ugrid-test.js');

process.on('exit', function () {console.assert(ugrid.grid.id !== undefined);});

co(function *() {
	yield ugrid.init();

	var N = 5, D = 2, seed = 1, frac = 0.1, replace = false;

	var ref = test.randomSVMData(N, D, seed, ugrid.worker.length);
	ref = test.sample(ref, ugrid.worker.length, replace, frac, seed);
	var res = yield ugrid.randomSVMData(N, D, seed).sample(replace, frac, seed).collect();
	console.assert(ref.length == res.length);

	ugrid.end();
}).catch(function (err) {
	console.error(err.stack);
	process.exit(1);
});
