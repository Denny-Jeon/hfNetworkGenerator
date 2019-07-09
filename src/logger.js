// import { getLogger } from "log4js";
const { getLogger } = require("log4js");

const logger = getLogger();
logger.level = "debug";

module.exports = logger;
