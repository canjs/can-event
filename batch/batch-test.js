var canEvent = require('can-event');
var QUnit = require('steal-qunit');
var assign = require('can-util/js/assign/assign');
var canBatch = require("can-event/batch/batch");
var eventAsync = require("can-event/async/async");

require('can-util/dom/events/delegate/delegate');

QUnit.module('can-event/batch',{
	setup: function(){
		eventAsync.sync();
	},
	teardown: function(){
		eventAsync.async();
	}
});

QUnit.test("basics", function(){
	var collecting;
	var secondFired = false;
	var obj = assign({}, canEvent);
	obj.on("first", function(ev){
		QUnit.equal(collecting.number, ev.batchNum, "same batch num");
		QUnit.equal(canBatch.dispatching(), collecting, "dispatching old collecting");

		collecting = canBatch.collecting();
		QUnit.ok(!collecting, "not collecting b/c we're not in a batch yet");
		obj.dispatch("second");
		collecting = canBatch.collecting();
		QUnit.ok(collecting, "forced a batch");
		QUnit.equal(secondFired, false, "don't fire yet, put in next batch");

	});


	obj.on("second", function(ev){
		secondFired = true;
		QUnit.equal(collecting.number, ev.batchNum, "same batch num on second");
		QUnit.equal(canBatch.dispatching(), collecting, "dispatching second collecting");
	});

	canBatch.start();
	collecting = canBatch.collecting();
	QUnit.ok(canBatch.collecting(), "is collecting");
	obj.dispatch("first");
	canBatch.stop();


});
