const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class InstallChaincodeShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "scripts/install-chaincode.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# import
. /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/set-globals.sh


installChaincode() {
    PEER=$1
    ORG=$2
    NAME=$3
    VERSION=$4
    LANGUAGE=$5

    setGlobals $PEER $ORG

    env | grep CORE

    set -x
    peer chaincode install -n $NAME -v $VERSION -l $LANGUAGE -p $CC_SRC_PATH >&log.txt
    res=$?
    set +x
    cat log.txt

    fail "install channel $NAME failed"
}


instantiateChaincode() {
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
    peer chaincode instantiate -o orderer.${Conf.ordererDomain}:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNELNAME -n $NAME -l $LANGUAGE -v $VERSION -c $CTOR -P "AND ('org1MSP.peer')" >&log.txt
    res=$?
    set +x

    fail "install channel $NAME failed"
}

echo "install chaincode..."
installChaincode $1 $2 $3 $4 $5

if [ "$9" == "true" ]; then 
    echo "instantiate chaincode..."
    instantiateChaincode $1 $2 $3 $4 $5 $6 $7 $8
    sleep $TIMEOUT
fi
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
