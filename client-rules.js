var { createPubSubClient } = require("./SocketPubSub");

var { publishMessage } = createPubSubClient("127.0.0.1", 8000, "foo", "rules", (data) => {
  console.log("Data", data);
});

setTimeout(() => {
  publishMessage({ data: "This is from rules to io" }, "io", true);
}, 10000);
