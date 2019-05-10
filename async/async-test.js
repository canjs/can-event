var canEvent = require('can-event');
var QUnit = require('steal-qunit');
var assign = require('can-util/js/assign/assign');
var eventAsync = require("can-event/async/async");

require('can-util/dom/events/delegate/delegate');

QUnit.module('can-event/async',{
	beforeEach: function(assert) {
		eventAsync.async();
	},
	afterEach: function(assert) {
		eventAsync.sync();
	}
});

QUnit.test('removing an event handler, nothing called', 5, function(assert) {
	var obj = {};

	assign(obj, canEvent);

	var handler = function (ev, arg1, arg2) {
		assert.ok(true, 'foo called');
		assert.equal(ev.type, 'foo');
		assert.equal(arg1, 1, 'one');
		assert.equal(arg2, 2, 'two');
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
		assert.ok(true, "this handler called");
		done();
	});
	obj.dispatch({
		type: 'foo',
		data: [
			1,
			2
		]
	});

});

QUnit.test('removing an event handler, nothing called with on', 6, function(assert) {
	var obj = {};

	assign(obj, canEvent);

	var dispatched = false;
	var handler = function (ev, arg1, arg2) {
		assert.ok(dispatched, "dispatched should be async");
		assert.ok(true, 'foo called');
		assert.equal(ev.type, 'foo');
		assert.equal(arg1, 1, 'one');
		assert.equal(arg2, 2, 'two');
	};

	obj.on('foo', handler);

	obj.dispatch({
		type: 'foo'
	}, [
		1,
		2
	]);
	dispatched = true;

	obj.off('foo', handler);

	obj.on('foo',function(){
		assert.ok(true, "this handler called");
		done();
	});
	obj.dispatch({
		type: 'foo',
		data: [
			1,
			2
		]
	});

});

QUnit.test("async with same batch number is fired right away", function(assert) {
    var ready = assert.async();
    var obj = assign({}, canEvent);
    var secondDispatched = false;
    var secondBatchNum;

    obj.on("first", function(ev){
		obj.dispatch({batchNum: ev.batchNum, type: "second"});
		assert.equal(secondBatchNum, ev.batchNum, "batch nums the same");
		assert.ok(secondDispatched, "dispatched event immediately");
		ready();
	});

    obj.on("second", function(ev){
		secondDispatched = true;
		secondBatchNum = ev.batchNum;
	});
    obj.dispatch("first");
});
