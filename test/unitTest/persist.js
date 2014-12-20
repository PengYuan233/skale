#!/usr/local/bin/node --harmony

var co = require('co');
var fs = require('fs');
var ugrid = require('../../lib/ugrid-context.js')({host: 'localhost', port: 12346});

co(function *() {
	yield ugrid.init();

	var a = '1 2 3 4 5';
	var b = '6 7 8 9 10';
	fs.writeFile('persist.txt', a);

	var P = process.argv[2];
	var dist = ugrid.textFile('test/persist.txt', P).persist();
	var res = yield dist.collect();
	fs.writeFile('persist.txt', b);
	var res = yield dist.collect();
	fs.unlink('persist.txt')

	if (res[0] != a) throw 'error: persist()'

	ugrid.end();
})();