const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class NetworkRestartShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "network-restart.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# clean
# ITEMS=$(docker ps -a | awk '$2~/hyperledger/ {print $1}') 

# if [ ! -z "$ITEMS" ]; then
#    docker stop $(docker ps -a | awk '$2~/hyperledger/ {print $1}') 
#    docker rm -f $(docker ps -a | awk '$2~/hyperledger/ {print $1}') $(docker ps -a | awk '{ print $1,$2 }' | grep dev-peer | awk '{print $1 }') || true
#    docker rmi -f $(docker images | grep dev-peer | awk '{print $3}') || true
# fi


function clearContainers() {
    ${this.network.orgs.map(org => `
    CONTAINER_IDS=$(docker ps -a | awk '($2 ~ /dev-peer*.${org}.${Conf.domain}/) {print $1}')
    if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
      echo "---- No containers available for deletion ----"
    else
      docker rm -f $CONTAINER_IDS
    fi
    `).join("")}
}

function removeUnwantedImages() {
    ${this.network.orgs.map(org => `
    DOCKER_IMAGE_IDS=$(docker images | awk '($1 ~ /dev-peer*.${org}.${Conf.domain}/) {print $3}')
    if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" == " " ]; then
        echo "---- No images available for deletion ----"
    else
        docker rmi -f $DOCKER_IMAGE_IDS
    fi
    `).join("")}
}


clearContainers
removeUnwantedImages


# start
COMPOSER_PROJECT_NAME=${Conf.projectNetworkName}
FABRIC_VERSION=${Conf.fabricVersion}
THIRDPARTY_VERSION=${Conf.thirdPartyVersion}
PROJECT_ROOT=${this.params.path}
FABRIC_BIN=${Conf.fabricBinRoot}/bin
export FABRIC_CFG_PATH=$PROJECT_ROOT

function fail() {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

docker-compose -f ${this.params.path}/docker-compose.yaml up -d
# docker-compose -f ${this.params.path}/compose/docker-compose-cli.yaml up -d
# docker-compose -f ${this.params.path}/compose/docker-compose-orderer.yaml up -d
${this.network.orgs.map((org, index) => `
${index === 0 ? `# docker-compose -f ${this.params.path}/compose/docker-compose-${org}.yaml up -d`
        : `# docker-compose -f ${this.params.path}/compose/docker-compose-${org}.yaml up -d`}

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
