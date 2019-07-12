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
TARGET=$FABRIC_NETWORK_ROOT/crypto-config

export FABRIC_CFG_PATH=$FABRIC_NETWORK_ROOT

function fail () {
  if [ "$?" -ne 0 ]; then
      echo $1
      exit 1
  fi
}

which $BIN/cryptogen
fail "cryptogen tool not found. exiting"


echo
echo "##########################################################"
echo "##### Generate certificates using cryptogen tool #########"
echo "##########################################################"

if [ -d "$TARGET" ]; then
    $BIN/cryptogen generate --config=$FABRIC_NETWORK_ROOT/crypto-config.yaml --output=$TARGET
    fail "failed generate cryptogen. exiting"
fi
        `;
    }


    // eslint-enable
    print() {
        Logger.debug(this.content);
    }
};
