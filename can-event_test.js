var canEvent = require('can-event');
var QUnit = require('steal-qunit');
var assign = require('can-util/js/assign/');
var canDev = require("can-util/js/dev/dev");
require('can-util/dom/events/delegate/');
require("can-event/batch/batch-test");
require("can-event/async/async-test");
require("can-event/lifecycle/lifecycle-test");

QUnit.module('can-event');

test('basics', 4, function () {
	var obj = {
		addEvent: canEvent.addEvent,
		removeEvent: canEvent.removeEvent,
		dispatch: canEvent.dispatch
	};
	var handler = function (ev, arg1, arg2) {
		ok(true, 'foo called');
		equal(ev.type, 'foo');
		equal(arg1, 1, 'one');
		equal(arg2, 2, 'two');
	};
	obj.addEvent('foo', handler);
	obj.dispatch({
		type: 'foo'
	}, [
		1,
		2
	]);
	obj.removeEvent('foo', handler);
	obj.dispatch({
		type: 'foo',
		data: [
			1,
			2
		]
	});
});
test('listenTo and stopListening', 9, function () {
	var parent = {
		bind: canEvent.bind,
		unbind: canEvent.unbind,
		listenTo: canEvent.listenTo,
		stopListening: canEvent.stopListening
	};
	var child1 = {
		bind: canEvent.bind,
		unbind: canEvent.unbind
	};
	var child2 = {
		bind: canEvent.bind,
		unbind: canEvent.unbind
	};
	var change1WithId = 0;

	parent.listenTo(child1, 'change', function () {
		change1WithId++;
		if (change1WithId === 1) {
			ok(true, 'child 1 handler with id called');
		} else {
			ok(false, 'child 1 handler with id should only be called once');
		}
	});

	child1.bind('change', function () {
		ok(true, 'child 1 handler without id called');
	});
	var foo1WidthId = 0;
	parent.listenTo(child1, 'foo', function () {
		foo1WidthId++;
		if (foo1WidthId === 1) {
			ok(true, 'child 1 foo handler with id called');
		} else {
			ok(false, 'child 1 foo handler should not be called twice');
		}
	});
	// child2 stuff
	(function () {
		var okToCall = true;
		parent.listenTo(child2, 'change', function () {
			ok(okToCall, 'child 2 handler with id called');
			okToCall = false;
		});
	}());
	child2.bind('change', function () {
		ok(true, 'child 2 handler without id called');
	});
	parent.listenTo(child2, 'foo', function () {
		ok(true, 'child 2 foo handler with id called');
	});


	canEvent.trigger.call(child1, 'change');
	canEvent.trigger.call(child1, 'foo');
	canEvent.trigger.call(child2, 'change');
	canEvent.trigger.call(child2, 'foo');
	parent.stopListening(child1);
	parent.stopListening(child2, 'change');
	canEvent.trigger.call(child1, 'change');
	canEvent.trigger.call(child1, 'foo');
	canEvent.trigger.call(child2, 'change');
	canEvent.trigger.call(child2, 'foo');
});
test('stopListening on something you\'ve never listened to ', function () {
	var parent = {
		bind: canEvent.bind,
		unbind: canEvent.unbind,
		listenTo: canEvent.listenTo,
		stopListening: canEvent.stopListening
	};
	var child = {
		bind: canEvent.bind,
		unbind: canEvent.unbind
	};
	parent.listenTo({}, 'foo');
	parent.stopListening(child, 'change');
	ok(true, 'did not error');
});


test('bind on document', function () {
	var called = false,
		handler = function () {
			called = true;
		};
	canEvent.on.call(document, 'click', handler);
	canEvent.trigger.call(document, 'click');
	ok(called, 'got click event');
	ok(true, 'did not error');
	canEvent.off.call(document, 'click', handler);
});
test('delegate on document', function () {
	var called = false,
		handler = function () {
			called = true;
		};
	canEvent.delegate.call(document, 'click', 'body', handler);
	canEvent.trigger.call(document.body, 'click');
	ok(called, 'got click event');
	ok(true, 'did not error');
	canEvent.undelegate.call(document, 'body', 'click', handler);
});


test('One will listen to an event once, then unbind', function() {
	var obj = {},
		count = 0,
		mixin = 0;

	// Direct once call
	canEvent.one.call(obj, 'action', function() {
		count++;
	});
	canEvent.dispatch.call(obj, 'action');
	canEvent.dispatch.call(obj, 'action');
	canEvent.dispatch.call(obj, 'action');
	equal(count, 1, 'one should only fire a handler once (direct)');

	// Mixin call
	assign(obj, canEvent);
	obj.one('mixin', function() {
		mixin++;
	});

	obj.dispatch('mixin');
	obj.dispatch('mixin');
	obj.dispatch('mixin');
	equal(mixin, 1, 'one should only fire a handler once (mixin)');

});

test('Test events using mixin', function() {
	var obj = {}, fn;
	assign(obj, canEvent);

	// Verify bind/unbind/dispatch mixins
	var bindCount = 0;
	obj.bind('action', fn = function() {
		++bindCount;
	});
	obj.dispatch('action');
	obj.dispatch('action');
	obj.unbind('action', fn);
	obj.dispatch('action');
	equal(bindCount, 2, 'action triggered twice');

	// Verify one mixin
	bindCount = 0;
	obj.one('action', fn = function() {
		++bindCount;
	});
	obj.dispatch('action');
	obj.dispatch('action');
	equal(bindCount, 1, 'action triggered only once, then unbound');

	// Verify listenTo/stopListening
	var other = {};
	bindCount = 0;
	assign(other, canEvent);
	obj.listenTo(other, 'action', fn = function() {
		++bindCount;
	});
	other.dispatch('action');
	other.dispatch('action');
	obj.stopListening(other, 'action', fn);
	other.dispatch('action');
	equal(bindCount, 2, 'action triggered twice');
});


QUnit.test("makeHandlerArgs and handlers are non enumerable", 0, function(){
	for(var prop in canEvent) {
		if(prop === "makeHandlerArgs" || prop === "handlers" ) {
			ok(false, prop+ " is enumerable");
		}
	}
});

//!steal-remove-start
QUnit.test("makeHandlerArgs warns on impropper args", function() {
	var obj = {
		addEvent: canEvent.addEvent,
		dispatch: canEvent.dispatch
	};

	obj.addEvent('foo', function(ev, arg1, arg2) {
		ok(true, 'foo called');
		equal(ev.type, 'foo', 'type');
		equal(arg1, 1, 'one');
		equal(arg2, 2, 'two');
	});

	obj.addEvent('bar', function(ev, arg1) {
		ok(true, 'bar called');
		equal(ev.type, 'bar', 'type');
		equal(arg1, 1, 'one');
	});

	var oldWarn = canDev.warn;
	var count = 0;
	var messages = [
		'Arguments to dispatch should be an array, not multiple arguments.',
		'Arguments to dispatch should be an array.'
	];
	canDev.warn = function(message) {
		equal(message, messages[count++], 'warn ' + count);
	};

	expect(16);
	obj.dispatch({ type: 'foo' }, [ 1, 2 ]);
	obj.dispatch({ type: 'foo' }, 1, 2);
	obj.dispatch({ type: 'bar' }, [ 1 ]);
	obj.dispatch({ type: 'bar' }, 1);

	canDev.warn = oldWarn;
});
//!steal-remove-end

QUnit.test("removeEventListener removes all events when no arguments are passed", function() {
	expect(2);
	var obj = {};
	assign(obj, canEvent);

	obj.addEventListener('first', function() { ok(true, 'first event listener called');});
	obj.addEventListener('second', function() { ok(true, 'second event listener called');});
	obj.dispatch({ type: 'first' });
	obj.dispatch({ type: 'second' });

	obj.removeEventListener();
	obj.dispatch({ type: 'first' });
	obj.dispatch({ type: 'second' });

});

QUnit.test("removeEventListener removes all handlers for specified event when no handlers are passed", function() {
	expect(2);
	var obj = {};
	assign(obj, canEvent);

	obj.addEventListener('first', function() { ok(true, 'first handler called');});
	obj.addEventListener('first', function() { ok(true, 'second handler called');});
	obj.dispatch({ type: 'first' });

	obj.removeEventListener('first');
	obj.dispatch({ type: 'first' });

});

QUnit.test("removeEventListener removes a specific handler for an event", function() {
	expect(5);
	var obj = {};
	assign(obj, canEvent);
	var firstHandler = function() { ok(true, 'first handler called');};
	var secondHandler = function() { ok(true, 'second handler called');};
	var thirdHandler = function() { ok(true, 'third handler called');};

	obj.addEventListener('first', firstHandler);
	obj.addEventListener('first', secondHandler);
	obj.addEventListener('first', thirdHandler);
	obj.dispatch({ type: 'first' });

	obj.removeEventListener('first', secondHandler);
	obj.dispatch({ type: 'first' });

});
