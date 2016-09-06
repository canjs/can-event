var canEvent = require('can-event');
var QUnit = require('steal-qunit');
var assign = require('can-util/js/assign/assign');
var eventAsync = require("can-event/async/async");

require('can-util/dom/events/delegate/delegate');

QUnit.module('can-event/async',{
	setup: function(){
		eventAsync.async();
	},
	teardown: function(){
		eventAsync.sync();
	}
});

QUnit.asyncTest('removing an event handler, nothing called', 5, function () {
	var obj = {};

	assign(obj, canEvent);

	var handler = function (ev, arg1, arg2) {
		ok(true, 'foo called');
		equal(ev.type, 'foo');
		equal(arg1, 1, 'one');
		equal(arg2, 2, 'two');
	};

	obj.addEventListener('foo', handler);

	obj.dispatch({
		type: 'foo'
	}, [
		1,
		2
	]);

	obj.removeEventListener('foo', handler);

	obj.addEventListener('foo',function(){
		QUnit.ok(true, "this handler called");
		QUnit.start();
	});
	obj.dispatch({
		type: 'foo',
		data: [
			1,
			2
		]
	});

});

QUnit.asyncTest('removing an event handler, nothing called with on', 5, function () {
	var obj = {};

	assign(obj, canEvent);

	var handler = function (ev, arg1, arg2) {
		ok(true, 'foo called');
		equal(ev.type, 'foo');
		equal(arg1, 1, 'one');
		equal(arg2, 2, 'two');
	};

	obj.on('foo', handler);

	obj.dispatch({
		type: 'foo'
	}, [
		1,
		2
	]);

	obj.off('foo', handler);

	obj.on('foo',function(){
		QUnit.ok(true, "this handler called");
		QUnit.start();
	});
	obj.dispatch({
		type: 'foo',
		data: [
			1,
			2
		]
	});

});