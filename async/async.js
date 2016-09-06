var canEvent = require("can-event");
var canBatch = require("can-event/batch/batch");
var setImmediate = require('can-util/js/set-immediate/set-immediate');
var GLOBAL = require("can-util/js/global/global")();
var assign = require("can-util/js/assign/assign");

var timeout;
var clearImmediate = GLOBAL.clearImmediate || GLOBAL.clearTimeout;

var dispatchTriggeredEvent = false;


var syncBatchDispatch = canBatch.dispatch;
var syncBatchQueue = canBatch.queue;
var syncAddEventListener =  canBatch.addEventListener;
var syncRemoveEventListener =  canBatch.removeEventListener;

var asyncMethods = {
	dispatch: function(){
		if(!dispatchTriggeredEvent) {
			canBatch.start();
			timeout = setImmediate(canBatch.stop);
			dispatchTriggeredEvent = true;
		}
		return syncBatchDispatch.apply(this, arguments);
	},
	queue: function(){
		if(!dispatchTriggeredEvent) {
			canBatch.start();
			timeout = setImmediate(canBatch.stop);
			dispatchTriggeredEvent = true;
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

asyncMethods.bind = asyncMethods.addEvent = asyncMethods.on = asyncMethods.addEventListener;
asyncMethods.unbind = asyncMethods.removeEvent = asyncMethods.off = asyncMethods.removeEventListener;

var syncMethods = assign({},canEvent);

var eventAsync = {
	async: function(){
		assign(canEvent, asyncMethods);
	},
	sync: function(){
		assign(canEvent, syncMethods)
	},
	flush: function(){
		if(dispatchTriggeredEvent) {
			clearImmediate(timeout);
			dispatchTriggeredEvent = false;
			canBatch.stop();
		}
	}
};

assign(eventAsync, asyncMethods);

eventAsync.async();

module.exports = eventAsync;
