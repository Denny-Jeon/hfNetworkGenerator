const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class ChaincodeCliShGenerator extends FileWrapper {
    constructor({ params }) {
        super(params.path, "chaincode-cli.sh");
        this.params = params;

        this.org = `${Conf.orgPrefix}${this.params.org}`;
        this.peer = `${Conf.peerPrefix}${this.params.peer}`;
        this.channel = `${Conf.channelPrefix}${this.params.channel}`;
        this.ctorstring = JSON.stringify(this.params.ctor);
        this.policystring = this.params.policy.replace(/'/g, "\\'")
            .replace(/"/g, "\\\"");
        // eslint-disable
        this.content = `
#!/bin/bash
set +e

function fail() {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

docker exec --interactive cli-${Conf.projectNetworkName} /bin/bash -c 'scripts/${this.params.mode}-chaincode.sh ${this.peer} ${this.org} ${this.params.name} ${this.params.version} ${this.params.language} ${this.channel} ${this.ctorstring} "" ${this.params.instantiate}'
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
