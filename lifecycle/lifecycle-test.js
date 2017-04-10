var canEvent = require('can-event');
var QUnit = require('steal-qunit');
var lifecycle = require('can-event/lifecycle/lifecycle');

QUnit.module("can-event/lifecycle");

QUnit.test("Mixins your addEventListener", function(){
	var proto = {
		addEventListener: function(){
			QUnit.ok(true, "this was called");
		},
		removeEventListener: function(){}
	};

	var obj = lifecycle(proto);
	obj.addEventListener("Hello world!");
});

QUnit.test("Mixins your removeEventListener", function(){
	var proto = {
		removeEventListener: function(){
			QUnit.ok(true, "this was called");
		},
		addEventListener: canEvent.addEventListener
	};

	var obj = lifecycle(proto);
	obj.addEventListener("some-event");
	obj.removeEventListener("some-event");
});

QUnit.test("Calls _eventSetup on the first addEventListener", function(){
	var proto = {
		_eventSetup: function(){
			QUnit.ok(true, "eventSetup was called");
		},
		addEventListener: function(){},
		removeEventListener: function(){}
	};

	var obj = lifecycle(proto);
	obj.addEventListener("Something");
});

QUnit.test("Calls _eventTeardown on the last removeEventListener", function(){
	var proto = {
		_eventTeardown: function(){
			QUnit.ok(true, "eventTeardown was called");
		},
		addEventListener: canEvent.addEventListener,
		removeEventListener: canEvent.removeEventListener
	};

	var obj = lifecycle(proto);
	var handler = function(){};
	obj.addEventListener("Something", handler);
	obj.removeEventListener("Something", handler);
});


QUnit.test("setup and teardown with default bindings increment", function() {

	var obj = lifecycle({
		addEventListener: function() {},
		removeEventListener: function(event, bindings) {
			this.__bindEvents[event].splice(0, bindings.length);
		}
	});

	obj.__inSetup = true;
	obj.addEventListener();
	QUnit.equal(obj._bindings, undefined, "bindings not incremented during object setup");

	obj.__inSetup = false;
	obj.addEventListener();
	QUnit.equal(obj._bindings, 1, "bindings incremented on addEventListener");

	obj.__bindEvents = {
		foo: [1, 2, 3]
	};
	obj._bindings = 4;
	obj.removeEventListener("foo", [1, 2]);
	QUnit.equal(obj._bindings, 2, "bindings reduced by number of items");

	obj._bindings = 0;
	obj.removeEventListener("foo", [3]);
	QUnit.equal(obj._bindings, 0, "bindings doesn't go below 0");
});


QUnit.test("setup and teardown with configured bindings increment", function() {

	var obj = lifecycle({
		_incrementBindings: function(count) {
			while(count--) {
				this._bindings += 'o';
			}
		},
		_decrementBindings: function(count) {
			while(count--) {
				this._bindings = this._bindings.slice(0, -1);
			}
		},
		addEventListener: function() {},
		removeEventListener: function(event, bindings) {
			this.__bindEvents[event].splice(0, bindings.length);
		}
	});

	obj._bindings = 'f';
	obj.addEventListener();
	obj.addEventListener();
	QUnit.equal(obj._bindings, "foo", "bindings incremented on addEventListener");

	obj.__bindEvents = {
		foo: [1, 2, 3]
	};
	obj.removeEventListener("foo", [1]);
	QUnit.equal(obj._bindings, "fo", "bindings reduced by number of items");

	obj._bindings = "";
	obj.removeEventListener("foo", [3]);
	QUnit.equal(obj._bindings, "", "bindings doesn't go below 0");

});
