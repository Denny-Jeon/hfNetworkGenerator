const Os = require("os");
const FileWrapper = require("../util/filewrapper");

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
        await this.clearFolder(`${this.params.path}/scripts`);
        await this.clearFolder(`${this.params.path}/connections`);
        await this.clearFolder(`${this.params.path}/compose`);

        await this.createFolder(`${Os.homedir()}/.hfng`);
        await this.createFolder(`${this.params.path}/crypto-config`);
        await this.createFolder(`${this.params.path}/channel-artifacts`);
        await this.createFolder(`${this.params.path}/scripts`);
        await this.createFolder(`${this.params.path}/connections`);
        await this.createFolder(`${this.params.path}/chaincode`);
        await this.createFolder(`${this.params.path}/compose`);
        // await this.writeFile(JSON.stringify(this.network, undefined, 4),
        //     `${this.params.path}/.network.json`);
        await this.copyExampleChaincode();
    }
};
