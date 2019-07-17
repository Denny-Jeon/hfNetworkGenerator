const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class JoinChannelShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/update-anchor-peers.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# import
. /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/set-globals.sh

updateAnchorPeers() {
    PEER=$1
    ORG=$2  
    CH=$3
    setGlobals $PEER $ORG

    env | grep CORE

    set -x
      peer channel update -o orderer.${Conf.ordererDomain}:7050 -c $CH -f ./channel-artifacts/OrgsOrdererGenesis/$\{ORG\}Anchors.$CH.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
    res=$?
    res=$?
    set +x
    cat log.txt

    fail "update AnchorPeers channel $CH failed"
}

updateAnchorPeers $1 $2 $3
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
