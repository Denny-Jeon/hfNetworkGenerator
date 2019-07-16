const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class SetEnvShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/set-env.sh");
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

setGlobals ${Conf.PEER_PREFIX}$1 ${Conf.ORG_PREFIX}$2
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
