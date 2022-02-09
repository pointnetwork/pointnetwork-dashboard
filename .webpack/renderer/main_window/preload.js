/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./electron/bridge.ts":
/*!****************************!*\
  !*** ./electron/bridge.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"api\": () => (/* binding */ api)\n/* harmony export */ });\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! electron */ \"electron\");\n/* harmony import */ var electron__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(electron__WEBPACK_IMPORTED_MODULE_0__);\n\nvar api = {\n  /**\n   * Here you can expose functions to the renderer process\n   * so they can interact with the main (electron) side\n   * without security problems.\n   *\n   * The function below can accessed using `window.Main.sendMessage`\n   */\n  send: function send(channel, message) {\n    electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.send(channel, message);\n  },\n\n  /**\n   * Provide an easier way to listen to events\n     */\n  receive: function receive(channel, func) {\n    return electron__WEBPACK_IMPORTED_MODULE_0__.ipcRenderer.once(channel, function (event) {\n      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {\n        args[_key - 1] = arguments[_key];\n      }\n\n      return func(args);\n    });\n  }\n};\nelectron__WEBPACK_IMPORTED_MODULE_0__.contextBridge.exposeInMainWorld(\"Main\", api);//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lbGVjdHJvbi1yZWFjdC10eXBlc2NyaXB0Ly4vZWxlY3Ryb24vYnJpZGdlLnRzP2UyZDYiXSwibmFtZXMiOlsiYXBpIiwic2VuZCIsImNoYW5uZWwiLCJtZXNzYWdlIiwiaXBjUmVuZGVyZXIiLCJyZWNlaXZlIiwiZnVuYyIsImV2ZW50IiwiYXJncyIsImNvbnRleHRCcmlkZ2UiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBRU8sSUFBTUEsR0FBRyxHQUFHO0FBQ2pCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUVDLE1BQUksRUFBRSxjQUFDQyxPQUFELEVBQWtCQyxPQUFsQixFQUF1QztBQUMzQ0MsMERBQUEsQ0FBaUJGLE9BQWpCLEVBQTBCQyxPQUExQjtBQUNELEdBWGdCOztBQWFqQjtBQUNGO0FBQ0E7QUFDRUUsU0FBTyxFQUFFLGlCQUFDSCxPQUFELEVBQWtCSSxJQUFsQjtBQUFBLFdBQWtERixzREFBQSxDQUN6REYsT0FEeUQsRUFFekQsVUFBQ0ssS0FBRDtBQUFBLHdDQUFXQyxJQUFYO0FBQVdBLFlBQVg7QUFBQTs7QUFBQSxhQUFvQkYsSUFBSSxDQUFDRSxJQUFELENBQXhCO0FBQUEsS0FGeUQsQ0FBbEQ7QUFBQTtBQWhCUSxDQUFaO0FBdUJQQyxxRUFBQSxDQUFnQyxNQUFoQyxFQUF1Q1QsR0FBdkMiLCJmaWxlIjoiLi9lbGVjdHJvbi9icmlkZ2UudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjb250ZXh0QnJpZGdlLCBpcGNSZW5kZXJlciB9IGZyb20gJ2VsZWN0cm9uJ1xuXG5leHBvcnQgY29uc3QgYXBpID0ge1xuICAvKipcbiAgICogSGVyZSB5b3UgY2FuIGV4cG9zZSBmdW5jdGlvbnMgdG8gdGhlIHJlbmRlcmVyIHByb2Nlc3NcbiAgICogc28gdGhleSBjYW4gaW50ZXJhY3Qgd2l0aCB0aGUgbWFpbiAoZWxlY3Ryb24pIHNpZGVcbiAgICogd2l0aG91dCBzZWN1cml0eSBwcm9ibGVtcy5cbiAgICpcbiAgICogVGhlIGZ1bmN0aW9uIGJlbG93IGNhbiBhY2Nlc3NlZCB1c2luZyBgd2luZG93Lk1haW4uc2VuZE1lc3NhZ2VgXG4gICAqL1xuXG4gIHNlbmQ6IChjaGFubmVsOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKGNoYW5uZWwsIG1lc3NhZ2UpXG4gIH0sXG5cbiAgLyoqXG4gICAqIFByb3ZpZGUgYW4gZWFzaWVyIHdheSB0byBsaXN0ZW4gdG8gZXZlbnRzXG4gICAgICovXG4gIHJlY2VpdmU6IChjaGFubmVsOiBzdHJpbmcsIGZ1bmM6IChhcmcwOiBhbnlbXSkgPT4gdm9pZCkgPT4gaXBjUmVuZGVyZXIub25jZShcbiAgICBjaGFubmVsLFxuICAgIChldmVudCwgLi4uYXJncykgPT4gZnVuYyhhcmdzKVxuICApXG5cbn1cblxuY29udGV4dEJyaWRnZS5leHBvc2VJbk1haW5Xb3JsZChcIk1haW5cIixhcGkpXG4iXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./electron/bridge.ts\n");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval-source-map devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./electron/bridge.ts");
/******/ 	
/******/ })()
;