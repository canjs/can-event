var canEvent = require('can-event');
var QUnit = require('steal-qunit');
var assign = require('can-util/js/assign/assign');
var canBatch = require("can-event/batch/batch");
var eventAsync = require("can-event/async/async");
var canDev = require('can-util/js/dev/dev');

require('can-util/dom/events/delegate/delegate');

QUnit.module('can-event/batch',{
	beforeEach: function(assert) {
		eventAsync.sync();
	},
	afterEach: function(assert) {
		eventAsync.async();
	}
});

QUnit.test("basics", function(assert) {
	var collecting;
	var secondFired = false;
	var obj = assign({}, canEvent);
	obj.on("first", function(ev, arg1, arg2){
		assert.equal(collecting.number, ev.batchNum, "same batch num");
		assert.equal(canBatch.dispatching(), collecting, "dispatching old collecting");
		assert.equal(arg1, 1, "first arg");
		assert.equal(arg2, 2, "second arg");

		collecting = canBatch.collecting();
		assert.ok(!collecting, "not collecting b/c we're not in a batch yet");
		obj.dispatch("second");
		collecting = canBatch.collecting();
		assert.ok(collecting, "forced a batch");
		assert.equal(secondFired, false, "don't fire yet, put in next batch");

	});


	obj.on("second", function(ev){
		secondFired = true;
		assert.equal(collecting.number, ev.batchNum, "same batch num on second");
		assert.equal(canBatch.dispatching(), collecting, "dispatching second collecting");
	});

	canBatch.start();
	collecting = canBatch.collecting();
	assert.ok(canBatch.collecting(), "is collecting");
	obj.dispatch("first",[1,2]);
	canBatch.stop();


});

QUnit.test("events are queued and dispatched without .stop being called (#14)", function(assert) {
	var obj = assign({}, canEvent);


	obj.on("first", function(ev){
		obj.dispatch("second");
		assert.ok(canBatch.collecting() !== canBatch.dispatching(), "dispatching is not collecting");
	});

	obj.on("second", function(){
		assert.ok(canBatch.collecting() !== canBatch.dispatching(), "dispatching is not collecting");
		assert.ok(true, "called");
	});

	canBatch.start();
	obj.dispatch("first");
	canBatch.stop();
});

QUnit.test("Everything is part of a batch", function(assert) {
	var obj = {};
	assign(obj, canEvent);

	obj.on("foo", function(ev){
		assert.ok(ev.batchNum); // There is a batch number
	});

	obj.dispatch("foo");
});

QUnit.test("batch.queue callback called after events fired in the same fn", function(assert) {
	var obj = assign({}, canEvent);

	var thirdCalled = false, firstBatch;
	obj.on("third",function(ev){
		assert.equal( firstBatch, ev.batchNum, "third is right");
		thirdCalled = true;
	});

	obj.on("first", function(ev){
		assert.equal(typeof ev.batchNum, "number", "got a batch number");
		firstBatch = ev.batchNum;
		canBatch.queue([function(){
			assert.equal(thirdCalled, true, "third called before this");
		}, null, []]);

		obj.dispatch({type: "third", batchNum: ev.batchNum});
	});

	obj.dispatch("first");
});


QUnit.test("afterPreviousEvents doesn't run after all collecting previous events (#17)", function(assert) {
	var obj = assign({}, canEvent);
	var afterPreviousEventsFired = false;
	obj.on("first", function(){
		assert.ok(!afterPreviousEventsFired, "after previous should fire after");
	});

	canBatch.start();
	obj.dispatch("first");
	canBatch.afterPreviousEvents(function(){
		afterPreviousEventsFired = true;
	});
	canBatch.stop();
});


QUnit.test("flushing works (#18)", function(assert) {
	var firstFired, secondFired, thirdFired;
	var obj = assign({}, canEvent);

	obj.on("first", function(){
		canBatch.flush();
		assert.ok(firstFired, "first fired");
		assert.ok(secondFired, "second fired");
		assert.ok(thirdFired, "third fired");
	});
	obj.on("first", function(){
		firstFired = true;
	});
	obj.on("second", function(){
		secondFired = true;
	});
	obj.on("third", function(){
		thirdFired = true;
	});
	canBatch.start();
	obj.dispatch("first");
	obj.dispatch("second");
	obj.dispatch("third");
	canBatch.stop();

});


QUnit.test("flush is non enumerable (#18)", 1, function(assert) {
	assert.equal( canEvent.flush, canBatch.flush );
	for(var prop in canEvent) {
		if(prop === "flush") {
			assert.ok(false, "flush is enumerable");
		}
	}
});

// The problem with the way atm is doing it ...
// the batch is ended ... but it doesn't pick up the next item in the queue and process it.
QUnit.test("flushing a future batch (#18)", function(assert) {
	var firstFired, secondFired, thirdFired;
	var obj = assign({}, canEvent);

	obj.on("first", function(){
		canBatch.start();
		obj.dispatch("second");
		obj.dispatch("third");
		canBatch.stop();

		canBatch.flush();
		assert.ok(firstFired, "first fired");
		assert.ok(secondFired, "second fired");
		assert.ok(thirdFired, "third fired");
	});
	obj.on("first", function(){
		firstFired = true;
	});
	obj.on("second", function(){
		secondFired = true;
	});
	obj.on("third", function(){
		thirdFired = true;
	});
	canBatch.start();
	obj.dispatch("first");
	canBatch.stop();

});

QUnit.test("batchNumber is set by .dispatch that has a batchNum",function(assert) {
	var obj = assign({}, canEvent);
	var firstBN;
	obj.on("first", function(ev){
		firstBN =ev.batchNum;
		canEvent.flush();
		obj.dispatch({type: "second", batchNum: ev.batchNum});


	});
	obj.on("second", function(ev){

		assert.equal(firstBN,ev.batchNum,"batch num set");
		assert.equal(canBatch.batchNum,ev.batchNum,"batch num set");
	});

	canBatch.start();
	obj.dispatch("first");
	canBatch.stop();
});

QUnit.test("debounce - basics (#3)", function(assert) {
	var obj = assign({}, canEvent);
	obj.on("event", canBatch.debounce(function(event, arg1, arg2) {
		assert.ok(true, "event run");
		assert.equal(arg1, 3);
		assert.equal(arg2, 4);
	}));

	assert.expect(3);
	canBatch.start();
	obj.dispatch("event", [ 1, 2 ]);
	obj.dispatch("event", [ 3, 4 ]);
	canBatch.stop();
});

QUnit.test("debounce - is not inherited", function(assert) {
	var obj = assign({}, canEvent);
	assert.ok(!obj.debounce);
});

QUnit.test("debounce - handles multiple batches", function(assert) {
	var obj = assign({}, canEvent);

	var count = 0;
	obj.on("event", canBatch.debounce(function(event, arg1, arg2) {
		assert.ok(true, "event run");

		count++;
		if (count === 1) {
			assert.equal(arg1, 7);
			assert.equal(arg2, 8);
		}
		if (count === 2) {
			assert.equal(arg1, 10);
			assert.equal(arg2, 11);
		}
	}));

	assert.expect(6);
	canBatch.start();
	obj.dispatch("event", [ 5, 6 ]);
	obj.dispatch("event", [ 7, 8 ]);
	canBatch.stop();

	canBatch.start();
	obj.dispatch("event", [ 9, 0 ]);
	obj.dispatch("event", [ 10, 11 ]);
	canBatch.stop();
});

QUnit.test("debounce - only triggers if event was triggered", function(assert) {
	var obj = assign({}, canEvent);
	obj.on("event", canBatch.debounce(function() {
		assert.ok(true, "event run");
	}));

	assert.expect(1);
	canBatch.start();
	obj.dispatch("event");
	obj.dispatch("event");
	canBatch.stop();

	canBatch.start();
	obj.dispatch("foo");
	obj.dispatch("foo");
	canBatch.stop();
});

if (System.env.indexOf('production') < 0) {
	QUnit.test("missing stop should logs a Warning Timeout", function(assert) {
		var oldMissingStopWarningTimeout = canBatch.missingStopWarningTimeout;
		canBatch.missingStopWarningTimeout = 1000;
		var oldWarn = canDev.warn;
		var done = assert.async();
		canDev.warn = function() {
			done();
			assert.ok(true, "received warning");
			canBatch.missingStopWarningTimeout = oldMissingStopWarningTimeout;
			canDev.warn = oldWarn;
			canBatch.stop();
		};
		var obj = assign({}, canEvent);
		canBatch.start();
		obj.dispatch("anEvent");
	});
}
