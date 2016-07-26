var canEvent = require('can-event');
var last = require('can-util/js/last/');
var namespace = require('can-util/namespace');

// Which batch of events this is for -- might not want to send multiple
// messages on the same batch.  This is mostly for event delegation.
var batchNum = 1,
	// how many times has start been called without a stop
	transactions = 0,
	dispatchingBatch = null,
	collectingBatch = null,
	batches = [],
	dispatchingBatches = false;

var canBatch = {
	/**
	 * @function can-event/batch/batch.start start
	 * @parent can-event/batch/batch
	 * @description Begin an event batch.
	 *
	 * @signature `canBatch.start([batchStopHandler])`
	 *
	 * @param {Function} [batchStopHandler] a callback that gets called after all batched events have been called.
	 *
	 * @body
	 * `canBatch.start` begins an event batch. Until `[can-event/batch/batch.stop]` is called, any
	 * events that would result from calls to [can-event/batch/batch.trigger] to are held back from firing. If you have
	 * lots of changes to make to observables, batching them together can help performance - especially if
	 * those observables are live-bound to the DOM.
	 *
	 * In this example, you can see how the _first_ event is not fired (and their handlers
	 * are not called) until `canBatch.stop` is called.
	 *
	 * ```
	 * var person = new DefineMap({
	 *     first: 'Alexis',
	 *     last: 'Abril'
	 * });
	 *
	 * person.on('first', function() {
	 *     console.log("First name changed.");
	 * }).on('last', function() {
	 *     console.log("Last name changed.");
	 * });
	 *
	 * canBatch.start();
	 * person.first = 'Alex';
	 * console.log('Still in the batch.');
	 * canBatch.stop();
	 *
	 * // the log has:
	 * // Still in the batch.
	 * // First name changed.
	 * ```
	 *
	 * You can also pass a callback to `canBatch.start` which will be called after all the events have
	 * been fired:
	 *
	 * ```
	 * canBatch.start(function() {
	 *     console.log('The batch is over.');
	 * });
	 * person.first = "Izzy"
	 * console.log('Still in the batch.');
	 * canBatch.stop();
	 *
	 * // The console has:
	 * // Still in the batch.
	 * // First name changed.
	 * // The batch is over.
	 * ```
	 *
	 * ## Calling `canBatch.start` multiple times
	 *
	 * If you call `canBatch.start` more than once, `canBatch.stop` needs to be called
	 * the same number of times before any batched events will fire. For ways
	 * to circumvent this process, see [can-event/batch/batch.stop].
	 *
	 * Here is an example that demonstrates how events are affected by calling
	 * `canBatch.start` multiple times.
	 *
	 * ```
	 * var Todo = DefineMap.extend({
	 *   completed: "boolean",
	 *   name: "string"
	 *   updatedAt: "date",
	 *   complete: function(){
	 *     canBatch.start();
	 *     this.completed = true;
	 *     this.updatedAt = new Date();
	 *     canBatch.end();
	 *   }
	 * });
	 *
	 * Todo.List = DefineList.extend({
	 *   "*": Todo,
	 *   completeAll: function(){
	 *     this.forEach(function(todo){
	 *       todo.complete();
	 *     });
	 *   }
	 * });
	 *
	 * var todos = new Todo.List([
	 *   {name: "dishes", completed: false},
	 *   {name: "lawn", completed: false}
	 * ]);
	 *
	 * todos[0].on("completed", function(ev){
	 *   console.log("todos[0] "+ev.batchNum);
	 * })
	 * todos[1].on("completed", function(ev){
	 *   console.log("todos[1] "+ev.batchNum);
	 * });
	 *
	 * todos.completeAll();
	 * // console.logs ->
	 * //        todos[0] 1
	 * //        todos[1] 1
	 * ```
	 */
	start: function (batchStopHandler) {
		transactions++;
		if(transactions === 1) {
			var batch = {
				events: [],
				callbacks: [],
				number: batchNum++
			};
			batches.push(batch);
			if (batchStopHandler) {
				batch.callbacks.push(batchStopHandler);
			}
			collectingBatch = batch;
		}

	},
	/**
	 * @function can-event/batch/batch.stop stop
	 * @parent can-event/batch/batch
	 * @description End an event batch.
	 *
	 * @signature `canBatch.stop([force[, callStart]])`
	 *
	 * If this call to `stop` matches the number of calls to `start`, all of this batch's [can-event/batch/batch.trigger triggered]
	 * events will be dispatched.  If the firing of those events creates new events, those new events will be dispatched
	 * after the current batch in their own batch.
	 *
	 * @param {bool} [force=false] Whether to stop batching events immediately.
	 * @param {bool} [callStart=false] Whether to call [can-event/batch/batch.start] after firing batched events.
	 *
	 * @body
	 *
	 * `canBatch.stop` matches an earlier `[can-event/batch/batch.start]` call. If `canBatch.stop` has been
	 * called as many times as `canBatch.start` (or if _force_ is true), all batched events will be
	 * fired and any callbacks passed to `canBatch.start` since the beginning of the batch will be
	 * called. If _force_ and _callStart_ are both true, a new batch will be started when all
	 * the events and callbacks have been fired.
	 *
	 * See `[can-event/batch/batch.start]` for examples of `canBatch.start` and `canBatch.stop` in normal use.
	 *
	 */
	stop: function (force, callStart) {
		if (force) {
			transactions = 0;
		} else {
			transactions--;
		}
		if (transactions === 0) {
			collectingBatch = null;
			var batch;
			if(dispatchingBatches === false) {
				dispatchingBatches = true;
				while(batch = batches.shift()) {
					var events = batch.events;
					var callbacks = batch.callbacks;
					dispatchingBatch = batch;
					canBatch.batchNum = batch.number;

					var i, len;

					if (callStart) {
						canBatch.start();
					}
					for(i = 0, len = events.length; i < len; i++) {
						canEvent.dispatch.apply(events[i][0],events[i][1]);
					}


					canBatch._onDispatchedEvents(batch.number);

					for(i = 0; i < callbacks.length; i++) {
						callbacks[i]();
					}
					dispatchingBatch = null;
					canBatch.batchNum = undefined;

				}
				dispatchingBatches = false;
			}


		}
	},
	_onDispatchedEvents: function(){},
	/**
	 * @function can-event/batch/batch.trigger trigger
	 * @parent can-event/batch/batch
	 * @description Dispatchs an event within the event batching system.
	 * @signature `canBatch.trigger(item, event [, args])`
	 *
	 * Makes sure an event is fired at the appropriate time within the appropriate batch.
	 * How and when the event fires depends on the batching state.
	 *
	 * There are three states of batching:
	 *
	 * - no batches - `trigger` is called outside of any `start` or `stop` call -> The event is dispatched immediately.
	 * - collecting batch - `trigger` is called between a `start` or `stop` call -> The event is dispatched when `stop` is called.
	 * - firing batches -  `trigger` is called due to another `trigger` called within a batch -> The event is dispatched after the current batch has completed in a new batch.
	 *
	 * Finally, if the event has a `batchNum` it is fired immediately.
	 *
	 * @param {Object} item the target of the event.
	 * @param {String|{type: String}} event the type of event, or an event object with a type given like `{type: 'name'}`
	 * @param {Array} [args] the parameters to trigger the event with.
	 *
	 * @body
	 *
	 */
	trigger: function (event, args) {
		var item = this;
		// Don't send events if initalizing.
		if (!item.__inSetup) {
			event = typeof event === 'string' ? {
				type: event
			} : event;
			// if there's a batch, add it to this batches events
			if(collectingBatch) {
				event.batchNum = collectingBatch.number;
				collectingBatch.events.push([
					item,
					[event, args]
				]);
			}
			// if this is trying to belong to another batch, let it fire
			else if(event.batchNum) {
				canEvent.dispatch.call( item, event, args );
			}
			// if there are batches, but this doesn't belong to a batch
			// add it to its own batch
			else if(batches.length) {
				canBatch.start();
				event.batchNum = collectingBatch.number;
				collectingBatch.events.push([
					item,
					[event, args]
				]);
				canBatch.stop();
			}
			// there are no batches, so just fire the event.
			else {
				canEvent.dispatch.call( item, event, args );
			}

		}
	},
	/**
	 * @function can-event/batch/batch.afterPreviousEvents afterPreviousEvents
	 * @parent can-event/batch/batch
	 * @description Run code when all previuos state has settled.
	 *
	 * @signature `canBatch.afterPreviousEvents(handler)`
	 *
	 * Calls `handler` when all previously [can-event/batch/batch.trigger triggered] events have
	 * been fired.  This is useful to know when all fired events match the current state.
	 *
	 * @param {function} handler A function to call back when all previous events have fired.
	 *
	 * @body
	 *
	 *
	 * ## Use
	 *
	 * With batching, it's possible for a piece of code to read some observable, and listen to
	 * changes in that observable, but have events fired that it should ignore.
	 *
	 * For example, consider a list widget that creates `<li>`'s for each item in the list and listens to
	 * updates in that list and adds or removes `<li>`s:
	 *
	 * ```js
	 * var makeLi = function(){
	 *   return document.createElement("li")
	 * };
	 *
	 * var listWidget = function(list){
	 *   var lis = list.map(makeLi);
	 *   list.on("add", function(ev, added, index){
	 *     var newLis = added.map(makeLi);
	 *     lis.splice.apply(lis, [index, 0].concat(newLis) );
	 *   }).on("remove", function(ev, removed, index){
	 *     lis.splice(index, removed.length);
	 *   });
	 *
	 *   return lis;
	 * }
	 * ```
	 *
	 * The problem with this is if someone calls `listWidget` within a batch:
	 *
	 * ```js
	 * var list = new DefineList([]);
	 *
	 * canBatch.start();
	 * list.push("can-event","can-event/batch/");
	 * listWidget(list);
	 * canBatch.stop();
	 * ```
	 *
	 * The problem is that list will immediately create an `li` for both `can-event` and `can-event/batch/`, and then,
	 * when `canBatch.stop()` is called, the `add` event listener will create duplicate `li`s.
	 *
	 * The solution, is to use `afterPreviousEvents`:
	 *
	 * ```js
	 * var makeLi = function(){
	 *   return document.createElement("li")
	 * };
	 *
	 * var listWidget = function(list){
	 *   var lis = list.map(makeLi);
	 *   canBatch.afterPreviousEvents(function(){
	 *     list.on("add", function(ev, added, index){
	 *       var newLis = added.map(makeLi);
	 *       lis.splice.apply(lis, [index, 0].concat(newLis) );
	 *     }).on("remove", function(ev, removed, index){
	 *       lis.splice(index, removed.length);
	 *     });
	 *   });
	 * 
	 *   return lis;
	 * }
	 * ```
	 *
	 */
	// call handler after any events from currently settled stated have fired
	// but before any future change events fire.
	afterPreviousEvents: function(handler){
		var batch = last(batches);

		if(batch) {
			var obj = {};
			canEvent.addEvent.call(obj,"ready", handler);
			batch.events.push([
				obj,
				[{type: "ready"}, []]
			]);
		} else {
			handler({});
		}
	},
	after: function(handler){
		var batch = collectingBatch || dispatchingBatch;

		if(batch) {
			batch.callbacks.push(handler);
		} else {
			handler({});
		}
	}
};

module.exports = namespace.batch = canBatch;
