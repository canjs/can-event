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
	/**
	 * @function can-event/async/async.dispatch dispatch
	 * @parent can-event/async/async
	 * @description Dispatch events asynchronously.
	 *
	 * @signature `asych.dispatch.call(target, event, [args])`
	 *
	 * Dispatches `event` on `target` in a task queue scheduled to
	 * run [can-util/js/set-immediate/set-immediate immediately] after the current
	 * event loop.
	 *
	 * If [can-event/async/async.async] is called, this will replace
	 * the default [can-event.dispatch].
	 *
	 *
	 * @param {*} target The object to dispatch the event on.
	 * @param {String|Object} event The event to dispatch.
     * @param {Array} [args] Additional arguments to pass to event handlers
     * @return {Object} event The resulting event object
	 */
	dispatch: function(ev){
		// if we're not currently collecting events (and we didn't dispatch something for this batch),
		// then start a batch.
		var batchNum = typeof ev === "object" && ev.batchNum;
		if(!canBatch.collecting() && (!batchNum || canBatch.batchNum !== batchNum) ) {
			canBatch.start();
			timeout = setImmediate(canBatch.stop);
		}
		return syncBatchDispatch.apply(this, arguments);
	},
	/**
	 * @function can-event/async/async.queue queue
	 * @parent can-event/async/async
	 * @description Queues a method to be called asynchronously.
	 *
	 * @signature `async.queue(task)`
	 *
	 * Queues a method to be run scheduled to
	 * [can-util/js/set-immediate/set-immediate immediately] after the current
	 * event loop.
	 *
	 * @param  {Array<function,*,Array>} task An array that details a
	 * function to be called, the context the function should be called with, and
	 * the arguments to the function like: `[function,context, [arg1, arg2]]`
	 */
	queue: function(){
		if(!canBatch.collecting()) {
			canBatch.start();
			timeout = setImmediate(canBatch.stop);
		}
		return syncBatchQueue.apply(this, arguments);
	},
	/**
     * @function can-event/async/async.addEventListener addEventListener
     * @parent can-event/async/async
     *
     * @signature `async.addEventListener.call(target, event, handler)`
     *
     * Add a event listener to an object asynchronously in the next queued
     * batch of tasks to run. This function replaces [can-event.addEventListener]
     * if [can-event/async/async.async] is called.
	 *
	 * ```js
	 * var canEvent = require("can-event");
	 * var canAsync = require("can-event/async/async");
	 * canAsync.async();
	 *
	 * var obj = {};
	 * Object.assign(obj, canEvent);
	 *
	 * obj.addEventListener("foo", function(){
	 *   console.log("heard foo");
	 * });
	 * obj.dispatch("foo");
	 * console.log("dispatched foo");
	 *
	 * // Logs -> "dispatched foo" then "heard foo"
	 * ```
	 *
     * @param {Object} target An object which produces events.
     * @param {String} event The name of the event to listen for.
     * @param {Function} handler The handler that will be executed to handle the event.
     * @return {Object} The target.
     */
	addEventListener: function(){
		asyncMethods.queue([syncAddEventListener, this, arguments]);
		return this;
	},
	/**
     * @function can-event/async/async.removeEventListener removeEventListener
     * @parent can-event/async/async
     * @signature `async.removeEventListener.call(target, event, handler)`
     *
     * Removes an event handler asynchronously.
     *
     * @param {Object} target An object which produces events.
     * @param {String} event The name of the event to listen for.
     * @param {Function} handler The handler that will be executed to handle the event.
     * @return {Object} The target.
     */
	removeEventListener: function(){
		asyncMethods.queue([syncRemoveEventListener, this, arguments]);
		return this;
	}
};

var syncMethods = assign({},canEvent);

var isAsync = false;
var eventAsync = {
	/**
	 * @function can-event/async/async.async async
     * @parent can-event/async/async
     *
	 * @signature `async.async()`
	 *
	 * Makes event dispatching and event binding happen asynchronously.
	 */
	async: function(){
		assign(canEvent, asyncMethods);
		isAsync = true;
	},
	/**
	 * @function can-event/async/async.sync sync
     * @parent can-event/async/async
     *
	 * @signature `async.sync()`
	 *
	 * Makes event dispatching and event binding happen synchronously.
	 */
	sync: function(){
		if( canBatch.collecting() ) {
			clearImmediate(timeout);
			canBatch.stop();
		}
		assign(canEvent, syncMethods);
		isAsync = false;
	},
	/**
	 * @function can-event/async/async.flush flush
     * @parent can-event/async/async
     *
	 * @signature `async.flush()`
	 *
	 * Flushes the task queue immediately so all events or other tasks
	 * will be immediately invoked.
	 */
	flush: function(){
		if(isAsync && canBatch.collecting() ) {
			clearImmediate(timeout);
			canBatch.stop();
		}
	}
};

assign(eventAsync, asyncMethods);

module.exports = eventAsync;
