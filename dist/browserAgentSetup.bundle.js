/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!**************************************!*\
  !*** ./scripts/browserAgentSetup.js ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   browserAgent: () => (/* binding */ browserAgent)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * ./scripts/browserAgentSetup.js
 * 
 * This module configures the browser agent with settings and context management.
 */
var BrowserAgent = /*#__PURE__*/function () {
  function BrowserAgent() {
    _classCallCheck(this, BrowserAgent);
    this.systemPrompt = "I am a browser assistant that helps users navigate and interact with web content.\nI can search for information, analyze page content, and help users find what they're looking for.\nI maintain context of our conversation and can perform various browser actions to assist users.";
    this.contextSize = 4000; // Default context window size
    this.currentContextSize = 0;
    this.settings = {
      apiEndpoint: 'http://localhost:1234',
      embeddingsEndpoint: 'http://localhost:1234/v1/embeddings',
      embeddingsModel: 'text-embedding-all-minilm-l6-v2-embedding'
    };
  }
  return _createClass(BrowserAgent, [{
    key: "updateSettings",
    value: function updateSettings(settings) {
      if (settings.contextWindow) {
        this.contextSize = parseInt(settings.contextWindow);
      }
      if (settings.apiEndpoint) {
        this.settings.apiEndpoint = settings.apiEndpoint;
      }
      if (settings.embeddingsEndpoint) {
        this.settings.embeddingsEndpoint = settings.embeddingsEndpoint;
      }
      if (settings.embeddingsModel) {
        this.settings.embeddingsModel = settings.embeddingsModel;
      }
    }
  }, {
    key: "checkContextSize",
    value: function checkContextSize(text) {
      var textSize = text.length;
      if (this.currentContextSize + textSize > this.contextSize) {
        return {
          canAdd: false,
          message: "Context window limit reached. Starting new conversation."
        };
      }
      return {
        canAdd: true,
        message: null
      };
    }
  }, {
    key: "updateContextSize",
    value: function updateContextSize(text) {
      this.currentContextSize += text.length;
    }
  }, {
    key: "resetContext",
    value: function resetContext() {
      this.currentContextSize = 0;
    }
  }, {
    key: "getSettings",
    value: function getSettings() {
      return this.settings;
    }
  }]);
}();
var browserAgent = new BrowserAgent();
/******/ })()
;
//# sourceMappingURL=browserAgentSetup.bundle.js.map