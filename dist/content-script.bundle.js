/******/ (() => { // webpackBootstrap
/*!***********************************!*\
  !*** ./scripts/content-script.js ***!
  \***********************************/
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
/**
 * ./scripts/content-script.js
 * 
 * This content script runs in the context of web pages and handles DOM manipulation,
 * content extraction, and communication with the extension's background processes.
 */

// Use IIFE to prevent global scope pollution
(function () {
  // Private state management with better synchronization
  var state = {
    pageLinks: [],
    processingState: {
      isProcessing: false,
      lastProcessedUrl: null,
      processingPromise: null,
      processingProgress: 0
    },
    observers: {
      mutation: null
    }
  };

  // Enhanced debounce with proper cleanup
  function debounce(func, wait) {
    var timeout;
    return function executedFunction() {
      var _this = this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      clearTimeout(timeout);
      return new Promise(function (resolve) {
        timeout = setTimeout(function () {
          resolve(func.apply(_this, args));
        }, wait);
      });
    };
  }

  /**
   * Update processing progress
   */
  function updateProgress(progress, message) {
    state.processingState.processingProgress = progress;
    chrome.runtime.sendMessage({
      action: "embeddingProgress",
      progress: progress,
      message: message,
      hide: progress >= 100
    });
  }

  /**
   * Process and extract content from the current webpage
   */
  function processPageContent() {
    updateProgress(10, 'Starting content processing...');

    // Get the entire DOM structure
    var domContent = document.documentElement.outerHTML;
    var parser = new DOMParser();
    var doc = parser.parseFromString(domContent, 'text/html');
    updateProgress(20, 'Cleaning document structure...');

    // Remove unwanted elements
    var unwantedSelectors = ['script', 'style', 'noscript', 'iframe', 'img', 'video', 'audio', 'svg', 'canvas', 'nav', 'footer', 'header', 'aside', '.ad', '.ads', '.advertisement', '.social-share', '#comments', '.comments'];
    unwantedSelectors.forEach(function (selector) {
      doc.querySelectorAll(selector).forEach(function (el) {
        return el.remove();
      });
    });
    updateProgress(30, 'Extracting main content...');

    // Get main content
    var mainContent = doc.querySelector('main, article, .content, #content, [role="main"]');

    // Initialize processed content array
    var processedContent = [];

    // Function to clean text
    function cleanText(text) {
      return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').replace(/\t+/g, ' ').replace(/\r+/g, ' ').replace(/\f+/g, ' ').replace(/\v+/g, ' ').replace(/\u00A0/g, ' ').replace(/\u2028/g, ' ').replace(/\u2029/g, ' ').replace(/[^\S\n]+/g, ' ').trim();
    }

    /**
     * Formats a link element into the desired [LINK]...[/LINK][CONTENT]...[/CONTENT] format.
     * @param {HTMLElement} linkElement - The link element to format.
     * @returns {string} - The formatted link string.
     */
    function formatLink(linkElement) {
      try {
        var href = linkElement.href;
        var text = linkElement.textContent.trim();
        var precedingContext = '';
        var prevNode = linkElement.previousSibling;
        while (prevNode) {
          if (prevNode.nodeType === Node.TEXT_NODE) {
            precedingContext = cleanText(prevNode.textContent);
            break;
          } else if (prevNode.nodeType === Node.ELEMENT_NODE) {
            // If the previous node is an element, get its outerHTML
            precedingContext = cleanText(prevNode.outerHTML);
            break;
          }
          prevNode = prevNode.previousSibling;
        }
        var succeedingContext = '';
        var nextNode = linkElement.nextSibling;
        while (nextNode) {
          if (nextNode.nodeType === Node.TEXT_NODE) {
            succeedingContext = cleanText(nextNode.textContent);
            break;
          } else if (nextNode.nodeType === Node.ELEMENT_NODE) {
            // If the next node is an element, get its outerHTML
            succeedingContext = cleanText(nextNode.outerHTML);
            break;
          }
          nextNode = nextNode.nextSibling;
        }
        var context = "".concat(precedingContext, " ").concat(text, " ").concat(succeedingContext).trim();
        if (!context) {
          console.warn("No context found for link: ".concat(href));
        }
        return "[LINK]".concat(href, "[/LINK][CONTENT]").concat(context, "[/CONTENT]");
      } catch (error) {
        console.error('Error formatting link:', error, linkElement);
        return "[LINK]".concat(linkElement.href, "[/LINK][CONTENT]").concat(cleanText(linkElement.textContent), "[/CONTENT]");
      }
    }

    // Function to process each element recursively
    function processElement(element) {
      if (!element) return;
      var currentParagraph = '';
      var _iterator = _createForOfIteratorHelper(element.childNodes),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var node = _step.value;
          if (node.nodeType === Node.TEXT_NODE) {
            var text = cleanText(node.textContent);
            if (text) {
              currentParagraph += (currentParagraph ? ' ' : '') + text;
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (currentParagraph) {
              processedContent.push(currentParagraph);
              currentParagraph = '';
            }
            if (node.tagName.toLowerCase() === 'a' && node.href.startsWith('http')) {
              // Handle link with context using the dedicated function
              var formattedLink = formatLink(node);
              processedContent.push(formattedLink);
            } else {
              // Process other elements
              var tag = node.tagName.toLowerCase();
              var tagMap = {
                'div': 'div',
                'p': 'p',
                'li': 'li',
                'blockquote': 'blockquote',
                'table': 'table',
                'pre': 'pre',
                'code': 'code',
                'strong': 'strong',
                'b': 'b',
                'em': 'em',
                'i': 'i',
                'h1': 'h1',
                'h2': 'h2',
                'h3': 'h3',
                'h4': 'h4',
                'h5': 'h5',
                'h6': 'h6'
              };
              var mappedTag = tagMap[tag];
              if (mappedTag) {
                processedContent.push("[CONTENT]".concat(cleanText(node.outerHTML), "[/CONTENT]"));
              }
              // Recursive call
              processElement(node);
            }
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (currentParagraph) {
        processedContent.push(currentParagraph);
      }
    }

    // Special handling for Google search results
    if (window.location.hostname === 'www.google.com' && window.location.pathname === '/search') {
      updateProgress(40, 'Processing search results...');
      processedContent = Array.from(document.querySelectorAll('#search .g')).map(function (result, index) {
        var link = result.querySelector('a');
        var title = result.querySelector('h3');
        var snippet = result.querySelector('.VwiC3b');
        var formattedLink = link ? formatLink(link) : '';
        var formattedSnippet = snippet ? cleanText(snippet.textContent) : '';
        return "[Search Result ".concat(index + 1, "] ").concat(title ? cleanText(title.textContent) : '', "\n").concat(formattedLink, "\n[CONTENT]").concat(formattedSnippet, "[/CONTENT]");
      }).filter(function (result) {
        return result.trim().length > 0;
      }); // Filter out empty results
    } else {
      updateProgress(40, 'Processing page content...');
      processElement(mainContent || doc.body);
    }
    updateProgress(60, 'Formatting content...');

    // Combine all processed content into a single string with proper newlines
    var combinedContent = processedContent.join('\n').replace(/\n{3,}/g, '\n\n').trim();

    // Split the combined content into lines
    var lines = combinedContent.split('\n');

    // Adjust the chunking to keep [LINK]...[/LINK][CONTENT]...[/CONTENT] together
    var adjustedContent = [];
    var currentChunk = '';
    lines.forEach(function (line) {
      if (line.startsWith('[LINK]')) {
        // If there's existing content in currentChunk, push it before adding the link
        if (currentChunk) {
          adjustedContent.push(currentChunk.trim());
          currentChunk = '';
        }
        // Push the link as a separate chunk to ensure it's not split
        adjustedContent.push(line.trim());
      } else {
        // Append these formatted lines to the current chunk
        if (currentChunk) {
          currentChunk += ' ' + line.trim();
        } else {
          currentChunk = line.trim();
        }
      }
    });

    // Push any remaining content
    if (currentChunk) {
      adjustedContent.push(currentChunk.trim());
    }

    // Join all chunks with newlines
    var finalContent = adjustedContent.join('\n');
    updateProgress(80, 'Finalizing content...');
    return finalContent;
  }

  /**
   * Handle clicking links by ID
   */
  function clickLink(linkId) {
    var link = state.pageLinks.find(function (link) {
      return link.id === linkId;
    });
    if (link && link.element) {
      try {
        link.element.click();
        return {
          success: true
        };
      } catch (error) {
        console.error('Error clicking link:', error);
        return {
          success: false,
          error: 'Failed to click link: ' + error.message
        };
      }
    } else {
      return {
        success: false,
        error: "Link not found"
      };
    }
  }

  /**
   * Synchronized content capture and processing with retries
   */
  function captureAndSendDOM() {
    return _captureAndSendDOM.apply(this, arguments);
  } // Debounced content processing
  function _captureAndSendDOM() {
    _captureAndSendDOM = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
      var retryCount,
        maxRetries,
        currentUrl,
        _args3 = arguments;
      return _regeneratorRuntime().wrap(function _callee3$(_context3) {
        while (1) switch (_context3.prev = _context3.next) {
          case 0:
            retryCount = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : 0;
            maxRetries = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : 3;
            if (!state.processingState.isProcessing) {
              _context3.next = 5;
              break;
            }
            console.log('Content processing already in progress...');
            return _context3.abrupt("return", state.processingState.processingPromise);
          case 5:
            currentUrl = window.location.href;
            if (!(state.processingState.lastProcessedUrl === currentUrl)) {
              _context3.next = 9;
              break;
            }
            console.log('URL already processed. Skipping...');
            return _context3.abrupt("return", Promise.resolve());
          case 9:
            state.processingState.isProcessing = true;
            state.processingState.processingPromise = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
              var processedContent;
              return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                while (1) switch (_context2.prev = _context2.next) {
                  case 0:
                    _context2.prev = 0;
                    updateProgress(0, 'Starting content processing...');
                    processedContent = processPageContent(); // Send content to extension with retry logic
                    _context2.prev = 3;
                    _context2.next = 6;
                    return new Promise(function (resolve, reject) {
                      chrome.runtime.sendMessage({
                        action: "processedContent",
                        content: processedContent,
                        url: currentUrl
                      }, function (response) {
                        if (chrome.runtime.lastError) {
                          reject(chrome.runtime.lastError);
                        } else {
                          resolve(response);
                        }
                      });
                    });
                  case 6:
                    updateProgress(100, 'Content processing complete');
                    state.processingState.lastProcessedUrl = currentUrl;
                    return _context2.abrupt("return", {
                      success: true
                    });
                  case 11:
                    _context2.prev = 11;
                    _context2.t0 = _context2["catch"](3);
                    console.error('Error sending content:', _context2.t0);
                    if (!(retryCount < maxRetries)) {
                      _context2.next = 19;
                      break;
                    }
                    console.log("Retrying (".concat(retryCount + 1, "/").concat(maxRetries, ")..."));
                    _context2.next = 18;
                    return new Promise(function (resolve) {
                      return setTimeout(resolve, 1000 * (retryCount + 1));
                    });
                  case 18:
                    return _context2.abrupt("return", captureAndSendDOM(retryCount + 1, maxRetries));
                  case 19:
                    throw _context2.t0;
                  case 20:
                    _context2.next = 27;
                    break;
                  case 22:
                    _context2.prev = 22;
                    _context2.t1 = _context2["catch"](0);
                    console.error('Error in captureAndSendDOM:', _context2.t1);
                    updateProgress(100, 'Error processing content', true);
                    return _context2.abrupt("return", {
                      success: false,
                      error: _context2.t1.message
                    });
                  case 27:
                    _context2.prev = 27;
                    state.processingState.isProcessing = false;
                    state.processingState.processingPromise = null;
                    return _context2.finish(27);
                  case 31:
                  case "end":
                    return _context2.stop();
                }
              }, _callee2, null, [[0, 22, 27, 31], [3, 11]]);
            }))();
            return _context3.abrupt("return", state.processingState.processingPromise);
          case 12:
          case "end":
            return _context3.stop();
        }
      }, _callee3);
    }));
    return _captureAndSendDOM.apply(this, arguments);
  }
  var processDOMDebounced = debounce(captureAndSendDOM, 1000);

  // Message handler with proper async handling
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var handleMessage = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.t0 = request.action;
              _context.next = _context.t0 === "getPageContent" ? 4 : _context.t0 === "clickLink" ? 5 : _context.t0 === "processPageContent" ? 6 : _context.t0 === "initializeContext" ? 6 : _context.t0 === "searchEmbeddings" ? 7 : 10;
              break;
            case 4:
              return _context.abrupt("return", {
                content: processPageContent()
              });
            case 5:
              return _context.abrupt("return", clickLink(request.linkId));
            case 6:
              return _context.abrupt("return", processDOMDebounced());
            case 7:
              if (!state.processingState.isProcessing) {
                _context.next = 9;
                break;
              }
              return _context.abrupt("return", {
                success: false,
                error: "Content processing in progress. Please wait..."
              });
            case 9:
              return _context.abrupt("return", new Promise(function (resolve) {
                chrome.runtime.sendMessage({
                  action: "performEmbeddingSearch",
                  query: request.query,
                  url: window.location.href
                }, resolve);
              }));
            case 10:
              return _context.abrupt("return", {
                success: false,
                error: "Unknown action"
              });
            case 11:
              _context.next = 17;
              break;
            case 13:
              _context.prev = 13;
              _context.t1 = _context["catch"](0);
              console.error('Error handling message:', _context.t1);
              return _context.abrupt("return", {
                success: false,
                error: _context.t1.message
              });
            case 17:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[0, 13]]);
      }));
      return function handleMessage() {
        return _ref.apply(this, arguments);
      };
    }();

    // Handle async response
    handleMessage().then(sendResponse);
    return true;
  });

  // Initialize content processing
  processDOMDebounced();

  // Set up mutation observer for Google search results
  if (window.location.hostname === 'www.google.com' && window.location.pathname === '/search') {
    var handleMutations = debounce(function () {
      if (!state.processingState.isProcessing) {
        processDOMDebounced();
      }
    }, 1000);
    state.observers.mutation = new MutationObserver(function (mutations) {
      if (mutations.some(function (mutation) {
        return mutation.target.id === 'search' || mutation.target.closest('#search');
      })) {
        handleMutations();
      }
    });
    state.observers.mutation.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
})();
/******/ })()
;
//# sourceMappingURL=content-script.bundle.js.map