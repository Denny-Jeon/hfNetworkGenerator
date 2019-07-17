const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class JoinChannelShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/join-channels.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# import
. /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/set-globals.sh


joinChannelWithRetry() {
    PEER=$1
    ORG=$2  
    setGlobals $PEER $ORG

    env | grep CORE

    set -x
    ${this.network.channels.map(CH => `
    peer channel join -b ${CH}.block >&log.txt
    res=$?
    set +x
    cat log.txt
    if [ $res -ne 0 -a $COUNTER -lt $MAX_RETRY ]; then
        COUNTER=$(expr $COUNTER + 1)
        echo "$PEER.$ORG failed to join the channel, Retry after $DELAY seconds"
        sleep $DELAY
        joinChannelWithRetry $PEER $ORG
    else
        COUNTER=1
    fi

    fail "join channel ${CH} failed"
    `).join("")}   
}

joinChannelWithRetry $1 $2
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
