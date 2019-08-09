const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class NetworkCleanShGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "network-clean.sh");
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# start
FABRIC_VERSION=${Conf.fabricVersion}
THIRDPARTY_VERSION=${Conf.thirdPartyVersion}
PROJECT_ROOT=${this.params.path}
FABRIC_BIN=${Conf.fabricBinPath}/bin
export FABRIC_CFG_PATH=$PROJECT_ROOT

function fail() {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

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

docker-compose -f ${this.params.path}/docker-compose.yaml down --volumes --remove-orphans
# docker-compose -f ${this.params.path}/compose/docker-compose-cli.yaml down --volumes --remove-orphans
# docker-compose -f ${this.params.path}/compose/docker-compose-orderer.yaml down --volumes --remove-orphans
docker ps -a

clearContainers
removeUnwantedImages
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
