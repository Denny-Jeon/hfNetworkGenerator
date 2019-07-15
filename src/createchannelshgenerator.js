const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class CreateChannelShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/create-channels.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# start
# COMPOSER_PROJECT_NAME=${Conf.PROJECT_NETWORK_NAME}
# FABRIC_VERSION=${Conf.FABRIC_VERSION}
# THIRDPARTY_VERSION=${Conf.THIRDPARTY_VERSION}
# PROJECT_ROOT=${this.params.path}
# TARGET=$PROJECT_ROOT/channel-artifacts/OrgsOrdererGenesis
# ORDERER_CA=ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/settle.com/orderers/orderer.settle.com/msp/tlscacerts/tlsca.settle.com-cert.pem
# FABRIC_BIN=${Conf.FABRIC_BIN_ROOT}/bin
# export FABRIC_CFG_PATH=$PROJECT_ROOT

FABRIC_CLI_ROOT=/opt/gopath/src/github.com/hyperledger/fabric
ORDERER_CA=$FABRIC_CLI_ROOT/peer/crypto/ordererOrganizations/${Conf.ORDERER_DOMAIN}/orderers/orderer.${Conf.ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${Conf.ORDERER_DOMAIN}-cert.pem

function fail() {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}


setGlobals() {
    PEER=$1
    ORG=$2

    case $ORG in
        ${this.network.orgs.map(org => `
        "${org}")
            CORE_PEER_LOCALMSPID="${org}MSP"
            CORE_PEER_MSPCONFIGPATH=$FABRIC_CLI_ROOT/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/users/Admin@${org}.${Conf.DOMAIN}/msp
            case $PEER in
            ${this.network.peers.map(peer => `
                "${peer}")
                CORE_PEER_TLS_ROOTCERT_FILE=$FABRIC_CLI_ROOT/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/peers/${peer}.${org}.${Conf.DOMAIN}/tls/ca.crt
                CORE_PEER_ADDRESS=${peer}.${org}.${Conf.DOMAIN}:${this.network.ports[org][peer].ADDRESS}
                ;;
                `).join("")}
            esac
            ;;
        `).join("")}  
    esac
}

createChannel() {
    PEER=$1
    ORG=$2  
    setGlobals $PEER $ORG

    set -x
    ${this.network.channels.map(CH => `
    peer channel create -o orderer.${Conf.ORDERER_DOMAIN}:7050 -c $CH -f ./channel-artifacts/OrgsOrdererGenesis/${CH}.tx --tls $CORE_PEER_TLS_ENABLED  --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
    cat log.txt
    `)}
    
}

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
