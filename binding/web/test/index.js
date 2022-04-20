var LeopardWeb = (function (exports) {
  'use strict';

  function asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator$1(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep$1(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }

  function _defineProperty$1(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function createCommonjsModule$1(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var runtime_1$1 = createCommonjsModule$1(function (module) {
  var runtime = (function (exports) {

    var Op = Object.prototype;
    var hasOwn = Op.hasOwnProperty;
    var undefined$1; // More compressible than void 0.
    var $Symbol = typeof Symbol === "function" ? Symbol : {};
    var iteratorSymbol = $Symbol.iterator || "@@iterator";
    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

    function define(obj, key, value) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
      return obj[key];
    }
    try {
      // IE 8 has a broken Object.defineProperty that only works on DOM objects.
      define({}, "");
    } catch (err) {
      define = function(obj, key, value) {
        return obj[key] = value;
      };
    }

    function wrap(innerFn, outerFn, self, tryLocsList) {
      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
      var generator = Object.create(protoGenerator.prototype);
      var context = new Context(tryLocsList || []);

      // The ._invoke method unifies the implementations of the .next,
      // .throw, and .return methods.
      generator._invoke = makeInvokeMethod(innerFn, self, context);

      return generator;
    }
    exports.wrap = wrap;

    // Try/catch helper to minimize deoptimizations. Returns a completion
    // record like context.tryEntries[i].completion. This interface could
    // have been (and was previously) designed to take a closure to be
    // invoked without arguments, but in all the cases we care about we
    // already have an existing method we want to call, so there's no need
    // to create a new function object. We can even get away with assuming
    // the method takes exactly one argument, since that happens to be true
    // in every case, so we don't have to touch the arguments object. The
    // only additional allocation required is the completion record, which
    // has a stable shape and so hopefully should be cheap to allocate.
    function tryCatch(fn, obj, arg) {
      try {
        return { type: "normal", arg: fn.call(obj, arg) };
      } catch (err) {
        return { type: "throw", arg: err };
      }
    }

    var GenStateSuspendedStart = "suspendedStart";
    var GenStateSuspendedYield = "suspendedYield";
    var GenStateExecuting = "executing";
    var GenStateCompleted = "completed";

    // Returning this object from the innerFn has the same effect as
    // breaking out of the dispatch switch statement.
    var ContinueSentinel = {};

    // Dummy constructor functions that we use as the .constructor and
    // .constructor.prototype properties for functions that return Generator
    // objects. For full spec compliance, you may wish to configure your
    // minifier not to mangle the names of these two functions.
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}

    // This is a polyfill for %IteratorPrototype% for environments that
    // don't natively support it.
    var IteratorPrototype = {};
    define(IteratorPrototype, iteratorSymbol, function () {
      return this;
    });

    var getProto = Object.getPrototypeOf;
    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
    if (NativeIteratorPrototype &&
        NativeIteratorPrototype !== Op &&
        hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
      // This environment has a native %IteratorPrototype%; use it instead
      // of the polyfill.
      IteratorPrototype = NativeIteratorPrototype;
    }

    var Gp = GeneratorFunctionPrototype.prototype =
      Generator.prototype = Object.create(IteratorPrototype);
    GeneratorFunction.prototype = GeneratorFunctionPrototype;
    define(Gp, "constructor", GeneratorFunctionPrototype);
    define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
    GeneratorFunction.displayName = define(
      GeneratorFunctionPrototype,
      toStringTagSymbol,
      "GeneratorFunction"
    );

    // Helper for defining the .next, .throw, and .return methods of the
    // Iterator interface in terms of a single ._invoke method.
    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function(method) {
        define(prototype, method, function(arg) {
          return this._invoke(method, arg);
        });
      });
    }

    exports.isGeneratorFunction = function(genFun) {
      var ctor = typeof genFun === "function" && genFun.constructor;
      return ctor
        ? ctor === GeneratorFunction ||
          // For the native GeneratorFunction constructor, the best we can
          // do is to check its .name property.
          (ctor.displayName || ctor.name) === "GeneratorFunction"
        : false;
    };

    exports.mark = function(genFun) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
      } else {
        genFun.__proto__ = GeneratorFunctionPrototype;
        define(genFun, toStringTagSymbol, "GeneratorFunction");
      }
      genFun.prototype = Object.create(Gp);
      return genFun;
    };

    // Within the body of any async function, `await x` is transformed to
    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
    // `hasOwn.call(value, "__await")` to determine if the yielded value is
    // meant to be awaited.
    exports.awrap = function(arg) {
      return { __await: arg };
    };

    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);
        if (record.type === "throw") {
          reject(record.arg);
        } else {
          var result = record.arg;
          var value = result.value;
          if (value &&
              typeof value === "object" &&
              hasOwn.call(value, "__await")) {
            return PromiseImpl.resolve(value.__await).then(function(value) {
              invoke("next", value, resolve, reject);
            }, function(err) {
              invoke("throw", err, resolve, reject);
            });
          }

          return PromiseImpl.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration.
            result.value = unwrapped;
            resolve(result);
          }, function(error) {
            // If a rejected Promise was yielded, throw the rejection back
            // into the async generator function so it can be handled there.
            return invoke("throw", error, resolve, reject);
          });
        }
      }

      var previousPromise;

      function enqueue(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function(resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }

        return previousPromise =
          // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(
            callInvokeWithMethodAndArg,
            // Avoid propagating failures to Promises returned by later
            // invocations of the iterator.
            callInvokeWithMethodAndArg
          ) : callInvokeWithMethodAndArg();
      }

      // Define the unified helper method that is used to implement .next,
      // .throw, and .return (see defineIteratorMethods).
      this._invoke = enqueue;
    }

    defineIteratorMethods(AsyncIterator.prototype);
    define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
      return this;
    });
    exports.AsyncIterator = AsyncIterator;

    // Note that simple async functions are implemented on top of
    // AsyncIterator objects; they just return a Promise for the value of
    // the final result produced by the iterator.
    exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      if (PromiseImpl === void 0) PromiseImpl = Promise;

      var iter = new AsyncIterator(
        wrap(innerFn, outerFn, self, tryLocsList),
        PromiseImpl
      );

      return exports.isGeneratorFunction(outerFn)
        ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function(result) {
            return result.done ? result.value : iter.next();
          });
    };

    function makeInvokeMethod(innerFn, self, context) {
      var state = GenStateSuspendedStart;

      return function invoke(method, arg) {
        if (state === GenStateExecuting) {
          throw new Error("Generator is already running");
        }

        if (state === GenStateCompleted) {
          if (method === "throw") {
            throw arg;
          }

          // Be forgiving, per 25.3.3.3.3 of the spec:
          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
          return doneResult();
        }

        context.method = method;
        context.arg = arg;

        while (true) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }

          if (context.method === "next") {
            // Setting context._sent for legacy support of Babel's
            // function.sent implementation.
            context.sent = context._sent = context.arg;

          } else if (context.method === "throw") {
            if (state === GenStateSuspendedStart) {
              state = GenStateCompleted;
              throw context.arg;
            }

            context.dispatchException(context.arg);

          } else if (context.method === "return") {
            context.abrupt("return", context.arg);
          }

          state = GenStateExecuting;

          var record = tryCatch(innerFn, self, context);
          if (record.type === "normal") {
            // If an exception is thrown from innerFn, we leave state ===
            // GenStateExecuting and loop back for another invocation.
            state = context.done
              ? GenStateCompleted
              : GenStateSuspendedYield;

            if (record.arg === ContinueSentinel) {
              continue;
            }

            return {
              value: record.arg,
              done: context.done
            };

          } else if (record.type === "throw") {
            state = GenStateCompleted;
            // Dispatch the exception by looping back around to the
            // context.dispatchException(context.arg) call above.
            context.method = "throw";
            context.arg = record.arg;
          }
        }
      };
    }

    // Call delegate.iterator[context.method](context.arg) and handle the
    // result, either by returning a { value, done } result from the
    // delegate iterator, or by modifying context.method and context.arg,
    // setting context.delegate to null, and returning the ContinueSentinel.
    function maybeInvokeDelegate(delegate, context) {
      var method = delegate.iterator[context.method];
      if (method === undefined$1) {
        // A .throw or .return when the delegate iterator has no .throw
        // method always terminates the yield* loop.
        context.delegate = null;

        if (context.method === "throw") {
          // Note: ["return"] must be used for ES3 parsing compatibility.
          if (delegate.iterator["return"]) {
            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            context.method = "return";
            context.arg = undefined$1;
            maybeInvokeDelegate(delegate, context);

            if (context.method === "throw") {
              // If maybeInvokeDelegate(context) changed context.method from
              // "return" to "throw", let that override the TypeError below.
              return ContinueSentinel;
            }
          }

          context.method = "throw";
          context.arg = new TypeError(
            "The iterator does not provide a 'throw' method");
        }

        return ContinueSentinel;
      }

      var record = tryCatch(method, delegate.iterator, context.arg);

      if (record.type === "throw") {
        context.method = "throw";
        context.arg = record.arg;
        context.delegate = null;
        return ContinueSentinel;
      }

      var info = record.arg;

      if (! info) {
        context.method = "throw";
        context.arg = new TypeError("iterator result is not an object");
        context.delegate = null;
        return ContinueSentinel;
      }

      if (info.done) {
        // Assign the result of the finished delegate to the temporary
        // variable specified by delegate.resultName (see delegateYield).
        context[delegate.resultName] = info.value;

        // Resume execution at the desired location (see delegateYield).
        context.next = delegate.nextLoc;

        // If context.method was "throw" but the delegate handled the
        // exception, let the outer generator proceed normally. If
        // context.method was "next", forget context.arg since it has been
        // "consumed" by the delegate iterator. If context.method was
        // "return", allow the original .return call to continue in the
        // outer generator.
        if (context.method !== "return") {
          context.method = "next";
          context.arg = undefined$1;
        }

      } else {
        // Re-yield the result returned by the delegate method.
        return info;
      }

      // The delegate iterator is finished, so forget it and continue with
      // the outer generator.
      context.delegate = null;
      return ContinueSentinel;
    }

    // Define Generator.prototype.{next,throw,return} in terms of the
    // unified ._invoke helper method.
    defineIteratorMethods(Gp);

    define(Gp, toStringTagSymbol, "Generator");

    // A Generator should always return itself as the iterator object when the
    // @@iterator function is called on it. Some browsers' implementations of the
    // iterator prototype chain incorrectly implement this, causing the Generator
    // object to not be returned from this call. This ensures that doesn't happen.
    // See https://github.com/facebook/regenerator/issues/274 for more details.
    define(Gp, iteratorSymbol, function() {
      return this;
    });

    define(Gp, "toString", function() {
      return "[object Generator]";
    });

    function pushTryEntry(locs) {
      var entry = { tryLoc: locs[0] };

      if (1 in locs) {
        entry.catchLoc = locs[1];
      }

      if (2 in locs) {
        entry.finallyLoc = locs[2];
        entry.afterLoc = locs[3];
      }

      this.tryEntries.push(entry);
    }

    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal";
      delete record.arg;
      entry.completion = record;
    }

    function Context(tryLocsList) {
      // The root entry object (effectively a try statement without a catch
      // or a finally block) gives us a place to store values thrown from
      // locations where there is no enclosing try statement.
      this.tryEntries = [{ tryLoc: "root" }];
      tryLocsList.forEach(pushTryEntry, this);
      this.reset(true);
    }

    exports.keys = function(object) {
      var keys = [];
      for (var key in object) {
        keys.push(key);
      }
      keys.reverse();

      // Rather than returning an object with a next method, we keep
      // things simple and return the next function itself.
      return function next() {
        while (keys.length) {
          var key = keys.pop();
          if (key in object) {
            next.value = key;
            next.done = false;
            return next;
          }
        }

        // To avoid creating an additional object, we just hang the .value
        // and .done properties off the next function object itself. This
        // also ensures that the minifier will not anonymize the function.
        next.done = true;
        return next;
      };
    };

    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) {
          return iteratorMethod.call(iterable);
        }

        if (typeof iterable.next === "function") {
          return iterable;
        }

        if (!isNaN(iterable.length)) {
          var i = -1, next = function next() {
            while (++i < iterable.length) {
              if (hasOwn.call(iterable, i)) {
                next.value = iterable[i];
                next.done = false;
                return next;
              }
            }

            next.value = undefined$1;
            next.done = true;

            return next;
          };

          return next.next = next;
        }
      }

      // Return an iterator with no values.
      return { next: doneResult };
    }
    exports.values = values;

    function doneResult() {
      return { value: undefined$1, done: true };
    }

    Context.prototype = {
      constructor: Context,

      reset: function(skipTempReset) {
        this.prev = 0;
        this.next = 0;
        // Resetting context._sent for legacy support of Babel's
        // function.sent implementation.
        this.sent = this._sent = undefined$1;
        this.done = false;
        this.delegate = null;

        this.method = "next";
        this.arg = undefined$1;

        this.tryEntries.forEach(resetTryEntry);

        if (!skipTempReset) {
          for (var name in this) {
            // Not sure about the optimal order of these conditions:
            if (name.charAt(0) === "t" &&
                hasOwn.call(this, name) &&
                !isNaN(+name.slice(1))) {
              this[name] = undefined$1;
            }
          }
        }
      },

      stop: function() {
        this.done = true;

        var rootEntry = this.tryEntries[0];
        var rootRecord = rootEntry.completion;
        if (rootRecord.type === "throw") {
          throw rootRecord.arg;
        }

        return this.rval;
      },

      dispatchException: function(exception) {
        if (this.done) {
          throw exception;
        }

        var context = this;
        function handle(loc, caught) {
          record.type = "throw";
          record.arg = exception;
          context.next = loc;

          if (caught) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            context.method = "next";
            context.arg = undefined$1;
          }

          return !! caught;
        }

        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          var record = entry.completion;

          if (entry.tryLoc === "root") {
            // Exception thrown outside of any try block that could handle
            // it, so set the completion value of the entire function to
            // throw the exception.
            return handle("end");
          }

          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc");
            var hasFinally = hasOwn.call(entry, "finallyLoc");

            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              } else if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              }

            } else if (hasFinally) {
              if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else {
              throw new Error("try statement without catch or finally");
            }
          }
        }
      },

      abrupt: function(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc <= this.prev &&
              hasOwn.call(entry, "finallyLoc") &&
              this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }

        if (finallyEntry &&
            (type === "break" ||
             type === "continue") &&
            finallyEntry.tryLoc <= arg &&
            arg <= finallyEntry.finallyLoc) {
          // Ignore the finally entry if control is not jumping to a
          // location outside the try/catch block.
          finallyEntry = null;
        }

        var record = finallyEntry ? finallyEntry.completion : {};
        record.type = type;
        record.arg = arg;

        if (finallyEntry) {
          this.method = "next";
          this.next = finallyEntry.finallyLoc;
          return ContinueSentinel;
        }

        return this.complete(record);
      },

      complete: function(record, afterLoc) {
        if (record.type === "throw") {
          throw record.arg;
        }

        if (record.type === "break" ||
            record.type === "continue") {
          this.next = record.arg;
        } else if (record.type === "return") {
          this.rval = this.arg = record.arg;
          this.method = "return";
          this.next = "end";
        } else if (record.type === "normal" && afterLoc) {
          this.next = afterLoc;
        }

        return ContinueSentinel;
      },

      finish: function(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc) {
            this.complete(entry.completion, entry.afterLoc);
            resetTryEntry(entry);
            return ContinueSentinel;
          }
        }
      },

      "catch": function(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if (record.type === "throw") {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }

        // The context.catch method must only be called with a location
        // argument that corresponds to a known catch block.
        throw new Error("illegal catch attempt");
      },

      delegateYield: function(iterable, resultName, nextLoc) {
        this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        };

        if (this.method === "next") {
          // Deliberately forget the last sent value so that we don't
          // accidentally pass it on to the delegate.
          this.arg = undefined$1;
        }

        return ContinueSentinel;
      }
    };

    // Regardless of whether this script is executing as a CommonJS module
    // or not, return the runtime object so that we can declare the variable
    // regeneratorRuntime in the outer scope, which allows this module to be
    // injected easily by `bin/regenerator --include-runtime script.js`.
    return exports;

  }(
    // If this script is executing as a CommonJS module, use module.exports
    // as the regeneratorRuntime namespace. Otherwise create a new empty
    // object. Either way, the resulting object will be used to initialize
    // the regeneratorRuntime variable at the top of this file.
    module.exports 
  ));

  try {
    regeneratorRuntime = runtime;
  } catch (accidentalStrictMode) {
    // This module should not be running in strict mode, so the above
    // assignment should always work unless something is misconfigured. Just
    // in case runtime.js accidentally runs in strict mode, in modern engines
    // we can explicitly access globalThis. In older engines we can escape
    // strict mode using a global Function call. This could conceivably fail
    // if a Content Security Policy forbids using Function, but in that case
    // the proper solution is to fix the accidental strict mode problem. If
    // you've misconfigured your bundler to force strict mode and applied a
    // CSP to forbid Function, and you're not willing to fix either of those
    // problems, please detail your unique predicament in a GitHub issue.
    if (typeof globalThis === "object") {
      globalThis.regeneratorRuntime = runtime;
    } else {
      Function("r", "regeneratorRuntime = r")(runtime);
    }
  }
  });

  var regenerator$1 = runtime_1$1;

  const E_CANCELED = new Error('request for lock canceled');

  var __awaiter$2 = function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  };
  class Semaphore {
      constructor(_maxConcurrency, _cancelError = E_CANCELED) {
          this._maxConcurrency = _maxConcurrency;
          this._cancelError = _cancelError;
          this._queue = [];
          this._waiters = [];
          if (_maxConcurrency <= 0) {
              throw new Error('semaphore must be initialized to a positive value');
          }
          this._value = _maxConcurrency;
      }
      acquire() {
          const locked = this.isLocked();
          const ticketPromise = new Promise((resolve, reject) => this._queue.push({ resolve, reject }));
          if (!locked)
              this._dispatch();
          return ticketPromise;
      }
      runExclusive(callback) {
          return __awaiter$2(this, void 0, void 0, function* () {
              const [value, release] = yield this.acquire();
              try {
                  return yield callback(value);
              }
              finally {
                  release();
              }
          });
      }
      waitForUnlock() {
          return __awaiter$2(this, void 0, void 0, function* () {
              if (!this.isLocked()) {
                  return Promise.resolve();
              }
              const waitPromise = new Promise((resolve) => this._waiters.push({ resolve }));
              return waitPromise;
          });
      }
      isLocked() {
          return this._value <= 0;
      }
      /** @deprecated Deprecated in 0.3.0, will be removed in 0.4.0. Use runExclusive instead. */
      release() {
          if (this._maxConcurrency > 1) {
              throw new Error('this method is unavailable on semaphores with concurrency > 1; use the scoped release returned by acquire instead');
          }
          if (this._currentReleaser) {
              const releaser = this._currentReleaser;
              this._currentReleaser = undefined;
              releaser();
          }
      }
      cancel() {
          this._queue.forEach((ticket) => ticket.reject(this._cancelError));
          this._queue = [];
      }
      _dispatch() {
          const nextTicket = this._queue.shift();
          if (!nextTicket)
              return;
          let released = false;
          this._currentReleaser = () => {
              if (released)
                  return;
              released = true;
              this._value++;
              this._resolveWaiters();
              this._dispatch();
          };
          nextTicket.resolve([this._value--, this._currentReleaser]);
      }
      _resolveWaiters() {
          this._waiters.forEach((waiter) => waiter.resolve());
          this._waiters = [];
      }
  }

  var __awaiter$1 = function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
  };
  class Mutex {
      constructor(cancelError) {
          this._semaphore = new Semaphore(1, cancelError);
      }
      acquire() {
          return __awaiter$1(this, void 0, void 0, function* () {
              const [, releaser] = yield this._semaphore.acquire();
              return releaser;
          });
      }
      runExclusive(callback) {
          return this._semaphore.runExclusive(() => callback());
      }
      isLocked() {
          return this._semaphore.isLocked();
      }
      waitForUnlock() {
          return this._semaphore.waitForUnlock();
      }
      /** @deprecated Deprecated in 0.3.0, will be removed in 0.4.0. Use runExclusive instead. */
      release() {
          this._semaphore.release();
      }
      cancel() {
          return this._semaphore.cancel();
      }
  }

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var runtime_1 = createCommonjsModule(function (module) {
  var runtime = (function (exports) {

    var Op = Object.prototype;
    var hasOwn = Op.hasOwnProperty;
    var undefined$1; // More compressible than void 0.
    var $Symbol = typeof Symbol === "function" ? Symbol : {};
    var iteratorSymbol = $Symbol.iterator || "@@iterator";
    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

    function define(obj, key, value) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
      return obj[key];
    }
    try {
      // IE 8 has a broken Object.defineProperty that only works on DOM objects.
      define({}, "");
    } catch (err) {
      define = function(obj, key, value) {
        return obj[key] = value;
      };
    }

    function wrap(innerFn, outerFn, self, tryLocsList) {
      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
      var generator = Object.create(protoGenerator.prototype);
      var context = new Context(tryLocsList || []);

      // The ._invoke method unifies the implementations of the .next,
      // .throw, and .return methods.
      generator._invoke = makeInvokeMethod(innerFn, self, context);

      return generator;
    }
    exports.wrap = wrap;

    // Try/catch helper to minimize deoptimizations. Returns a completion
    // record like context.tryEntries[i].completion. This interface could
    // have been (and was previously) designed to take a closure to be
    // invoked without arguments, but in all the cases we care about we
    // already have an existing method we want to call, so there's no need
    // to create a new function object. We can even get away with assuming
    // the method takes exactly one argument, since that happens to be true
    // in every case, so we don't have to touch the arguments object. The
    // only additional allocation required is the completion record, which
    // has a stable shape and so hopefully should be cheap to allocate.
    function tryCatch(fn, obj, arg) {
      try {
        return { type: "normal", arg: fn.call(obj, arg) };
      } catch (err) {
        return { type: "throw", arg: err };
      }
    }

    var GenStateSuspendedStart = "suspendedStart";
    var GenStateSuspendedYield = "suspendedYield";
    var GenStateExecuting = "executing";
    var GenStateCompleted = "completed";

    // Returning this object from the innerFn has the same effect as
    // breaking out of the dispatch switch statement.
    var ContinueSentinel = {};

    // Dummy constructor functions that we use as the .constructor and
    // .constructor.prototype properties for functions that return Generator
    // objects. For full spec compliance, you may wish to configure your
    // minifier not to mangle the names of these two functions.
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}

    // This is a polyfill for %IteratorPrototype% for environments that
    // don't natively support it.
    var IteratorPrototype = {};
    define(IteratorPrototype, iteratorSymbol, function () {
      return this;
    });

    var getProto = Object.getPrototypeOf;
    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
    if (NativeIteratorPrototype &&
        NativeIteratorPrototype !== Op &&
        hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
      // This environment has a native %IteratorPrototype%; use it instead
      // of the polyfill.
      IteratorPrototype = NativeIteratorPrototype;
    }

    var Gp = GeneratorFunctionPrototype.prototype =
      Generator.prototype = Object.create(IteratorPrototype);
    GeneratorFunction.prototype = GeneratorFunctionPrototype;
    define(Gp, "constructor", GeneratorFunctionPrototype);
    define(GeneratorFunctionPrototype, "constructor", GeneratorFunction);
    GeneratorFunction.displayName = define(
      GeneratorFunctionPrototype,
      toStringTagSymbol,
      "GeneratorFunction"
    );

    // Helper for defining the .next, .throw, and .return methods of the
    // Iterator interface in terms of a single ._invoke method.
    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function(method) {
        define(prototype, method, function(arg) {
          return this._invoke(method, arg);
        });
      });
    }

    exports.isGeneratorFunction = function(genFun) {
      var ctor = typeof genFun === "function" && genFun.constructor;
      return ctor
        ? ctor === GeneratorFunction ||
          // For the native GeneratorFunction constructor, the best we can
          // do is to check its .name property.
          (ctor.displayName || ctor.name) === "GeneratorFunction"
        : false;
    };

    exports.mark = function(genFun) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
      } else {
        genFun.__proto__ = GeneratorFunctionPrototype;
        define(genFun, toStringTagSymbol, "GeneratorFunction");
      }
      genFun.prototype = Object.create(Gp);
      return genFun;
    };

    // Within the body of any async function, `await x` is transformed to
    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
    // `hasOwn.call(value, "__await")` to determine if the yielded value is
    // meant to be awaited.
    exports.awrap = function(arg) {
      return { __await: arg };
    };

    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);
        if (record.type === "throw") {
          reject(record.arg);
        } else {
          var result = record.arg;
          var value = result.value;
          if (value &&
              typeof value === "object" &&
              hasOwn.call(value, "__await")) {
            return PromiseImpl.resolve(value.__await).then(function(value) {
              invoke("next", value, resolve, reject);
            }, function(err) {
              invoke("throw", err, resolve, reject);
            });
          }

          return PromiseImpl.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration.
            result.value = unwrapped;
            resolve(result);
          }, function(error) {
            // If a rejected Promise was yielded, throw the rejection back
            // into the async generator function so it can be handled there.
            return invoke("throw", error, resolve, reject);
          });
        }
      }

      var previousPromise;

      function enqueue(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function(resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }

        return previousPromise =
          // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(
            callInvokeWithMethodAndArg,
            // Avoid propagating failures to Promises returned by later
            // invocations of the iterator.
            callInvokeWithMethodAndArg
          ) : callInvokeWithMethodAndArg();
      }

      // Define the unified helper method that is used to implement .next,
      // .throw, and .return (see defineIteratorMethods).
      this._invoke = enqueue;
    }

    defineIteratorMethods(AsyncIterator.prototype);
    define(AsyncIterator.prototype, asyncIteratorSymbol, function () {
      return this;
    });
    exports.AsyncIterator = AsyncIterator;

    // Note that simple async functions are implemented on top of
    // AsyncIterator objects; they just return a Promise for the value of
    // the final result produced by the iterator.
    exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      if (PromiseImpl === void 0) PromiseImpl = Promise;

      var iter = new AsyncIterator(
        wrap(innerFn, outerFn, self, tryLocsList),
        PromiseImpl
      );

      return exports.isGeneratorFunction(outerFn)
        ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function(result) {
            return result.done ? result.value : iter.next();
          });
    };

    function makeInvokeMethod(innerFn, self, context) {
      var state = GenStateSuspendedStart;

      return function invoke(method, arg) {
        if (state === GenStateExecuting) {
          throw new Error("Generator is already running");
        }

        if (state === GenStateCompleted) {
          if (method === "throw") {
            throw arg;
          }

          // Be forgiving, per 25.3.3.3.3 of the spec:
          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
          return doneResult();
        }

        context.method = method;
        context.arg = arg;

        while (true) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }

          if (context.method === "next") {
            // Setting context._sent for legacy support of Babel's
            // function.sent implementation.
            context.sent = context._sent = context.arg;

          } else if (context.method === "throw") {
            if (state === GenStateSuspendedStart) {
              state = GenStateCompleted;
              throw context.arg;
            }

            context.dispatchException(context.arg);

          } else if (context.method === "return") {
            context.abrupt("return", context.arg);
          }

          state = GenStateExecuting;

          var record = tryCatch(innerFn, self, context);
          if (record.type === "normal") {
            // If an exception is thrown from innerFn, we leave state ===
            // GenStateExecuting and loop back for another invocation.
            state = context.done
              ? GenStateCompleted
              : GenStateSuspendedYield;

            if (record.arg === ContinueSentinel) {
              continue;
            }

            return {
              value: record.arg,
              done: context.done
            };

          } else if (record.type === "throw") {
            state = GenStateCompleted;
            // Dispatch the exception by looping back around to the
            // context.dispatchException(context.arg) call above.
            context.method = "throw";
            context.arg = record.arg;
          }
        }
      };
    }

    // Call delegate.iterator[context.method](context.arg) and handle the
    // result, either by returning a { value, done } result from the
    // delegate iterator, or by modifying context.method and context.arg,
    // setting context.delegate to null, and returning the ContinueSentinel.
    function maybeInvokeDelegate(delegate, context) {
      var method = delegate.iterator[context.method];
      if (method === undefined$1) {
        // A .throw or .return when the delegate iterator has no .throw
        // method always terminates the yield* loop.
        context.delegate = null;

        if (context.method === "throw") {
          // Note: ["return"] must be used for ES3 parsing compatibility.
          if (delegate.iterator["return"]) {
            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            context.method = "return";
            context.arg = undefined$1;
            maybeInvokeDelegate(delegate, context);

            if (context.method === "throw") {
              // If maybeInvokeDelegate(context) changed context.method from
              // "return" to "throw", let that override the TypeError below.
              return ContinueSentinel;
            }
          }

          context.method = "throw";
          context.arg = new TypeError(
            "The iterator does not provide a 'throw' method");
        }

        return ContinueSentinel;
      }

      var record = tryCatch(method, delegate.iterator, context.arg);

      if (record.type === "throw") {
        context.method = "throw";
        context.arg = record.arg;
        context.delegate = null;
        return ContinueSentinel;
      }

      var info = record.arg;

      if (! info) {
        context.method = "throw";
        context.arg = new TypeError("iterator result is not an object");
        context.delegate = null;
        return ContinueSentinel;
      }

      if (info.done) {
        // Assign the result of the finished delegate to the temporary
        // variable specified by delegate.resultName (see delegateYield).
        context[delegate.resultName] = info.value;

        // Resume execution at the desired location (see delegateYield).
        context.next = delegate.nextLoc;

        // If context.method was "throw" but the delegate handled the
        // exception, let the outer generator proceed normally. If
        // context.method was "next", forget context.arg since it has been
        // "consumed" by the delegate iterator. If context.method was
        // "return", allow the original .return call to continue in the
        // outer generator.
        if (context.method !== "return") {
          context.method = "next";
          context.arg = undefined$1;
        }

      } else {
        // Re-yield the result returned by the delegate method.
        return info;
      }

      // The delegate iterator is finished, so forget it and continue with
      // the outer generator.
      context.delegate = null;
      return ContinueSentinel;
    }

    // Define Generator.prototype.{next,throw,return} in terms of the
    // unified ._invoke helper method.
    defineIteratorMethods(Gp);

    define(Gp, toStringTagSymbol, "Generator");

    // A Generator should always return itself as the iterator object when the
    // @@iterator function is called on it. Some browsers' implementations of the
    // iterator prototype chain incorrectly implement this, causing the Generator
    // object to not be returned from this call. This ensures that doesn't happen.
    // See https://github.com/facebook/regenerator/issues/274 for more details.
    define(Gp, iteratorSymbol, function() {
      return this;
    });

    define(Gp, "toString", function() {
      return "[object Generator]";
    });

    function pushTryEntry(locs) {
      var entry = { tryLoc: locs[0] };

      if (1 in locs) {
        entry.catchLoc = locs[1];
      }

      if (2 in locs) {
        entry.finallyLoc = locs[2];
        entry.afterLoc = locs[3];
      }

      this.tryEntries.push(entry);
    }

    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal";
      delete record.arg;
      entry.completion = record;
    }

    function Context(tryLocsList) {
      // The root entry object (effectively a try statement without a catch
      // or a finally block) gives us a place to store values thrown from
      // locations where there is no enclosing try statement.
      this.tryEntries = [{ tryLoc: "root" }];
      tryLocsList.forEach(pushTryEntry, this);
      this.reset(true);
    }

    exports.keys = function(object) {
      var keys = [];
      for (var key in object) {
        keys.push(key);
      }
      keys.reverse();

      // Rather than returning an object with a next method, we keep
      // things simple and return the next function itself.
      return function next() {
        while (keys.length) {
          var key = keys.pop();
          if (key in object) {
            next.value = key;
            next.done = false;
            return next;
          }
        }

        // To avoid creating an additional object, we just hang the .value
        // and .done properties off the next function object itself. This
        // also ensures that the minifier will not anonymize the function.
        next.done = true;
        return next;
      };
    };

    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) {
          return iteratorMethod.call(iterable);
        }

        if (typeof iterable.next === "function") {
          return iterable;
        }

        if (!isNaN(iterable.length)) {
          var i = -1, next = function next() {
            while (++i < iterable.length) {
              if (hasOwn.call(iterable, i)) {
                next.value = iterable[i];
                next.done = false;
                return next;
              }
            }

            next.value = undefined$1;
            next.done = true;

            return next;
          };

          return next.next = next;
        }
      }

      // Return an iterator with no values.
      return { next: doneResult };
    }
    exports.values = values;

    function doneResult() {
      return { value: undefined$1, done: true };
    }

    Context.prototype = {
      constructor: Context,

      reset: function(skipTempReset) {
        this.prev = 0;
        this.next = 0;
        // Resetting context._sent for legacy support of Babel's
        // function.sent implementation.
        this.sent = this._sent = undefined$1;
        this.done = false;
        this.delegate = null;

        this.method = "next";
        this.arg = undefined$1;

        this.tryEntries.forEach(resetTryEntry);

        if (!skipTempReset) {
          for (var name in this) {
            // Not sure about the optimal order of these conditions:
            if (name.charAt(0) === "t" &&
                hasOwn.call(this, name) &&
                !isNaN(+name.slice(1))) {
              this[name] = undefined$1;
            }
          }
        }
      },

      stop: function() {
        this.done = true;

        var rootEntry = this.tryEntries[0];
        var rootRecord = rootEntry.completion;
        if (rootRecord.type === "throw") {
          throw rootRecord.arg;
        }

        return this.rval;
      },

      dispatchException: function(exception) {
        if (this.done) {
          throw exception;
        }

        var context = this;
        function handle(loc, caught) {
          record.type = "throw";
          record.arg = exception;
          context.next = loc;

          if (caught) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            context.method = "next";
            context.arg = undefined$1;
          }

          return !! caught;
        }

        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          var record = entry.completion;

          if (entry.tryLoc === "root") {
            // Exception thrown outside of any try block that could handle
            // it, so set the completion value of the entire function to
            // throw the exception.
            return handle("end");
          }

          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc");
            var hasFinally = hasOwn.call(entry, "finallyLoc");

            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              } else if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              }

            } else if (hasFinally) {
              if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else {
              throw new Error("try statement without catch or finally");
            }
          }
        }
      },

      abrupt: function(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc <= this.prev &&
              hasOwn.call(entry, "finallyLoc") &&
              this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }

        if (finallyEntry &&
            (type === "break" ||
             type === "continue") &&
            finallyEntry.tryLoc <= arg &&
            arg <= finallyEntry.finallyLoc) {
          // Ignore the finally entry if control is not jumping to a
          // location outside the try/catch block.
          finallyEntry = null;
        }

        var record = finallyEntry ? finallyEntry.completion : {};
        record.type = type;
        record.arg = arg;

        if (finallyEntry) {
          this.method = "next";
          this.next = finallyEntry.finallyLoc;
          return ContinueSentinel;
        }

        return this.complete(record);
      },

      complete: function(record, afterLoc) {
        if (record.type === "throw") {
          throw record.arg;
        }

        if (record.type === "break" ||
            record.type === "continue") {
          this.next = record.arg;
        } else if (record.type === "return") {
          this.rval = this.arg = record.arg;
          this.method = "return";
          this.next = "end";
        } else if (record.type === "normal" && afterLoc) {
          this.next = afterLoc;
        }

        return ContinueSentinel;
      },

      finish: function(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc) {
            this.complete(entry.completion, entry.afterLoc);
            resetTryEntry(entry);
            return ContinueSentinel;
          }
        }
      },

      "catch": function(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if (record.type === "throw") {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }

        // The context.catch method must only be called with a location
        // argument that corresponds to a known catch block.
        throw new Error("illegal catch attempt");
      },

      delegateYield: function(iterable, resultName, nextLoc) {
        this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        };

        if (this.method === "next") {
          // Deliberately forget the last sent value so that we don't
          // accidentally pass it on to the delegate.
          this.arg = undefined$1;
        }

        return ContinueSentinel;
      }
    };

    // Regardless of whether this script is executing as a CommonJS module
    // or not, return the runtime object so that we can declare the variable
    // regeneratorRuntime in the outer scope, which allows this module to be
    // injected easily by `bin/regenerator --include-runtime script.js`.
    return exports;

  }(
    // If this script is executing as a CommonJS module, use module.exports
    // as the regeneratorRuntime namespace. Otherwise create a new empty
    // object. Either way, the resulting object will be used to initialize
    // the regeneratorRuntime variable at the top of this file.
    module.exports 
  ));

  try {
    regeneratorRuntime = runtime;
  } catch (accidentalStrictMode) {
    // This module should not be running in strict mode, so the above
    // assignment should always work unless something is misconfigured. Just
    // in case runtime.js accidentally runs in strict mode, in modern engines
    // we can explicitly access globalThis. In older engines we can escape
    // strict mode using a global Function call. This could conceivably fail
    // if a Content Security Policy forbids using Function, but in that case
    // the proper solution is to fix the accidental strict mode problem. If
    // you've misconfigured your bundler to force strict mode and applied a
    // CSP to forbid Function, and you're not willing to fix either of those
    // problems, please detail your unique predicament in a GitHub issue.
    if (typeof globalThis === "object") {
      globalThis.regeneratorRuntime = runtime;
    } else {
      Function("r", "regeneratorRuntime = r")(runtime);
    }
  }
  });

  var regenerator = runtime_1;

  const t=new WeakMap;function e(t,e){return new Proxy(t,{get:(t,r)=>e(t[r])})}class r{constructor(){this.value=void 0,this.exports=null;}getState(){return this.exports.asyncify_get_state()}assertNoneState(){let t=this.getState();if(0!==t)throw new Error(`Invalid async state ${t}, expected 0.`)}wrapImportFn(t){return (...e)=>{if(2===this.getState())return this.exports.asyncify_stop_rewind(),this.value;this.assertNoneState();let r=t(...e);if(!(s=r)||"object"!=typeof s&&"function"!=typeof s||"function"!=typeof s.then)return r;var s;this.exports.asyncify_start_unwind(16),this.value=r;}}wrapModuleImports(t){return e(t,t=>"function"==typeof t?this.wrapImportFn(t):t)}wrapImports(t){if(void 0!==t)return e(t,(t=Object.create(null))=>this.wrapModuleImports(t))}wrapExportFn(e){let r=t.get(e);return void 0!==r||(r=async(...t)=>{this.assertNoneState();let r=e(...t);for(;1===this.getState();)this.exports.asyncify_stop_unwind(),this.value=await this.value,this.assertNoneState(),this.exports.asyncify_start_rewind(16),r=e();return this.assertNoneState(),r},t.set(e,r)),r}wrapExports(e){let r=Object.create(null);for(let t in e){let s=e[t];"function"!=typeof s||t.startsWith("asyncify_")||(s=this.wrapExportFn(s)),Object.defineProperty(r,t,{enumerable:!0,value:s});}return t.set(e,r),r}init(t,e){const{exports:r}=t,n=r.memory||e.env&&e.env.memory;new Int32Array(n.buffer,16).set([24,1024]),this.exports=this.wrapExports(r),Object.setPrototypeOf(t,s.prototype);}}class s extends WebAssembly.Instance{constructor(t,e){let s=new r;super(t,s.wrapImports(e)),s.init(this,e);}get exports(){return t.get(super.exports)}}async function n(t,e){let s=new r,n=await WebAssembly.instantiate(t,s.wrapImports(e));return s.init(n instanceof WebAssembly.Instance?n:n.instance,e),n}Object.defineProperty(s.prototype,"exports",{enumerable:!0});

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

  function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

  function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

  function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

  /*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
  */

  /**
   * Indexed DB configurations
   */
  var DB_NAME = 'pv_db';
  var STORE_NAME = 'pv_store';
  var V = 1;
  /**
   * Opens indexedDB connection, handles version changes and gets the db instance.
   *
   * @returns The instance of indexedDB connection.
   */

  function getDB() {
    return new Promise(function (resolve, reject) {
      var request = self.indexedDB.open(DB_NAME, V);

      request.onerror = function () {
        reject(request.error);
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onupgradeneeded = function () {
        request.result.createObjectStore(STORE_NAME);
      };
    });
  }
  /**
   * Gets the storage to use. Either tries to use IndexedDB or localStorage.
   *
   * @returns PvStorage instance to use as storage.
   */


  function getPvStorage() {
    if (self.indexedDB) {
      var requestHelper = function requestHelper(request) {
        return new Promise(function (resolve, reject) {
          request.onerror = function () {
            reject(request.error);
          };

          request.onsuccess = function () {
            resolve(request.result);
          };
        });
      };

      return {
        setItem: function () {
          var _setItem = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(key, value) {
            var db, request;
            return regenerator.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return getDB();

                  case 2:
                    db = _context.sent;
                    request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key);
                    _context.next = 6;
                    return requestHelper(request);

                  case 6:
                    db.close();

                  case 7:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          function setItem(_x, _x2) {
            return _setItem.apply(this, arguments);
          }

          return setItem;
        }(),
        getItem: function () {
          var _getItem = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(key) {
            var db, request, res;
            return regenerator.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.next = 2;
                    return getDB();

                  case 2:
                    db = _context2.sent;
                    request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
                    _context2.next = 6;
                    return requestHelper(request);

                  case 6:
                    res = _context2.sent;
                    db.close();
                    return _context2.abrupt("return", res);

                  case 9:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          function getItem(_x3) {
            return _getItem.apply(this, arguments);
          }

          return getItem;
        }(),
        removeItem: function () {
          var _removeItem = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(key) {
            var db, request;
            return regenerator.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    _context3.next = 2;
                    return getDB();

                  case 2:
                    db = _context3.sent;
                    request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME)["delete"](key);
                    _context3.next = 6;
                    return requestHelper(request);

                  case 6:
                    db.close();

                  case 7:
                  case "end":
                    return _context3.stop();
                }
              }
            }, _callee3);
          }));

          function removeItem(_x4) {
            return _removeItem.apply(this, arguments);
          }

          return removeItem;
        }()
      };
    } else if (self.localStorage) {
      return self.localStorage;
    }

    throw new Error("Cannot get a presistent storage object.");
  }
  /**
   * Convert a null terminated phrase stored inside an array buffer to a string
   *
   * @param arrayBuffer input array buffer
   * @param indexStart the index at which the phrase is stored
   * @return retrieved string
   */

  function arrayBufferToStringAtIndex(arrayBuffer, indexStart) {
    var indexEnd = indexStart;

    while (arrayBuffer[indexEnd] !== 0) {
      indexEnd++;
    }

    var utf8decoder = new TextDecoder('utf-8');
    return utf8decoder.decode(arrayBuffer.subarray(indexStart, indexEnd));
  }
  /**
   * Decode a base64 string and stored it in a Uint8Array array
   *
   * @param base64String input base64 string
   * @return decoded array
   */

  function base64ToUint8Array(base64String) {
    var base64StringDecoded = atob(base64String);
    var binaryArray = new Uint8Array(base64StringDecoded.length);

    for (var i = 0; i < base64StringDecoded.length; i++) {
      binaryArray[i] = base64StringDecoded.charCodeAt(i);
    }

    return binaryArray;
  }
  /**
   * Encode an ArrayBuffer array to base64 string
   *
   * @param arrayBuffer input array
   * @param size size of the phrase to be encoded
   * @param index the index at which the phrase is stored
   * @return base64 string
   */

  function arrayBufferToBase64AtIndex(arrayBuffer, size, index) {
    var binary = '';

    for (var i = 0; i < size; i++) {
      // @ts-ignore
      binary += String.fromCharCode(arrayBuffer[index + i]);
    }

    return btoa(binary);
  }
  /**
   * Convert a string header to JS object
   *
   * @param stringHeader input string in json format
   * @return retrieved object
   */
  // eslint-disable-next-line

  function stringHeaderToObject(stringHeader) {
    var objectHeader = {};

    var _iterator = _createForOfIteratorHelper(stringHeader.split('\r\n')),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var property = _step.value;
        var keyValuePair = property.split(': ');

        if (keyValuePair[0] !== '') {
          // @ts-ignore
          objectHeader[keyValuePair[0]] = keyValuePair[1];
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    return objectHeader;
  }
  /**
   * A wrapper to fetch that also supports timeout
   *
   * @param uri the URL of the resource
   * @param options other options related to fetch
   * @param time timeout value
   * @return received response
   */

  function fetchWithTimeout(_x5) {
    return _fetchWithTimeout.apply(this, arguments);
  }
  /**
   * Checking whether the given AccessKey is valid
   *
   * @return true if the AccessKey is valid, false if not
   */

  function _fetchWithTimeout() {
    _fetchWithTimeout = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(uri) {
      var options,
          time,
          controller,
          config,
          timeout,
          response,
          _args4 = arguments;
      return regenerator.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              options = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : {};
              time = _args4.length > 2 && _args4[2] !== undefined ? _args4[2] : 5000;
              controller = new AbortController();
              config = _objectSpread(_objectSpread({}, options), {}, {
                signal: controller.signal
              });
              timeout = setTimeout(function () {
                controller.abort();
              }, time);
              _context4.next = 7;
              return fetch(uri, config);

            case 7:
              response = _context4.sent;
              clearTimeout(timeout);
              return _context4.abrupt("return", response);

            case 10:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));
    return _fetchWithTimeout.apply(this, arguments);
  }

  function isAccessKeyValid(accessKey) {
    if (typeof accessKey !== 'string' || accessKey === undefined || accessKey === null) {
      return false;
    }

    var accessKeyCleaned = accessKey.trim();

    if (accessKeyCleaned === '') {
      return false;
    }

    try {
      return btoa(atob(accessKeyCleaned)) === accessKeyCleaned;
    } catch (err) {
      return false;
    }
  }

  /*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
  */

  /* eslint camelcase: 0, arrow-body-style: 0, @typescript-eslint/no-unused-vars: 0, @typescript-eslint/explicit-module-boundary-types: 0 */
  var wasiSnapshotPreview1Emulator = {
    args_get: function args_get(input) {
      return 0;
    },
    args_sizes_get: function args_sizes_get(input) {
      return 0;
    },
    environ_get: function environ_get(input) {
      return 0;
    },
    environ_sizes_get: function environ_sizes_get(input) {
      return 0;
    },
    clock_res_get: function clock_res_get(input) {
      return 0;
    },
    clock_time_get: function clock_time_get(input) {
      return 0;
    },
    fd_advise: function fd_advise(input) {
      return 0;
    },
    fd_allocate: function fd_allocate(input) {
      return 0;
    },
    fd_close: function fd_close(input) {
      return 0;
    },
    fd_datasync: function fd_datasync(input) {
      return 0;
    },
    fd_fdstat_get: function fd_fdstat_get(input) {
      return 0;
    },
    fd_fdstat_set_flags: function fd_fdstat_set_flags(input) {
      return 0;
    },
    fd_fdstat_set_rights: function fd_fdstat_set_rights(input) {
      return 0;
    },
    fd_filestat_get: function fd_filestat_get(input) {
      return 0;
    },
    fd_filestat_set_size: function fd_filestat_set_size(input) {
      return 0;
    },
    fd_filestat_set_times: function fd_filestat_set_times(input) {
      return 0;
    },
    fd_pread: function fd_pread(input) {
      return 0;
    },
    fd_prestat_get: function fd_prestat_get(input) {
      return 0;
    },
    fd_prestat_dir_name: function fd_prestat_dir_name(input) {
      return 0;
    },
    fd_pwrite: function fd_pwrite(input) {
      return 0;
    },
    fd_read: function fd_read(input) {
      return 0;
    },
    fd_readdir: function fd_readdir(input) {
      return 0;
    },
    fd_renumber: function fd_renumber(input) {
      return 0;
    },
    fd_seek: function fd_seek(input) {
      return 0;
    },
    fd_sync: function fd_sync(input) {
      return 0;
    },
    fd_tell: function fd_tell(input) {
      return 0;
    },
    fd_write: function fd_write(input) {
      return 0;
    },
    path_create_directory: function path_create_directory(input) {
      return 0;
    },
    path_filestat_get: function path_filestat_get(input) {
      return 0;
    },
    path_filestat_set_times: function path_filestat_set_times(input) {
      return 0;
    },
    path_link: function path_link(input) {
      return 0;
    },
    path_open: function path_open(input) {
      return 0;
    },
    path_readlink: function path_readlink(input) {
      return 0;
    },
    path_remove_directory: function path_remove_directory(input) {
      return 0;
    },
    path_rename: function path_rename(input) {
      return 0;
    },
    path_symlink: function path_symlink(input) {
      return 0;
    },
    path_unlink_file: function path_unlink_file(input) {
      return 0;
    },
    poll_oneoff: function poll_oneoff(input) {
      return 0;
    },
    proc_exit: function proc_exit(input) {
      return 0;
    },
    proc_raise: function proc_raise(input) {
      return 0;
    },
    sched_yield: function sched_yield(input) {
      return 0;
    },
    random_get: function random_get(input) {
      return 0;
    },
    sock_recv: function sock_recv(input) {
      return 0;
    },
    sock_send: function sock_send(input) {
      return 0;
    },
    sock_shutdown: function sock_shutdown(input) {
      return 0;
    }
  };

  /**
   * Imports and Exports functions required for WASM.
   *
   * @param memory Initialized WebAssembly memory object.
   * @param wasm_base64 The wasm file in base64 string to initialize.
   * @returns An object containing the exported functions from WASM.
   */

  function buildWasm(_x, _x2) {
    return _buildWasm.apply(this, arguments);
  }

  function _buildWasm() {
    _buildWasm = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee8(memory, wasm_base64) {
      var memoryBufferUint8, memoryBufferInt32, storage, pvConsoleLogWasm, pvAssertWasm, pvTimeWasm, pvHttpsRequestWasm, pvFileLoadWasm, pvFileSaveWasm, pvFileExistsWasm, pvFileDeleteWasm, pvGetBrowserInfo, pvGetOriginInfo, importObject, wasmCodeArray, _yield$Asyncify$insta, instance, aligned_alloc;

      return regenerator.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              memoryBufferUint8 = new Uint8Array(memory.buffer);
              memoryBufferInt32 = new Int32Array(memory.buffer);
              storage = getPvStorage();

              pvConsoleLogWasm = function pvConsoleLogWasm(index) {
                // eslint-disable-next-line no-console
                console.log(arrayBufferToStringAtIndex(memoryBufferUint8, index));
              };

              pvAssertWasm = function pvAssertWasm(expr, line, fileNameAddress) {
                if (expr === 0) {
                  var fileName = arrayBufferToStringAtIndex(memoryBufferUint8, fileNameAddress);
                  throw new Error("assertion failed at line ".concat(line, " in \"").concat(fileName, "\""));
                }
              };

              pvTimeWasm = function pvTimeWasm() {
                return Date.now() / 1000;
              };

              pvHttpsRequestWasm = /*#__PURE__*/function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(httpMethodAddress, serverNameAddress, endpointAddress, headerAddress, bodyAddress, timeoutMs, responseAddressAddress, responseSizeAddress, responseCodeAddress) {
                  var httpMethod, serverName, endpoint, header, body, headerObject, response, responseText, statusCode, responseAddress, i;
                  return regenerator.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          httpMethod = arrayBufferToStringAtIndex(memoryBufferUint8, httpMethodAddress);
                          serverName = arrayBufferToStringAtIndex(memoryBufferUint8, serverNameAddress);
                          endpoint = arrayBufferToStringAtIndex(memoryBufferUint8, endpointAddress);
                          header = arrayBufferToStringAtIndex(memoryBufferUint8, headerAddress);
                          body = arrayBufferToStringAtIndex(memoryBufferUint8, bodyAddress);
                          headerObject = stringHeaderToObject(header);
                          _context.prev = 6;
                          _context.next = 9;
                          return fetchWithTimeout('https://' + serverName + endpoint, {
                            method: httpMethod,
                            headers: headerObject,
                            body: body
                          }, timeoutMs);

                        case 9:
                          response = _context.sent;
                          statusCode = response.status;
                          _context.next = 16;
                          break;

                        case 13:
                          _context.prev = 13;
                          _context.t0 = _context["catch"](6);
                          statusCode = 0;

                        case 16:
                          if (!(response !== undefined)) {
                            _context.next = 36;
                            break;
                          }

                          _context.prev = 17;
                          _context.next = 20;
                          return response.text();

                        case 20:
                          responseText = _context.sent;
                          _context.next = 27;
                          break;

                        case 23:
                          _context.prev = 23;
                          _context.t1 = _context["catch"](17);
                          responseText = '';
                          statusCode = 1;

                        case 27:
                          _context.next = 29;
                          return aligned_alloc(Int8Array.BYTES_PER_ELEMENT, (responseText.length + 1) * Int8Array.BYTES_PER_ELEMENT);

                        case 29:
                          responseAddress = _context.sent;

                          if (!(responseAddress === 0)) {
                            _context.next = 32;
                            break;
                          }

                          throw new Error('malloc failed: Cannot allocate memory');

                        case 32:
                          memoryBufferInt32[responseSizeAddress / Int32Array.BYTES_PER_ELEMENT] = responseText.length + 1;
                          memoryBufferInt32[responseAddressAddress / Int32Array.BYTES_PER_ELEMENT] = responseAddress;

                          for (i = 0; i < responseText.length; i++) {
                            memoryBufferUint8[responseAddress + i] = responseText.charCodeAt(i);
                          }

                          memoryBufferUint8[responseAddress + responseText.length] = 0;

                        case 36:
                          memoryBufferInt32[responseCodeAddress / Int32Array.BYTES_PER_ELEMENT] = statusCode;

                        case 37:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, null, [[6, 13], [17, 23]]);
                }));

                return function pvHttpsRequestWasm(_x3, _x4, _x5, _x6, _x7, _x8, _x9, _x10, _x11) {
                  return _ref.apply(this, arguments);
                };
              }();

              pvFileLoadWasm = /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee2(pathAddress, numContentBytesAddress, contentAddressAddress, succeededAddress) {
                  var path, contentBase64, contentBuffer, contentAddress;
                  return regenerator.wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          path = arrayBufferToStringAtIndex(memoryBufferUint8, pathAddress);
                          _context2.prev = 1;
                          _context2.next = 4;
                          return storage.getItem(path);

                        case 4:
                          contentBase64 = _context2.sent;
                          contentBuffer = base64ToUint8Array(contentBase64); // eslint-disable-next-line

                          _context2.next = 8;
                          return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, contentBuffer.length * Uint8Array.BYTES_PER_ELEMENT);

                        case 8:
                          contentAddress = _context2.sent;

                          if (!(contentAddress === 0)) {
                            _context2.next = 11;
                            break;
                          }

                          throw new Error('malloc failed: Cannot allocate memory');

                        case 11:
                          memoryBufferInt32[numContentBytesAddress / Int32Array.BYTES_PER_ELEMENT] = contentBuffer.byteLength;
                          memoryBufferInt32[contentAddressAddress / Int32Array.BYTES_PER_ELEMENT] = contentAddress;
                          memoryBufferUint8.set(contentBuffer, contentAddress);
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 1;
                          _context2.next = 20;
                          break;

                        case 17:
                          _context2.prev = 17;
                          _context2.t0 = _context2["catch"](1);
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 0;

                        case 20:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2, null, [[1, 17]]);
                }));

                return function pvFileLoadWasm(_x12, _x13, _x14, _x15) {
                  return _ref2.apply(this, arguments);
                };
              }();

              pvFileSaveWasm = /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee3(pathAddress, numContentBytes, contentAddress, succeededAddress) {
                  var path, content;
                  return regenerator.wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          path = arrayBufferToStringAtIndex(memoryBufferUint8, pathAddress);
                          content = arrayBufferToBase64AtIndex(memoryBufferUint8, numContentBytes, contentAddress);
                          _context3.prev = 2;
                          _context3.next = 5;
                          return storage.setItem(path, content);

                        case 5:
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 1;
                          _context3.next = 11;
                          break;

                        case 8:
                          _context3.prev = 8;
                          _context3.t0 = _context3["catch"](2);
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 0;

                        case 11:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3, null, [[2, 8]]);
                }));

                return function pvFileSaveWasm(_x16, _x17, _x18, _x19) {
                  return _ref3.apply(this, arguments);
                };
              }();

              pvFileExistsWasm = /*#__PURE__*/function () {
                var _ref4 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee4(pathAddress, isExistsAddress, succeededAddress) {
                  var path, isExists;
                  return regenerator.wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          path = arrayBufferToStringAtIndex(memoryBufferUint8, pathAddress);
                          _context4.prev = 1;
                          _context4.next = 4;
                          return storage.getItem(path);

                        case 4:
                          isExists = _context4.sent;
                          memoryBufferUint8[isExistsAddress] = isExists === undefined || isExists === null ? 0 : 1;
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 1;
                          _context4.next = 12;
                          break;

                        case 9:
                          _context4.prev = 9;
                          _context4.t0 = _context4["catch"](1);
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 0;

                        case 12:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4, null, [[1, 9]]);
                }));

                return function pvFileExistsWasm(_x20, _x21, _x22) {
                  return _ref4.apply(this, arguments);
                };
              }();

              pvFileDeleteWasm = /*#__PURE__*/function () {
                var _ref5 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee5(pathAddress, succeededAddress) {
                  var path;
                  return regenerator.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          path = arrayBufferToStringAtIndex(memoryBufferUint8, pathAddress);
                          _context5.prev = 1;
                          _context5.next = 4;
                          return storage.removeItem(path);

                        case 4:
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 1;
                          _context5.next = 10;
                          break;

                        case 7:
                          _context5.prev = 7;
                          _context5.t0 = _context5["catch"](1);
                          memoryBufferInt32[succeededAddress / Int32Array.BYTES_PER_ELEMENT] = 0;

                        case 10:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5, null, [[1, 7]]);
                }));

                return function pvFileDeleteWasm(_x23, _x24) {
                  return _ref5.apply(this, arguments);
                };
              }();

              pvGetBrowserInfo = /*#__PURE__*/function () {
                var _ref6 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee6(browserInfoAddressAddress) {
                  var userAgent, browserInfoAddress, i;
                  return regenerator.wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          userAgent = navigator.userAgent !== undefined ? navigator.userAgent : 'unknown'; // eslint-disable-next-line

                          _context6.next = 3;
                          return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, (userAgent.length + 1) * Uint8Array.BYTES_PER_ELEMENT);

                        case 3:
                          browserInfoAddress = _context6.sent;

                          if (!(browserInfoAddress === 0)) {
                            _context6.next = 6;
                            break;
                          }

                          throw new Error('malloc failed: Cannot allocate memory');

                        case 6:
                          memoryBufferInt32[browserInfoAddressAddress / Int32Array.BYTES_PER_ELEMENT] = browserInfoAddress;

                          for (i = 0; i < userAgent.length; i++) {
                            memoryBufferUint8[browserInfoAddress + i] = userAgent.charCodeAt(i);
                          }

                          memoryBufferUint8[browserInfoAddress + userAgent.length] = 0;

                        case 9:
                        case "end":
                          return _context6.stop();
                      }
                    }
                  }, _callee6);
                }));

                return function pvGetBrowserInfo(_x25) {
                  return _ref6.apply(this, arguments);
                };
              }();

              pvGetOriginInfo = /*#__PURE__*/function () {
                var _ref7 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee7(originInfoAddressAddress) {
                  var _self$origin;

                  var origin, originInfoAddress, i;
                  return regenerator.wrap(function _callee7$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          origin = (_self$origin = self.origin) !== null && _self$origin !== void 0 ? _self$origin : self.location.origin; // eslint-disable-next-line

                          _context7.next = 3;
                          return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, (origin.length + 1) * Uint8Array.BYTES_PER_ELEMENT);

                        case 3:
                          originInfoAddress = _context7.sent;

                          if (!(originInfoAddress === 0)) {
                            _context7.next = 6;
                            break;
                          }

                          throw new Error('malloc failed: Cannot allocate memory');

                        case 6:
                          memoryBufferInt32[originInfoAddressAddress / Int32Array.BYTES_PER_ELEMENT] = originInfoAddress;

                          for (i = 0; i < origin.length; i++) {
                            memoryBufferUint8[originInfoAddress + i] = origin.charCodeAt(i);
                          }

                          memoryBufferUint8[originInfoAddress + origin.length] = 0;

                        case 9:
                        case "end":
                          return _context7.stop();
                      }
                    }
                  }, _callee7);
                }));

                return function pvGetOriginInfo(_x26) {
                  return _ref7.apply(this, arguments);
                };
              }();

              importObject = {
                // eslint-disable-next-line camelcase
                wasi_snapshot_preview1: wasiSnapshotPreview1Emulator,
                env: {
                  memory: memory,
                  // eslint-disable-next-line camelcase
                  pv_console_log_wasm: pvConsoleLogWasm,
                  // eslint-disable-next-line camelcase
                  pv_assert_wasm: pvAssertWasm,
                  // eslint-disable-next-line camelcase
                  pv_time_wasm: pvTimeWasm,
                  // eslint-disable-next-line camelcase
                  pv_https_request_wasm: pvHttpsRequestWasm,
                  // eslint-disable-next-line camelcase
                  pv_file_load_wasm: pvFileLoadWasm,
                  // eslint-disable-next-line camelcase
                  pv_file_save_wasm: pvFileSaveWasm,
                  // eslint-disable-next-line camelcase
                  pv_file_exists_wasm: pvFileExistsWasm,
                  // eslint-disable-next-line camelcase
                  pv_file_delete_wasm: pvFileDeleteWasm,
                  // eslint-disable-next-line camelcase
                  pv_get_browser_info: pvGetBrowserInfo,
                  // eslint-disable-next-line camelcase
                  pv_get_origin_info: pvGetOriginInfo
                }
              };
              wasmCodeArray = base64ToUint8Array(wasm_base64);
              _context8.next = 17;
              return n(wasmCodeArray, importObject);

            case 17:
              _yield$Asyncify$insta = _context8.sent;
              instance = _yield$Asyncify$insta.instance;
              aligned_alloc = instance.exports.aligned_alloc;
              return _context8.abrupt("return", instance.exports);

            case 21:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8);
    }));
    return _buildWasm.apply(this, arguments);
  }

  var PV_STATUS_SUCCESS = 10000;
  var Leopard = /*#__PURE__*/function () {
    function Leopard(handleWasm) {
      _classCallCheck(this, Leopard);

      _defineProperty$1(this, "_pvLeopardDelete", void 0);

      _defineProperty$1(this, "_pvLeopardProcess", void 0);

      _defineProperty$1(this, "_pvStatusToString", void 0);

      _defineProperty$1(this, "_wasmMemory", void 0);

      _defineProperty$1(this, "_memoryBuffer", void 0);

      _defineProperty$1(this, "_memoryBufferUint8", void 0);

      _defineProperty$1(this, "_memoryBufferView", void 0);

      _defineProperty$1(this, "_processMutex", void 0);

      _defineProperty$1(this, "_objectAddress", void 0);

      _defineProperty$1(this, "_alignedAlloc", void 0);

      _defineProperty$1(this, "_transcriptionAddressAddress", void 0);

      Leopard._sampleRate = handleWasm.sampleRate;
      Leopard._version = handleWasm.version;
      this._pvLeopardDelete = handleWasm.pvLeopardDelete;
      this._pvLeopardProcess = handleWasm.pvLeopardProcess;
      this._pvStatusToString = handleWasm.pvStatusToString;
      this._wasmMemory = handleWasm.memory;
      this._objectAddress = handleWasm.objectAddress;
      this._alignedAlloc = handleWasm.aligned_alloc;
      this._transcriptionAddressAddress = handleWasm.transcriptionAddressAddress;
      this._memoryBuffer = new Int16Array(handleWasm.memory.buffer);
      this._memoryBufferUint8 = new Uint8Array(handleWasm.memory.buffer);
      this._memoryBufferView = new DataView(handleWasm.memory.buffer);
      this._processMutex = new Mutex();
    }
    /**
     * Releases resources acquired by WebAssembly module.
     */


    _createClass(Leopard, [{
      key: "release",
      value: function () {
        var _release = _asyncToGenerator$1( /*#__PURE__*/regenerator$1.mark(function _callee() {
          return regenerator$1.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return this._pvLeopardDelete(this._objectAddress);

                case 2:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function release() {
          return _release.apply(this, arguments);
        }

        return release;
      }()
      /**
       * Processes a frame of audio. The required sample rate can be retrieved from '.sampleRate' and the length
       * of frame (number of audio samples per frame) can be retrieved from '.frameLength'. The audio needs to be
       * 16-bit linearly-encoded. Furthermore, the engine operates on single-channel audio.
       *
       * @param pcm - A frame of audio with properties described above.
       * @return Probability of voice activity. It is a floating-point number within [0, 1].
       */

    }, {
      key: "process",
      value: function () {
        var _process = _asyncToGenerator$1( /*#__PURE__*/regenerator$1.mark(function _callee3(pcm) {
          var _this = this;

          var inputBufferAddress, returnPromise;
          return regenerator$1.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  if (pcm instanceof Int16Array) {
                    _context3.next = 2;
                    break;
                  }

                  throw new Error("The argument 'pcm' must be provided as an Int16Array");

                case 2:
                  _context3.next = 4;
                  return this._alignedAlloc(Int16Array.BYTES_PER_ELEMENT, pcm.length * Int16Array.BYTES_PER_ELEMENT);

                case 4:
                  inputBufferAddress = _context3.sent;

                  if (!(inputBufferAddress === 0)) {
                    _context3.next = 7;
                    break;
                  }

                  throw new Error('malloc failed: Cannot allocate memory');

                case 7:
                  returnPromise = new Promise(function (resolve, reject) {
                    _this._processMutex.runExclusive( /*#__PURE__*/_asyncToGenerator$1( /*#__PURE__*/regenerator$1.mark(function _callee2() {
                      var status, memoryBuffer, transcriptionAddress, transcription;
                      return regenerator$1.wrap(function _callee2$(_context2) {
                        while (1) {
                          switch (_context2.prev = _context2.next) {
                            case 0:
                              _this._memoryBuffer.set(pcm, inputBufferAddress / Int16Array.BYTES_PER_ELEMENT);

                              _context2.next = 3;
                              return _this._pvLeopardProcess(_this._objectAddress, inputBufferAddress, pcm.length, _this._transcriptionAddressAddress);

                            case 3:
                              status = _context2.sent;

                              if (!(status !== PV_STATUS_SUCCESS)) {
                                _context2.next = 16;
                                break;
                              }

                              memoryBuffer = new Uint8Array(_this._wasmMemory.buffer);
                              _context2.t0 = Error;
                              _context2.t1 = "process failed with status ";
                              _context2.t2 = arrayBufferToStringAtIndex;
                              _context2.t3 = memoryBuffer;
                              _context2.next = 12;
                              return _this._pvStatusToString(status);

                            case 12:
                              _context2.t4 = _context2.sent;
                              _context2.t5 = (0, _context2.t2)(_context2.t3, _context2.t4);
                              _context2.t6 = _context2.t1.concat.call(_context2.t1, _context2.t5);
                              throw new _context2.t0(_context2.t6);

                            case 16:
                              transcriptionAddress = _this._memoryBufferView.getInt32(_this._transcriptionAddressAddress, true);
                              transcription = arrayBufferToStringAtIndex(_this._memoryBufferUint8, transcriptionAddress);
                              return _context2.abrupt("return", transcription);

                            case 19:
                            case "end":
                              return _context2.stop();
                          }
                        }
                      }, _callee2);
                    }))).then(function (result) {
                      resolve(result);
                    })["catch"](function (error) {
                      reject(error);
                    });
                  });
                  return _context3.abrupt("return", returnPromise);

                case 9:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        function process(_x) {
          return _process.apply(this, arguments);
        }

        return process;
      }()
    }, {
      key: "version",
      get: function get() {
        return Leopard._version;
      }
    }, {
      key: "sampleRate",
      get: function get() {
        return Leopard._sampleRate;
      }
      /**
       * Creates an instance of the the Picovoice Leopard voice activity detection (VAD) engine.
       * Behind the scenes, it requires the WebAssembly code to load and initialize before
       * it can create an instance.
       *
       * @param accessKey - AccessKey
       * generated by Picovoice Console
       *
       * @returns An instance of the Leopard engine.
       */

    }], [{
      key: "create",
      value: function () {
        var _create = _asyncToGenerator$1( /*#__PURE__*/regenerator$1.mark(function _callee5(accessKey, wasmBase64) {
          var returnPromise;
          return regenerator$1.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  if (isAccessKeyValid(accessKey)) {
                    _context5.next = 2;
                    break;
                  }

                  throw new Error('Invalid AccessKey');

                case 2:
                  returnPromise = new Promise(function (resolve, reject) {
                    Leopard._leopardMutex.runExclusive( /*#__PURE__*/_asyncToGenerator$1( /*#__PURE__*/regenerator$1.mark(function _callee4() {
                      var wasmOutput;
                      return regenerator$1.wrap(function _callee4$(_context4) {
                        while (1) {
                          switch (_context4.prev = _context4.next) {
                            case 0:
                              _context4.next = 2;
                              return Leopard.initWasm(accessKey.trim(), wasmBase64);

                            case 2:
                              wasmOutput = _context4.sent;
                              return _context4.abrupt("return", new Leopard(wasmOutput));

                            case 4:
                            case "end":
                              return _context4.stop();
                          }
                        }
                      }, _callee4);
                    }))).then(function (result) {
                      resolve(result);
                    })["catch"](function (error) {
                      reject(error);
                    });
                  });
                  return _context5.abrupt("return", returnPromise);

                case 4:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5);
        }));

        function create(_x2, _x3) {
          return _create.apply(this, arguments);
        }

        return create;
      }()
    }, {
      key: "initWasm",
      value: function () {
        var _initWasm = _asyncToGenerator$1( /*#__PURE__*/regenerator$1.mark(function _callee6(accessKey, wasmBase64) {
          var memory, memoryBufferUint8, exports, aligned_alloc, pv_leopard_version, pv_leopard_process, pv_leopard_delete, pv_leopard_init, pv_status_to_string, pv_sample_rate, transcriptionAddressAddress, objectAddressAddress, accessKeyAddress, i, status, memoryBufferView, objectAddress, sampleRate, versionAddress, version;
          return regenerator$1.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  // A WebAssembly page has a constant size of 64KiB. -> 1MiB ~= 16 pages
                  // minimum memory requirements for init: 3 pages
                  memory = new WebAssembly.Memory({
                    initial: 6000,
                    maximum: 10000
                  });
                  memoryBufferUint8 = new Uint8Array(memory.buffer);
                  _context6.next = 4;
                  return buildWasm(memory, wasmBase64);

                case 4:
                  exports = _context6.sent;
                  aligned_alloc = exports.aligned_alloc;
                  pv_leopard_version = exports.pv_leopard_version;
                  pv_leopard_process = exports.pv_leopard_process;
                  pv_leopard_delete = exports.pv_leopard_delete;
                  pv_leopard_init = exports.pv_leopard_init;
                  pv_status_to_string = exports.pv_status_to_string;
                  pv_sample_rate = exports.pv_sample_rate;
                  _context6.next = 14;
                  return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, Uint8Array.BYTES_PER_ELEMENT);

                case 14:
                  transcriptionAddressAddress = _context6.sent;

                  if (!(transcriptionAddressAddress === 0)) {
                    _context6.next = 17;
                    break;
                  }

                  throw new Error('malloc failed: Cannot allocate memory');

                case 17:
                  _context6.next = 19;
                  return aligned_alloc(Int32Array.BYTES_PER_ELEMENT, Int32Array.BYTES_PER_ELEMENT);

                case 19:
                  objectAddressAddress = _context6.sent;

                  if (!(objectAddressAddress === 0)) {
                    _context6.next = 22;
                    break;
                  }

                  throw new Error('malloc failed: Cannot allocate memory');

                case 22:
                  _context6.next = 24;
                  return aligned_alloc(Uint8Array.BYTES_PER_ELEMENT, (accessKey.length + 1) * Uint8Array.BYTES_PER_ELEMENT);

                case 24:
                  accessKeyAddress = _context6.sent;

                  if (!(accessKeyAddress === 0)) {
                    _context6.next = 27;
                    break;
                  }

                  throw new Error('malloc failed: Cannot allocate memory');

                case 27:
                  for (i = 0; i < accessKey.length; i++) {
                    memoryBufferUint8[accessKeyAddress + i] = accessKey.charCodeAt(i);
                  }

                  memoryBufferUint8[accessKeyAddress + accessKey.length] = 0;
                  _context6.next = 31;
                  return pv_leopard_init(accessKeyAddress, objectAddressAddress);

                case 31:
                  status = _context6.sent;

                  if (!(status !== PV_STATUS_SUCCESS)) {
                    _context6.next = 43;
                    break;
                  }

                  _context6.t0 = Error;
                  _context6.t1 = "'pv_leopard_init' failed with status ";
                  _context6.t2 = arrayBufferToStringAtIndex;
                  _context6.t3 = memoryBufferUint8;
                  _context6.next = 39;
                  return pv_status_to_string(status);

                case 39:
                  _context6.t4 = _context6.sent;
                  _context6.t5 = (0, _context6.t2)(_context6.t3, _context6.t4);
                  _context6.t6 = _context6.t1.concat.call(_context6.t1, _context6.t5);
                  throw new _context6.t0(_context6.t6);

                case 43:
                  memoryBufferView = new DataView(memory.buffer);
                  objectAddress = memoryBufferView.getInt32(objectAddressAddress, true);
                  _context6.next = 47;
                  return pv_sample_rate();

                case 47:
                  sampleRate = _context6.sent;
                  _context6.next = 50;
                  return pv_leopard_version();

                case 50:
                  versionAddress = _context6.sent;
                  version = arrayBufferToStringAtIndex(memoryBufferUint8, versionAddress);
                  return _context6.abrupt("return", {
                    aligned_alloc: aligned_alloc,
                    memory: memory,
                    objectAddress: objectAddress,
                    pvLeopardDelete: pv_leopard_delete,
                    pvLeopardProcess: pv_leopard_process,
                    pvStatusToString: pv_status_to_string,
                    sampleRate: sampleRate,
                    version: version,
                    transcriptionAddressAddress: transcriptionAddressAddress
                  });

                case 53:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6);
        }));

        function initWasm(_x4, _x5) {
          return _initWasm.apply(this, arguments);
        }

        return initWasm;
      }()
    }]);

    return Leopard;
  }();

  _defineProperty$1(Leopard, "_frameLength", void 0);

  _defineProperty$1(Leopard, "_sampleRate", void 0);

  _defineProperty$1(Leopard, "_version", void 0);

  _defineProperty$1(Leopard, "_leopardMutex", new Mutex());

  exports.Leopard = Leopard;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
