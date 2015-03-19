#! /usr/local/bin/node --harmony

var co = require('co');
var fs = require('fs');
var thenify = require('thenify');
var execCbk = require('child_process').exec;

var exec = thenify(execCbk);

if (process.argv.length != 6) {
	console.log('Usage: run_spark_kmeans.js sparkHomeDir dataFile K nIterations\n\t==> You must provide absolute path')
	process.exit(1);
}

var SPARK_HOME = process.argv[2];
var SOURCE_DATA_FILE = process.argv[3];
var K = process.argv[4];
var N_ITERATIONS = process.argv[5];

var IP = '127.0.0.1';
var PORT = '7077';
var BIN = 'kmeans_benchmark.py';
// var BIN = 'kmeans.py';
var TMP_FILE = '/tmp/' + require('path').basename(SOURCE_DATA_FILE);
var WORKER_INSTANCES = 1;
var MAX_CORES = 4;

var cp_cmd = 'if [ ! -f ' + TMP_FILE + ' ];then cp ' + SOURCE_DATA_FILE + ' ' + TMP_FILE + '; fi';
var exec_cmd = SPARK_HOME + '/bin/spark-submit --master spark://' + IP + ':' + PORT + ' ' + 
	SPARK_HOME + '/examples/src/main/python/mllib/' + BIN + ' ' + TMP_FILE + ' ' + K + ' ' + N_ITERATIONS + ' 2> /dev/null';

co(function *() {
	console.log('Spark home : ' + SPARK_HOME);
	console.log('Binary file : ' + SPARK_HOME + '/examples/src/main/python/mllib/' + BIN);
	console.log('Data file : ' + SOURCE_DATA_FILE);
	console.log('Local data file : ' + TMP_FILE);
	console.log('Iterations : ' + N_ITERATIONS);
	// Copy file if needed
	yield exec(cp_cmd);
	
	for (var i = 1; i <= MAX_CORES; i++) {
		console.log('\nNumber of cores : ' + i);
		console.log('Write spark-env.sh');
		var spark_env = '#!/usr/bin/env bash\n\n' + 
			'export SPARK_MASTER_IP=' + IP + '\n' + 
			'export JAVA_HOME=/usr/lib/jvm/java-1.7.0-openjdk-amd64\n' +
			'export SPARK_EXECUTOR_MEMORY=1G\n' +			
			'export SPARK_WORKER_CORES=' + i + '\n' + 
			'export SPARK_WORKER_INSTANCES=' + WORKER_INSTANCES + '\n';

		fs.writeFileSync(SPARK_HOME + '/conf/spark-env.sh', spark_env, {encoding: 'utf8'}, function(err, res) {
			if (err) throw 'Cannot write spark-env.sh file';
		})

		console.log('Write spark slaves file');
		yield exec('echo ' + IP + ' > ' + SPARK_HOME + '/conf/slaves');

		console.log('Start Spark cluster');
		yield exec(SPARK_HOME + '/sbin/start-all.sh');

		console.log('Run Binary');
		var startTime = new Date();
		var res = yield exec(exec_cmd);
		console.log('Elapsed Time : ' + ((new Date() - startTime) / 1000));
		console.log('Output: ' + res[0]);

		console.log('Stop Spark cluster');
		yield exec(SPARK_HOME + '/sbin/stop-all.sh');

		yield exec('sleep 3');
	}
}).catch(function (err) {
	console.error(err.stack);
	process.exit(1);
});
