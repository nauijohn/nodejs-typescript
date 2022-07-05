const { config } = require("dotenv");
const { app } = require("./app");

config();

const PORT = process.env.PORT || 3002;
const ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
    console.log(`Express ${ENV} server listening on port ${PORT}`);
});