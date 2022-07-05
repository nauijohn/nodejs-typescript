const { config } = require("dotenv");
const { app } = require("./app");
const { WebSocketServer } = require("ws");
const url = require("url");
const EventEmitter = require("events");

config();

const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || "development";

// #region server - client
// SERVER - CLIENT
const server = new WebSocketServer({
    port: process.env.WEB_SOCKET_PORT,
});
const clients = new Map();

const addToListOfClients = (client, props) => clients.set(client, props);

const removeFromListOfClients = (client) => {
    if (clients.has(client)) {
        clients.delete(client);
    }
};

const onConnection = (client, req) => {
    const { query } = url.parse(req.url, true);

    if (query.client_id && query.client_id !== "") {
        addToListOfClients(client, query);
    } else {
        client.close();
        console.log("Missing client_id parameter.");
    }

    client.on("close", () => removeFromListOfClients(client));
};

const shouldInclude = (filter, props) => {
    for (const key in filter) {
        if (!key in props || props[key] === undefined) return false;
        if (!filter[key].includes(props[key])) return false;
    }
    return true;
};

const getFilteredClients = (filter) => {
    const filteredClients = new Map();

    for (let [key, value] of clients) {
        if (shouldInclude(filter, value)) {
            filteredClients.set(key, value);
        }
    }

    return filteredClients;
};

const sendToSpecificClient = (client, clientId, authorizationHeader, msg) => {
    try {
        const message = JSON.stringify(msg);
        client.send(message);
        logNotification(authorizationHeader, clientId, msg);
    } catch (e) {
        console.debug(e);
    }
};

const sendToClients = (notificationData) => {
    console.log("sendToClients...");
    for (let [key, value] of getFilteredClients(notificationData.filter)) {
        sendToSpecificClient(
            key,
            value["client_id"],
            notificationData.authorizationHeader,
            notificationData.message
        );
    }
};

const broadcast = (notificationData) => {
    clients.forEach((value, key) =>
        sendToSpecificClient(
            key,
            value["client_id"],
            notificationData.authorizationHeader,
            notificationData.message
        )
    );
};

server.on("connection", onConnection);

const eventEmitter = new EventEmitter();
// Listen for events
eventEmitter.on("send", sendToClients);
eventEmitter.on("broadcast", broadcast);
// #endregion server - client

app.listen(PORT, () => {
    console.log(`Express ${ENV} server listening on port ${PORT}`);
    console.log(`WebSocket server ready on port ${process.env.WEB_SOCKET_PORT}`);
});