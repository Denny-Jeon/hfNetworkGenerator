const fs = require("fs");
const Logger = require("./logger");
const Conf = require("./conf");

module.exports = class CryptoShGenerator {
    constructor({ params, network }) {
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set -e
FABRIC_NETWORK_ROOT=${Conf.FABRIC_NETWORK_ROOT}
FABRIC_BIN=$FABRIC_NETWORK_ROOT/fabric-binaries/${Conf.FABRIC_VERSION}/bin
TARGET=$FABRIC_NETWORK_ROOT/channel-artifacts/OrgsOrdererGenesis

export FABRIC_CFG_PATH=$FABRIC_NETWORK_ROOT

function fail () {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

which $BIN/configtxgen
fail "cryptogen tool not found. exiting"

mkdir $TARGET

$BIN/configtxgen --profile OrgsOrdererGenesis -outputBLock $TARGET/genesis.block
fail "Failed to generate orderer genesis block..."



        `;
    }


    // eslint-enable
    print() {
        Logger.debug(this.content);
    }
};
