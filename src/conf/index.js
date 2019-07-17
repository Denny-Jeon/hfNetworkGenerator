const DotEnv = require("dotenv");
const AppRootPath = require("app-root-path");
const Conf = require("./conf");
const Logger = require("../util/logger");

const result = DotEnv.config({ path: `${AppRootPath}/env/network.env` });
if (result.error) {
    Logger.error(result.error);
}

module.exports = Conf(process.env);
