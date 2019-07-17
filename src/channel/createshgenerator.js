const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class CreateChannelShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/create-channels.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# import
. /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/set-globals.sh

createChannel() {
    PEER=$1
    ORG=$2  
    setGlobals $PEER $ORG

    env | grep CORE

    set -x
    ${this.network.channels.map(CH => `
    peer channel create -o orderer.${Conf.ordererDomain}:7050 -c ${CH} -f ./channel-artifacts/OrgsOrdererGenesis/${CH}.tx --tls $CORE_PEER_TLS_ENABLED  --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
    cat log.txt
    fail "create channel ${CH} failed"
    # sleep $DELAY
    `).join("")}   
}

createChannel ${this.network.peers[0]} ${this.network.orgs[0]}

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
