const Os = require("os");
const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class SaveNetworkParams extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/save-network-params.sh");
        this.params = params;
        this.network = network;
    }


    // eslint-enable
    print() {
        Logger.debug(this.content);
    }


    async save() {
        return this.writeFile(JSON.stringify({
            params: this.params,
            network: this.network,
            conf: Conf,
        }), `${Os.homedir()}/.hfng/${Conf.projectName}.json`);
    }

    async delete() {
        return this.remove(`${Os.homedir()}/.hfng/${Conf.projectName}.json`);
    }
};
