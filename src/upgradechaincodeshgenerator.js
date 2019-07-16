const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class UpgradeChaincodeShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/upgrade-chaincode.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

export FABRIC_CLI_ROOT=/opt/gopath/src/github.com/hyperledger/fabric
export ORDERER_CA=$FABRIC_CLI_ROOT/peer/crypto/ordererOrganizations/${Conf.ORDERER_DOMAIN}/orderers/orderer.${Conf.ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${Conf.ORDERER_DOMAIN}-cert.pem
export FABRIC_CFG_PATH=/etc/hyperledger/fabric
# 주의 반드시 디렉토리의 끝은 / 로 끝나야 할 것
CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/setcc/node/"

export LANGUAGE=node
export TIMEOUT=10
export DELAY=3


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


upgradeChaincode() {
    PEER=$1
    ORG=$2
    NAME=$3
    VERSION=$4
    LANGUAGE=$5
    CHANNELNAME=$6
    CTOR=$7
    POLICY=$8

    setGlobals $PEER $ORG

    env | grep CORE

    set -x
    peer chaincode upgrade -o orderer.${Conf.ORDERER_DOMAIN}:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNELNAME -n $NAME -v $VERSION -c $CTOR -P "AND ('org1MSP.peer')" >&log.txt
    res=$?
    set +x

    fail "upgradeChaincode failed"
}

echo "instantiate chaincode..."
upgradeChaincode $1 $2 $3 $4 $5 $6 $7 $8
sleep $TIMEOUT
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
