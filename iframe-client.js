/* Stream Craft Studio iframe bridge — build with: npm run build:iframe (in stream-craft-studio-control) */
var StreamCraftIframeLib = (function (exports) {
  "use strict";
  class IframeClient {
    constructor(iframeId) {
      this.iframeId = iframeId;
      this.setupMessageListener();
      this.sendMessage("INITIALIZE", { iframeId });
      // Parent may register after we load — retry until INITIAL_DATA arrives
      if (iframeId !== "standalone-preview") {
        let attempts = 0;
        const retry = setInterval(() => {
          if (this._connected || attempts++ > 20) {
            clearInterval(retry);
            return;
          }
          this.sendMessage("INITIALIZE", { iframeId });
        }, 250);
        window.addEventListener("iframe-message-INITIAL_DATA", () => {
          this._connected = true;
          clearInterval(retry);
        });
      }
    }
    setupMessageListener() {
      window.addEventListener("message", (event) => {
        const { type, data, source } = event.data;
        if (source === "parent") {
          window.dispatchEvent(
            new CustomEvent(`iframe-message-${type}`, { detail: data })
          );
        }
      });
    }
    sendMessage(type, data) {
      window.parent.postMessage(
        { type, data, source: this.iframeId, timestamp: Date.now() },
        "*"
      );
    }
    setPayload(payload) {
      this.sendMessage("SET_PAYLOAD", payload);
    }
    getPayload() {
      this.sendMessage("GET_PAYLOAD", null);
    }
    onInitialData(callback) {
      window.addEventListener("iframe-message-INITIAL_DATA", (event) => {
        callback(event.detail);
      });
    }
    onItemStateChanged(callback) {
      window.addEventListener("iframe-message-ITEM_STATE_CHANGED", (event) => {
        callback(event.detail);
      });
    }
  }
  window.IframeClient = IframeClient;
  exports.IframeClient = IframeClient;
  return exports;
})({});
