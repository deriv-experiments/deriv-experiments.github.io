(() => {
  // src/worker.ts
  var sendQueue = [];
  var lastMessageCache = {};
  var websocketUrl;
  var authorize;
  var connection;
  var wsLog = [];
  var wsPush = (type, message) => {
    wsLog.push([type, message]);
    postToAll("debug:add", [type, message]);
  };
  function setupWebSocket() {
    if (!websocketUrl) {
      return;
    }
    if (connection?.readyState === WebSocket.OPEN && websocketUrl === connection.url) {
      return;
    }
    connection?.close();
    console.log("connecting to websocket");
    connection = new WebSocket(websocketUrl);
    connection.addEventListener("open", handleOpen);
    connection.addEventListener("close", () => {
      console.log("connection closed");
      setupWebSocket();
    });
    connection.addEventListener("message", (message) => {
      const data = JSON.parse(message.data);
      wsPush("RECEIVE", data);
      if (data.echo_req.authorize) {
        lastMessageCache.authorize = data;
      }
      if (data.echo_req.app_list === 1) {
        lastMessageCache.app_list = data;
      }
      if (data.echo_req.statement === 1) {
        lastMessageCache.statement = data;
      }
      postToAll("ws", data);
    });
  }
  setupWebSocket();
  if (connection?.readyState === WebSocket.OPEN) {
    handleOpen();
  }
  function send(message) {
    if (message.authorize) {
      authorize = message;
    }
    ;
    if (message.authorize && lastMessageCache.authorize) {
      postToAll("ws", lastMessageCache.authorize);
      return;
    }
    if (message.app_list && lastMessageCache.app_list) {
      postToAll("ws", lastMessageCache.app_list);
    }
    if (message.statement && lastMessageCache.statement) {
      postToAll("ws", lastMessageCache.statement);
    }
    wsPush("SEND", message);
    connection.send(JSON.stringify(message));
  }
  function handleOpen() {
    if (authorize) {
      connection.send(JSON.stringify(authorize));
    }
    for (const message of sendQueue) {
      send(message);
    }
  }
  function sendOrQueue(message) {
    if (connection.readyState === WebSocket.OPEN) {
      send(message);
      return;
    }
    if (connection.readyState === WebSocket.CONNECTING) {
      sendQueue.push(message);
      return;
    }
  }
  async function postToAll(...args) {
    const clients2 = await self.clients.matchAll();
    clients2.forEach((client) => {
      client.postMessage(args);
    });
  }
  self.addEventListener("install", function(event) {
    event.waitUntil(async function() {
      console.log("Service worker installed");
    }());
  });
  self.addEventListener("activate", function(event) {
    event.waitUntil(clients.claim());
  });
  self.addEventListener("message", function(event) {
    if (event.data[0] === "setWebsocketUrl") {
      websocketUrl = event.data[1];
      setupWebSocket();
      return;
    }
    if (event.data[0] === "debug") {
      postToAll("debug", wsLog);
      return;
    }
    if (event.data[0] === "ping") {
      return;
    }
    if (event.data[0] === "ws") {
      sendOrQueue(event.data[1]);
      return;
    }
    postToAll();
  });
})();
//# sourceMappingURL=worker.js.map
