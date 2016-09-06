// # can-event/async
// Makes the event system async.
// Provides methods to toggle the behavior

var canEvent = require("can-event");
var canBatch = require("can-event/batch/batch");
var setImmediate = require('can-util/js/set-immediate/set-immediate');
var GLOBAL = require("can-util/js/global/global")();
var assign = require("can-util/js/assign/assign");

var timeout;
var clearImmediate = GLOBAL.clearImmediate || GLOBAL.clearTimeout;


var syncBatchDispatch = canBatch.dispatch;
var syncBatchQueue = canBatch.queue;
var syncAddEventListener =  canEvent.addEventListener;
var syncRemoveEventListener =  canEvent.removeEventListener;

var asyncMethods = {
	dispatch: function(){
		if(!canBatch.collecting()) {
			canBatch.start();
			timeout = setImmediate(canBatch.stop);
		}
		return syncBatchDispatch.apply(this, arguments);
	},
	queue: function(){
		if(!canBatch.collecting()) {
			canBatch.start();
			timeout = setImmediate(canBatch.stop);
		}
		return syncBatchQueue.apply(this, arguments);
	},
	addEventListener: function(){
		asyncMethods.queue([syncAddEventListener, this, arguments]);
	},
	removeEventListener: function(){
		asyncMethods.queue([syncRemoveEventListener, this, arguments]);
	}
};

var syncMethods = assign({},canEvent);

var eventAsync = {
	async: function(){
		assign(canEvent, asyncMethods);
	},
	sync: function(){
		if( canBatch.collecting() ) {
			clearImmediate(timeout);
			canBatch.stop();
		}
		assign(canEvent, syncMethods);
	},
	flush: function(){
		if( canBatch.collecting() ) {
			clearImmediate(timeout);
			canBatch.stop();
		}
	}
};

assign(eventAsync, asyncMethods);

module.exports = eventAsync;
