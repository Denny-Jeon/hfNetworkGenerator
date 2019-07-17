const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class SetEnvShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/set-env.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# import
. /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/set-globals.sh

setGlobals ${Conf.peerPrefix}$1 ${Conf.orgPrefix}$2
`;
    }


    // eslint-enable
    print() {
        Logger.debug(this.content);
    }


    async save() {
        return this.writeFile(this.content, null, {
            flag: "w+",
            mode: "0755",
        });
    }
};
