const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class UpgradeChaincodeShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/upgrade-chaincode.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# import
. /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/set-globals.sh


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
    peer chaincode upgrade -o orderer.${Conf.ordererDomain}:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNELNAME -n $NAME -v $VERSION -c $CTOR -P "AND ('org1MSP.peer')" >&log.txt
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
