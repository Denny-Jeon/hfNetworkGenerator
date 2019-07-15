const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class JoinChannelShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/join-channels.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

export FABRIC_CLI_ROOT=/opt/gopath/src/github.com/hyperledger/fabric
export ORDERER_CA=$FABRIC_CLI_ROOT/peer/crypto/ordererOrganizations/${Conf.ORDERER_DOMAIN}/orderers/orderer.${Conf.ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${Conf.ORDERER_DOMAIN}-cert.pem
export FABRIC_CFG_PATH=/etc/hyperledger/fabric

export LANGUAGE=node
export IMAGETAG="latest"
export TIMEOUT=10
export DELAY=3

COUNTER=1
MAX_RETRY=2

function fail() {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}


setGlobals() {
    PEER=$1
    ORG=$2

    echo $PEER
    echo $ORG

    case $ORG in
        ${this.network.orgs.map(org => `
        "${org}")
            echo "setGlobals ${org}"
            export CORE_PEER_LOCALMSPID="${org}MSP"
            export CORE_PEER_MSPCONFIGPATH=$FABRIC_CLI_ROOT/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/users/Admin@${org}.${Conf.DOMAIN}/msp
            case $PEER in
            ${this.network.peers.map(peer => `
                "${peer}")
                echo "setGlobals ${peer}"
                export CORE_PEER_TLS_ROOTCERT_FILE=$FABRIC_CLI_ROOT/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/peers/${peer}.${org}.${Conf.DOMAIN}/tls/ca.crt
                export CORE_PEER_ADDRESS=${peer}.${org}.${Conf.DOMAIN}:${this.network.ports[org][peer].ADDRESS}
                ;;
                `).join("")}
            esac
            ;;
        `).join("")}  
    esac
}

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
    # if [ $res -ne 0 -a $COUNTER -lt $MAX_RETRY ]; then
    #    COUNTER=$(expr $COUNTER + 1)
    #    echo "$PEER.$ORG failed to join the channel, Retry after $DELAY seconds"
    #    sleep $DELAY
    #    joinChannelWithRetry $PEER $ORG
    # else
    #    COUNTER=1
    # fi

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
