// const Logger = require("./logger");
// const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class NetworkFolder extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, null);

        this.params = params;
        this.network = network;
    }

    async generate() {
        // await this.clearFolder();
        await this.createFolder();
        await this.clearFolder(`${this.params.path}/crypto-config`);
        await this.clearFolder(`${this.params.path}/channel-artifacts`);
        await this.createFolder(`${this.params.path}/crypto-config`);
        await this.createFolder(`${this.params.path}/channel-artifacts`);
    }
};