/*can-event@3.0.0-pre.3#batch/batch*/
define(function (require, exports, module) {
    var canEvent = require('../can-event-all');
    var last = require('can-util/js/last');
    var namespace = require('can-util/namespace');
    var batchNum = 1, transactions = 0, dispatchingBatch = null, collectingBatch = null, batches = [], dispatchingBatches = false;
    var canBatch = {
        start: function (batchStopHandler) {
            transactions++;
            if (transactions === 1) {
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
        stop: function (force, callStart) {
            if (force) {
                transactions = 0;
            } else {
                transactions--;
            }
            if (transactions === 0) {
                collectingBatch = null;
                var batch;
                if (dispatchingBatches === false) {
                    dispatchingBatches = true;
                    while (batch = batches.shift()) {
                        var events = batch.events;
                        var callbacks = batch.callbacks;
                        dispatchingBatch = batch;
                        canBatch.batchNum = batch.number;
                        var i, len;
                        if (callStart) {
                            canBatch.start();
                        }
                        for (i = 0, len = events.length; i < len; i++) {
                            canEvent.dispatch.apply(events[i][0], events[i][1]);
                        }
                        canBatch._onDispatchedEvents(batch.number);
                        for (i = 0; i < callbacks.length; i++) {
                            callbacks[i]();
                        }
                        dispatchingBatch = null;
                        canBatch.batchNum = undefined;
                    }
                    dispatchingBatches = false;
                }
            }
        },
        _onDispatchedEvents: function () {
        },
        trigger: function (event, args) {
            var item = this;
            if (!item.__inSetup) {
                event = typeof event === 'string' ? { type: event } : event;
                if (collectingBatch) {
                    event.batchNum = collectingBatch.number;
                    collectingBatch.events.push([
                        item,
                        [
                            event,
                            args
                        ]
                    ]);
                } else if (event.batchNum) {
                    canEvent.dispatch.call(item, event, args);
                } else if (batches.length) {
                    canBatch.start();
                    event.batchNum = collectingBatch.number;
                    collectingBatch.events.push([
                        item,
                        [
                            event,
                            args
                        ]
                    ]);
                    canBatch.stop();
                } else {
                    canEvent.dispatch.call(item, event, args);
                }
            }
        },
        afterPreviousEvents: function (handler) {
            var batch = last(batches);
            if (batch) {
                var obj = {};
                canEvent.addEvent.call(obj, 'ready', handler);
                batch.events.push([
                    obj,
                    [
                        { type: 'ready' },
                        []
                    ]
                ]);
            } else {
                handler({});
            }
        },
        after: function (handler) {
            var batch = collectingBatch || dispatchingBatch;
            if (batch) {
                batch.callbacks.push(handler);
            } else {
                handler({});
            }
        }
    };
    module.exports = namespace.batch = canBatch;
});