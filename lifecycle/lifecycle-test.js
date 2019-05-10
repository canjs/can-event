var canEvent = require('can-event');
var lifecycle = require('can-event/lifecycle/lifecycle');
var QUnit = require('steal-qunit');

QUnit.module("can-event/lifecycle");

QUnit.test("Mixins your addEventListener", function(assert) {
	var proto = {
		addEventListener: function(){
			assert.ok(true, "this was called");
		},
		removeEventListener: function(){}
	};

	var obj = lifecycle(proto);
	obj.addEventListener("Hello world!");
});

QUnit.test("Mixins your removeEventListener", function(assert) {
	var proto = {
		removeEventListener: function(){
			assert.ok(true, "this was called");
		},
		addEventListener: canEvent.addEventListener
	};

	var obj = lifecycle(proto);
	obj.addEventListener("some-event");
	obj.removeEventListener("some-event");
});

QUnit.test("Calls _eventSetup on the first addEventListener", function(assert) {
	var proto = {
		_eventSetup: function(){
			assert.ok(true, "eventSetup was called");
		},
		addEventListener: function(){},
		removeEventListener: function(){}
	};

	var obj = lifecycle(proto);
	obj.addEventListener("Something");
});

QUnit.test("Calls _eventTeardown on the last removeEventListener", function(assert) {
	var proto = {
		_eventTeardown: function(){
			assert.ok(true, "eventTeardown was called");
		},
		addEventListener: canEvent.addEventListener,
		removeEventListener: canEvent.removeEventListener
	};

	var obj = lifecycle(proto);
	var handler = function(){};
	obj.addEventListener("Something", handler);
	obj.removeEventListener("Something", handler);
});


QUnit.test("removeEventListener removes all events when no arguments are passed", function(assert) {
	assert.expect(2)
	var obj = {
		removeEventListener: canEvent.removeEventListener,
		addEventListener: canEvent.addEventListener,
		_eventTeardown: function() {assert.ok(true, 'eventTeardown called');},
		_eventSetup: function() {assert.ok(true, 'eventSetup called');}
	};

	lifecycle(obj);

	obj.addEventListener('first', function() {return;});
	obj.addEventListener('second', function() {return;});
	obj.removeEventListener();

});
