/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({"can-util/namespace":"can"},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*can-util@3.0.1#js/assign/assign*/
define('can-util/js/assign/assign', function (require, exports, module) {
    module.exports = function (d, s) {
        for (var prop in s) {
            d[prop] = s[prop];
        }
        return d;
    };
});
/*can-util@3.0.1#js/global/global*/
define('can-util/js/global/global', function (require, exports, module) {
    module.exports = function () {
        return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : typeof process === 'object' && {}.toString.call(process) === '[object process]' ? global : window;
    };
});
/*can-util@3.0.1#dom/document/document*/
define('can-util/dom/document/document', function (require, exports, module) {
    var global = require('can-util/js/global/global');
    var setDocument;
    module.exports = function (setDoc) {
        if (setDoc) {
            setDocument = setDoc;
        }
        return setDocument || global().document;
    };
});
/*can-util@3.0.1#dom/events/events*/
define('can-util/dom/events/events', function (require, exports, module) {
    var assign = require('can-util/js/assign/assign');
    var _document = require('can-util/dom/document/document');
    module.exports = {
        addEventListener: function () {
            this.addEventListener.apply(this, arguments);
        },
        removeEventListener: function () {
            this.removeEventListener.apply(this, arguments);
        },
        canAddEventListener: function () {
            return this.nodeName && (this.nodeType === 1 || this.nodeType === 9) || this === window;
        },
        dispatch: function (event, args, bubbles) {
            var doc = _document();
            var ev = doc.createEvent('HTMLEvents');
            var isString = typeof event === 'string';
            ev.initEvent(isString ? event : event.type, bubbles === undefined ? true : bubbles, false);
            if (!isString) {
                assign(ev, event);
            }
            ev.args = args;
            return this.dispatchEvent(ev);
        }
    };
});
/*can-util@3.0.1#js/cid/cid*/
define('can-util/js/cid/cid', function (require, exports, module) {
    var cid = 0;
    module.exports = function (object, name) {
        if (!object._cid) {
            cid++;
            object._cid = (name || '') + cid;
        }
        return object._cid;
    };
});
/*can-util@3.0.1#js/is-empty-object/is-empty-object*/
define('can-util/js/is-empty-object/is-empty-object', function (require, exports, module) {
    module.exports = function (obj) {
        for (var prop in obj) {
            return false;
        }
        return true;
    };
});
/*can-util@3.0.1#dom/dispatch/dispatch*/
define('can-util/dom/dispatch/dispatch', function (require, exports, module) {
    var domEvents = require('can-util/dom/events/events');
    module.exports = function () {
        return domEvents.dispatch.apply(this, arguments);
    };
});
/*can-util@3.0.1#namespace*/
define('can-util/namespace', function (require, exports, module) {
    module.exports = {};
});
/*can-util@3.0.1#dom/data/data*/
define('can-util/dom/data/data', function (require, exports, module) {
    var isEmptyObject = require('can-util/js/is-empty-object/is-empty-object');
    var data = {};
    var expando = 'can' + new Date();
    var uuid = 0;
    var setData = function (name, value) {
        var id = this[expando] || (this[expando] = ++uuid), store = data[id] || (data[id] = {});
        if (name !== undefined) {
            store[name] = value;
        }
        return store;
    };
    module.exports = {
        getCid: function () {
            return this[expando];
        },
        cid: function () {
            return this[expando] || (this[expando] = ++uuid);
        },
        expando: expando,
        clean: function (prop) {
            var id = this[expando];
            if (data[id] && data[id][prop]) {
                delete data[id][prop];
            }
            if (isEmptyObject(data[id])) {
                delete data[id];
            }
        },
        get: function (key) {
            var id = this[expando], store = id && data[id];
            return key === undefined ? store || setData(this) : store && store[key];
        },
        set: setData
    };
});
/*can-util@3.0.1#dom/matches/matches*/
define('can-util/dom/matches/matches', function (require, exports, module) {
    var matchesMethod = function (element) {
        return element.matches || element.webkitMatchesSelector || element.webkitMatchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector;
    };
    module.exports = function () {
        var method = matchesMethod(this);
        return method ? method.apply(this, arguments) : false;
    };
});
/*can-util@3.0.1#js/is-array-like/is-array-like*/
define('can-util/js/is-array-like/is-array-like', function (require, exports, module) {
    function isArrayLike(obj) {
        var type = typeof obj;
        if (type === 'string') {
            return true;
        }
        var length = obj && type !== 'boolean' && typeof obj !== 'number' && 'length' in obj && obj.length;
        return typeof arr !== 'function' && (length === 0 || typeof length === 'number' && length > 0 && length - 1 in obj);
    }
    module.exports = isArrayLike;
});
/*can-util@3.0.1#js/is-promise/is-promise*/
define('can-util/js/is-promise/is-promise', function (require, exports, module) {
    module.exports = function (obj) {
        return obj instanceof Promise || Object.prototype.toString.call(obj) === '[object Promise]';
    };
});
/*can-util@3.0.1#js/types/types*/
define('can-util/js/types/types', function (require, exports, module) {
    var isPromise = require('can-util/js/is-promise/is-promise');
    var types = {
        isMapLike: function () {
            return false;
        },
        isListLike: function () {
            return false;
        },
        isPromise: function (obj) {
            return isPromise(obj);
        },
        isConstructor: function (func) {
            if (typeof func !== 'function') {
                return false;
            }
            for (var prop in func.prototype) {
                return true;
            }
            return false;
        },
        isCallableForValue: function (obj) {
            return typeof obj === 'function' && !types.isConstructor(obj);
        },
        isCompute: function (obj) {
            return obj && obj.isComputed;
        },
        iterator: typeof Symbol === 'function' && Symbol.iterator || '@@iterator',
        DefaultMap: null,
        DefaultList: null,
        queueTask: function (task) {
            var args = task[2] || [];
            task[0].apply(task[1], args);
        },
        wrapElement: function (element) {
            return element;
        },
        unwrapElement: function (element) {
            return element;
        }
    };
    module.exports = types;
});
/*can-util@3.0.1#js/is-iterable/is-iterable*/
define('can-util/js/is-iterable/is-iterable', function (require, exports, module) {
    var types = require('can-util/js/types/types');
    module.exports = function (obj) {
        return obj && !!obj[types.iterator];
    };
});
/*can-util@3.0.1#js/each/each*/
define('can-util/js/each/each', function (require, exports, module) {
    var isArrayLike = require('can-util/js/is-array-like/is-array-like');
    var has = Object.prototype.hasOwnProperty;
    var isIterable = require('can-util/js/is-iterable/is-iterable');
    var types = require('can-util/js/types/types');
    function each(elements, callback, context) {
        var i = 0, key, len, item;
        if (elements) {
            if (isArrayLike(elements)) {
                for (len = elements.length; i < len; i++) {
                    item = elements[i];
                    if (callback.call(context || item, item, i, elements) === false) {
                        break;
                    }
                }
            } else if (isIterable(elements)) {
                var iter = elements[types.iterator]();
                var res, value;
                while (!(res = iter.next()).done) {
                    value = res.value;
                    callback.call(context || elements, Array.isArray(value) ? value[1] : value, value[0]);
                }
            } else if (typeof elements === 'object') {
                for (key in elements) {
                    if (has.call(elements, key) && callback.call(context || elements[key], elements[key], key, elements) === false) {
                        break;
                    }
                }
            }
        }
        return elements;
    }
    module.exports = each;
});
/*can-util@3.0.1#dom/events/delegate/delegate*/
define('can-util/dom/events/delegate/delegate', function (require, exports, module) {
    var domEvents = require('can-util/dom/events/events');
    var domData = require('can-util/dom/data/data');
    var domMatches = require('can-util/dom/matches/matches');
    var each = require('can-util/js/each/each');
    var isEmptyObject = require('can-util/js/is-empty-object/is-empty-object');
    var dataName = 'delegateEvents';
    var useCapture = function (eventType) {
        return eventType === 'focus' || eventType === 'blur';
    };
    var handleEvent = function (ev) {
        var events = domData.get.call(this, dataName);
        var eventTypeEvents = events[ev.type];
        var matches = [];
        if (eventTypeEvents) {
            var selectorDelegates = [];
            each(eventTypeEvents, function (delegates) {
                selectorDelegates.push(delegates);
            });
            var cur = ev.target;
            do {
                selectorDelegates.forEach(function (delegates) {
                    if (domMatches.call(cur, delegates[0].selector)) {
                        matches.push({
                            target: cur,
                            delegates: delegates
                        });
                    }
                });
                cur = cur.parentNode;
            } while (cur && cur !== ev.currentTarget);
        }
        var oldStopProp = ev.stopPropagation;
        ev.stopPropagation = function () {
            oldStopProp.apply(this, arguments);
            this.cancelBubble = true;
        };
        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            var delegates = match.delegates;
            for (var d = 0, dLen = delegates.length; d < dLen; d++) {
                if (delegates[d].handler.call(match.target, ev) === false) {
                    return false;
                }
                if (ev.cancelBubble) {
                    return;
                }
            }
        }
    };
    domEvents.addDelegateListener = function (eventType, selector, handler) {
        var events = domData.get.call(this, dataName), eventTypeEvents;
        if (!events) {
            domData.set.call(this, dataName, events = {});
        }
        if (!(eventTypeEvents = events[eventType])) {
            eventTypeEvents = events[eventType] = {};
            domEvents.addEventListener.call(this, eventType, handleEvent, useCapture(eventType));
        }
        if (!eventTypeEvents[selector]) {
            eventTypeEvents[selector] = [];
        }
        eventTypeEvents[selector].push({
            handler: handler,
            selector: selector
        });
    };
    domEvents.removeDelegateListener = function (eventType, selector, handler) {
        var events = domData.get.call(this, dataName);
        if (events[eventType] && events[eventType][selector]) {
            var eventTypeEvents = events[eventType], delegates = eventTypeEvents[selector], i = 0;
            while (i < delegates.length) {
                if (delegates[i].handler === handler) {
                    delegates.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (delegates.length === 0) {
                delete eventTypeEvents[selector];
                if (isEmptyObject(eventTypeEvents)) {
                    domEvents.removeEventListener.call(this, eventType, handleEvent, useCapture(eventType));
                    delete events[eventType];
                    if (isEmptyObject(events)) {
                        domData.clean.call(this, dataName);
                    }
                }
            }
        }
    };
});
/*can-event@3.0.0#can-event*/
define('can-event', function (require, exports, module) {
    var domEvents = require('can-util/dom/events/events');
    var CID = require('can-util/js/cid/cid');
    var isEmptyObject = require('can-util/js/is-empty-object/is-empty-object');
    var domDispatch = require('can-util/dom/dispatch/dispatch');
    var namespace = require('can-util/namespace');
    require('can-util/dom/events/delegate/delegate');
    function makeHandlerArgs(event, args) {
        if (typeof event === 'string') {
            event = { type: event };
        }
        var handlerArgs = [event];
        if (args) {
            handlerArgs.push.apply(handlerArgs, args);
        }
        return handlerArgs;
    }
    function getHandlers(eventName) {
        var events = this.__bindEvents;
        if (!events) {
            return;
        }
        var handlers = events[eventName];
        if (!handlers) {
            return;
        } else {
            return handlers;
        }
    }
    var canEvent = {
        addEventListener: function (event, handler) {
            var allEvents = this.__bindEvents || (this.__bindEvents = {}), eventList = allEvents[event] || (allEvents[event] = []);
            eventList.push(handler);
            return this;
        },
        removeEventListener: function (event, fn) {
            if (!this.__bindEvents) {
                return this;
            }
            var handlers = this.__bindEvents[event] || [], i = 0, handler, isFunction = typeof fn === 'function';
            while (i < handlers.length) {
                handler = handlers[i];
                if (isFunction && handler === fn || !isFunction && (handler.cid === fn || !fn)) {
                    handlers.splice(i, 1);
                } else {
                    i++;
                }
            }
            return this;
        },
        dispatchSync: function (event, args) {
            var handlerArgs = makeHandlerArgs(event, args);
            var handlers = getHandlers.call(this, handlerArgs[0].type);
            if (!handlers) {
                return;
            }
            handlers = handlers.slice(0);
            for (var i = 0, len = handlers.length; i < len; i++) {
                handlers[i].apply(this, handlerArgs);
            }
            return handlerArgs[0];
        },
        on: function (eventName, selector, handler) {
            var method = typeof selector === 'string' ? 'addDelegateListener' : 'addEventListener';
            var listenWithDOM = domEvents.canAddEventListener.call(this);
            var eventBinder = listenWithDOM ? domEvents[method] : this[method] || canEvent[method];
            return eventBinder.apply(this, arguments);
        },
        off: function (eventName, selector, handler) {
            var method = typeof selector === 'string' ? 'removeDelegateListener' : 'removeEventListener';
            var listenWithDOM = domEvents.canAddEventListener.call(this);
            var eventBinder = listenWithDOM ? domEvents[method] : this[method] || canEvent[method];
            return eventBinder.apply(this, arguments);
        },
        trigger: function () {
            var listenWithDOM = domEvents.canAddEventListener.call(this);
            var dispatch = listenWithDOM ? domDispatch : canEvent.dispatch;
            return dispatch.apply(this, arguments);
        },
        one: function (event, handler) {
            var one = function () {
                canEvent.off.call(this, event, one);
                return handler.apply(this, arguments);
            };
            canEvent.on.call(this, event, one);
            return this;
        },
        listenTo: function (other, event, handler) {
            var idedEvents = this.__listenToEvents;
            if (!idedEvents) {
                idedEvents = this.__listenToEvents = {};
            }
            var otherId = CID(other);
            var othersEvents = idedEvents[otherId];
            if (!othersEvents) {
                othersEvents = idedEvents[otherId] = {
                    obj: other,
                    events: {}
                };
            }
            var eventsEvents = othersEvents.events[event];
            if (!eventsEvents) {
                eventsEvents = othersEvents.events[event] = [];
            }
            eventsEvents.push(handler);
            canEvent.on.call(other, event, handler);
        },
        stopListening: function (other, event, handler) {
            var idedEvents = this.__listenToEvents, iterIdedEvents = idedEvents, i = 0;
            if (!idedEvents) {
                return this;
            }
            if (other) {
                var othercid = CID(other);
                (iterIdedEvents = {})[othercid] = idedEvents[othercid];
                if (!idedEvents[othercid]) {
                    return this;
                }
            }
            for (var cid in iterIdedEvents) {
                var othersEvents = iterIdedEvents[cid], eventsEvents;
                other = idedEvents[cid].obj;
                if (!event) {
                    eventsEvents = othersEvents.events;
                } else {
                    (eventsEvents = {})[event] = othersEvents.events[event];
                }
                for (var eventName in eventsEvents) {
                    var handlers = eventsEvents[eventName] || [];
                    i = 0;
                    while (i < handlers.length) {
                        if (handler && handler === handlers[i] || !handler) {
                            canEvent.off.call(other, eventName, handlers[i]);
                            handlers.splice(i, 1);
                        } else {
                            i++;
                        }
                    }
                    if (!handlers.length) {
                        delete othersEvents.events[eventName];
                    }
                }
                if (isEmptyObject(othersEvents.events)) {
                    delete idedEvents[cid];
                }
            }
            return this;
        }
    };
    canEvent.addEvent = canEvent.bind = function () {
        return canEvent.addEventListener.apply(this, arguments);
    };
    canEvent.unbind = canEvent.removeEvent = function () {
        return canEvent.removeEventListener.apply(this, arguments);
    };
    canEvent.delegate = canEvent.on;
    canEvent.undelegate = canEvent.off;
    canEvent.dispatch = canEvent.dispatchSync;
    Object.defineProperty(canEvent, 'makeHandlerArgs', {
        enumerable: false,
        value: makeHandlerArgs
    });
    Object.defineProperty(canEvent, 'handlers', {
        enumerable: false,
        value: getHandlers
    });
    Object.defineProperty(canEvent, 'flush', {
        enumerable: false,
        writable: true,
        value: function () {
        }
    });
    module.exports = namespace.event = canEvent;
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();