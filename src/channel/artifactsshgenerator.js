const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class ChannelArtifactsShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "channel-artifacts.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set -e
PROJECT_ROOT=${this.params.path}
FABRIC_BIN=${Conf.fabricBinRoot}/bin
TARGET=$PROJECT_ROOT/channel-artifacts/OrgsOrdererGenesis

export FABRIC_CFG_PATH=$PROJECT_ROOT

function fail () {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

which $FABRIC_BIN/configtxgen
fail "cryptogen tool not found. exiting"

if [ ! -d "$TARGET" ]; then
    mkdir $TARGET
fi


$FABRIC_BIN/configtxgen --profile OrgsOrdererGenesis -outputBlock $TARGET/genesis.block
fail "Failed to generate orderer genesis block..."


for CH in ${this.network.channels.map(x => `${x} `).join("")}
do
  # generate channel configuration transaction
  $FABRIC_BIN/configtxgen -profile OrgsChannel -outputCreateChannelTx $TARGET/$CH.tx -channelID $CH
  fail "Failed to generate $CH configuration transaction..."

  ${this.network.orgs.map(org => `
  $FABRIC_BIN/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate $TARGET/${org}Anchors.$CH.tx -channelID $CH -asOrg ${org}MSP
  fail "Failed to generate $CH anchor peer update for ${org}..."
  
  `).join("")}

done
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
