const util = {};
const delimiter = "|__|--|";

util.startPubSubServer = (port) => {
  var sockets = {};
  var socketGroups = {};

  var server = require("net").createServer(function (socket) {
    var name;
    var group;

    socket.on("close", function (data) {
      delete sockets[name];
      socketGroups[group] = socketGroups[group].filter((x) => x != name);
      console.log("Discconnected", { name, group });
    });

    socket.on("data", function (dataBuffer) {
      var datas = dataBuffer.toString().split(delimiter);

      datas.forEach((data) => {
        try {
          var data = JSON.parse(data.toString());

          if (data?.command == "handshake") {
            name = data.name;
            group = data.group;

            sockets[name] = socket;
            socketGroups[group] = socketGroups[group] || [];
            socketGroups[group].push(name);

            console.log("Connected", { name, group });
          }

          if (data?.command == "publish") {
            let msgData =
              JSON.stringify({
                success: true,
                command: "consume",
                senderName: name,
                senderGroup: group,
                toGroup: data.toGroup,
                message: data.message,
              }) + delimiter;

            if (data.toGroup && data.toAll) {
              if (socketGroups?.[data.toGroup]?.length) {
                socketGroups?.[data.toGroup]?.forEach((socketName) => {
                  sockets[socketName].write(msgData);
                });
              }

              console.log(
                "Message published to ALL listeners in group: ",
                data.toGroup,
              );
            } else if (data.toGroup && data.toRandom) {
              if (socketGroups?.[data.toGroup]?.length) {
                let loopGroup = socketGroups?.[data.toGroup];
                const randomNumber = Math.floor(
                  Math.random() * loopGroup.length + 1,
                );
                let socketName = loopGroup[randomNumber];
                sockets[socketName].write(msgData);
              }
              console.log(
                "Message published to random listener in group: ",
                data.toGroup,
              );
            } else if (data.toAll) {
              for (let socketName in sockets) {
                sockets[socketName].write(msgData);
              }
              console.log("Message published to all listening sockets");
            }
          }
        } catch (e) {}
      });
    });
  });

  server.on("listening", () => {
    console.log("Server is listening on PORT", port);
  });

  server.listen(port);
};

util.createPubSubClient = (host, port, name, group, consumeFn) => {
  var socket = require("net").Socket();
  socket.connect(port, host);

  socket.on("connect", function () {
    socket.write(
      JSON.stringify({
        id: name + new Date().getTime(),
        command: "handshake",
        name: name,
        group: group,
        date: new Date(),
      }) + delimiter,
    );
    console.log("connected");
  });

  socket.on("data", function (dataBuffer) {
    var datas = dataBuffer.toString().split(delimiter);
    datas.forEach((data) => {
      try {
        var data = JSON.parse(data.toString());

        if (data.command == "consume") {
          consumeFn(data);
        }
      } catch (e) {}
    });
  });

  return {
    publishMessage: (message, toGroup, toAll = true) => {
      socket.write(
        JSON.stringify({
          command: "publish",
          toGroup,
          toAll: toAll,
          toRandom: !toAll,
          message,
          date: new Date(),
        }) + delimiter,
      );
    },
  };
};

module.exports = util;
