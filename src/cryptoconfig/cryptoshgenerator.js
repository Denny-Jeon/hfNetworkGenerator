const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class CryptoShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "crypto.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set -e
PROJECT_ROOT=${this.params.path}
FABRIC_BIN=${Conf.fabricBinRoot}/bin
TARGET=$PROJECT_ROOT/crypto-config

export FABRIC_CFG_PATH=$PROJECT_ROOT

function fail() {
  if [ "$?" -ne 0 ]; then
      echo $1
      exit 1
  fi
}

which $FABRIC_BIN/cryptogen
fail "cryptogen tool not found. exiting"

echo
echo "##########################################################"
echo "##### Generate certificates using cryptogen tool #########"
echo "##########################################################"

if [ -d "$TARGET" ]; then
    $FABRIC_BIN/cryptogen generate --config=$PROJECT_ROOT/crypto-config.yaml --output=$TARGET
    fail "failed generate cryptogen. exiting"
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
