const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class CreateCliShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "cli.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# export FABRIC_CLI_ROOT=/opt/gopath/src/github.com/hyperledger/fabric
# export ORDERER_CA=$FABRIC_CLI_ROOT/peer/crypto/ordererOrganizations/${Conf.ORDERER_DOMAIN}/orderers/orderer.${Conf.ORDERER_DOMAIN}/msp/tlscacerts/tlsca.${Conf.ORDERER_DOMAIN}-cert.pem
# export FABRIC_CFG_PATH=/etc/hyperledger/fabric

export LANGUAGE=node
export IMAGETAG="latest"
export TIMEOUT=10
export DELAY=3

function fail() {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

# execute create channel by cli
# inside docker directory 
docker exec --interactive cli /bin/bash -c 'scripts/create-channels.sh'

sleep $TIMEOUT

${this.network.orgs.map(org => `
    ${this.network.peers.map(peer => `
docker exec --interactive cli /bin/bash -c 'scripts/join-channels.sh ${peer} ${org}'
sleep $DELAY
    `).join("")}
`).join("")}

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
