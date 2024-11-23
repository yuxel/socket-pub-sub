var { createPubSubClient } = require("./SocketPubSub");

var { publishMessage } = createPubSubClient("127.0.0.1", 8000, "bar", "io", (data) => {
  console.log("Data", data);
});

setTimeout(() => {
  publishMessage({ data: "This is from io to rules" }, "rules", true);
}, 15000);
