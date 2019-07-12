const fs = require("fs");
const Logger = require("./logger");
const Conf = require("./conf");

module.exports = class NetworkRestartShGenerator {
    constructor({ params, network }) {
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `
#!/bin/bash
set +e

# clean
ITEMS=$(docker ps -a | awk '$2~/hyperledger/ {print $1}') 

if [ ! -z "$ITEMS" ]; then
    docker stop $(docker ps -a | awk '$2~/hyperledger/ {print $1}') 
    docker rm -f $(docker ps -a | awk '$2~/hyperledger/ {print $1}') $(docker ps -a | awk '{ print $1,$2 }' | grep dev-peer | awk '{print $1 }') || true
    docker rmi -f $(docker images | grep dev-peer | awk '{print $3}') || true
fi


# start
COMPOSER_PROJECT_NAME=${Conf.PROJECT_NETWORK_NAME}
FABRIC_VERSION=${Conf.FABRIC_VERSION}
THIRDPARTY_VERSION=${Conf.THIRDPARTY_VERSION}
PROJECT_ROOT=${Conf.PROJECT_ROOT}
FABRIC_BIN=${this.params.path}/fabric-binaries/${Conf.FABRIC_VERSION}/bin
PROJECT_ROOT=${this.params.path}
export FABRIC_CFG_PATH=$PROJECT_ROOT

function fail () {
    if [ "$?" -ne 0 ]; then
        echo $1
        exit 1
    fi
}

docker-compose -f ${this.params.path}/docker-compose.yaml up -d


        `;
    }


    // eslint-enable
    print() {
        Logger.debug(this.content);
    }
};
