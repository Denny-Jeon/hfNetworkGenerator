const fs = require("fs");
const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

// const readdirAsync = (path, opts = "utf8") => new Promise((resolve, reject) => {
//     Logger.debug(path);
//     fs.readdir(path, opts, (err, data) => {
//         Logger.debug(err);
//         Logger.debug(data);
//         if (err) reject(err);
//         else resolve(data);
//     });
// });


module.exports = class DockerComposer extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "docker-compose.yaml");
        this.params = params;
        this.network = network;
        this.privateKey = [];
    }

    getPrivateKey() {
        return new Promise((resolve) => {
            this.network.orgs.map((org) => {
                const path = `${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.DOMAIN}/ca/`;
                const names = fs.readdirSync(path);
                const name = names.find(file => file.indexOf("_sk") !== -1);

                if (name) {
                    this.privateKey[org] = name;
                }
            });

            Logger.debug(`${this.privateKey.length} === ${this.network.orgs.length}`);
            if (Object.keys(this.privateKey).length === this.network.orgs.length) resolve(true);
            else throw new Error("not found private key");
        });
    }

    async build() {
        await this.getPrivateKey();

        Logger.debug(this.network.ports);
        Logger.debug(this.network.peers);

        // eslint-disable
        this.content = `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '2'

volumes:
  orderer.${Conf.ORDERER_DOMAIN}:
  ${this.network.orgs.map(org => `
  ca.${org}.${Conf.DOMAIN}:
  `).join("")}
  ${this.network.orgs.map(org => `
  ${this.network.peers.map(peer => `
  couchdb-${peer}.${org}:
  ${peer}.${org}.${Conf.DOMAIN}:
  `).join("")}
  `).join("")}

networks:
  hfn:

services:
  # orderer
  orderer.${Conf.ORDERER_DOMAIN}:
    image: hyperledger/fabric-orderer:${Conf.FABRIC_VERSION}
    container_name: orderer.${Conf.ORDERER_DOMAIN}
    environment:
      - FABRIC_LOGGING_SPEC=INFO
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_GENESISMETHOD=file
      - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      # enabled TLS
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
      - ORDERER_KAFKA_TOPIC_REPLICATIONFACTOR=1
      - ORDERER_KAFKA_VERBOSE=true
      - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
        - ${this.params.path}/channel-artifacts/OrgsOrdererGenesis/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
        - ${this.params.path}/crypto-config/ordererOrganizations/${Conf.ORDERER_DOMAIN}/orderers/orderer.${Conf.ORDERER_DOMAIN}/msp:/var/hyperledger/orderer/msp
        - ${this.params.path}/crypto-config/ordererOrganizations/${Conf.ORDERER_DOMAIN}/orderers/orderer.${Conf.ORDERER_DOMAIN}/tls/:/var/hyperledger/orderer/tls
        - orderer.${Conf.ORDERER_DOMAIN}:/var/hyperledger/production/orderer
    ports:
      - 7050:7050
    networks:
      - hfn
    
  ${this.network.orgs.map(org => `
  ca.${org}.${Conf.DOMAIN}:
    image: hyperledger/fabric-ca:${Conf.FABRIC_VERSION}
    container_name: ca.${org}.${Conf.DOMAIN}
    environment:
      - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
      - FABRIC_CA_SERVER_CA_NAME=ca.${org}.${Conf.DOMAIN}
      # - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_TLS_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.${org}.${Conf.DOMAIN}-cert.pem
      - FABRIC_CA_SERVER_TLS_KEYFILE=/etc/hyperledger/fabric-ca-server-config/${this.privateKey[org]}
    ports:
      - "${this.network.ports[org].CA}:${this.network.ports[org].CA}"
    command: sh -c 'fabric-ca-server start --ca.certfile /etc/hyperledger/fabric-ca-server-config/ca.${org}.${Conf.DOMAIN}-cert.pem --ca.keyfile /etc/hyperledger/fabric-ca-server-config/${this.privateKey[org]} -b ${Conf.CA_ADMIN_ID}:${Conf.CA_ADMIN_PASSWORD} -d'
    volumes:
      - ${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.DOMAIN}/ca/:/etc/hyperledger/fabric-ca-server-config   
    networks:
      - hfn
  `).join("")}

  ${this.network.orgs.map(org => `
  ${this.network.peers.map(peer => `
  couchdb-${peer}.${org}:
    container_name: couchdb-${peer}.${org}
    image: hyperledger/fabric-couchdb
    # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
    # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
    environment:
      - COUCHDB_USER=
      - COUCHDB_PASSWORD=ca0
    # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
    # for example map it to utilize Fauxton User Interface in dev environments.
    ports:
      - "${this.network.ports[org][peer].COUCHDB}:${this.network.ports[org][peer].COUCHDB}"
    networks:
      - hfn

  ${peer}.${org}.${Conf.DOMAIN}:
    image: hyperledger/fabric-peer:${Conf.FABRIC_VERSION}
    container_name: ${peer}.${org}.${Conf.DOMAIN}
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      # the following setting starts chaincode containers on the same
      # bridge network as the peers
      # https://docs.docker.com/compose/networking/
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${Conf.PROJECT_NETWORK_NAME}_hfn
      - FABRIC_LOGGING_SPEC=INFO
      #- FABRIC_LOGGING_SPEC=DEBUG
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      - CORE_PEER_ID= ${peer}.${org}.${Conf.DOMAIN}
      - CORE_PEER_ADDRESS= ${peer}.${org}.${Conf.DOMAIN}:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_LISTENADDRESS=0.0.0.0:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_CHAINCODEADDRESS= ${peer}.${org}.${Conf.DOMAIN}:${this.network.ports[org][peer].CHAINCODEADDRESS}
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${this.network.ports[org][peer].CHAINCODEADDRESS}
      ${this.network.peers.length <= 1 ? "# - CORE_PEER_GOSSIP_BOOTSTRAP="
        : `- CORE_PEER_GOSSIP_BOOTSTRAP=${peer === `${Conf.PEER_PREFIX}0`
            ? `${Conf.PEER_PREFIX}1.${org}.${Conf.DOMAIN}:${this.network.ports[org][`${Conf.PEER_PREFIX}1`].ADDRESS}`
            : `${Conf.PEER_PREFIX}0.${org}.${Conf.DOMAIN}:${this.network.ports[org][`${Conf.PEER_PREFIX}0`].ADDRESS}`}
      `}
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=${peer}.${org}.${Conf.DOMAIN}:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_LOCALMSPID=${org}MSP
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb-${peer}.${org}:${this.network.ports[org][peer].COUCHDB}
      # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
      # provide the credentials for ledger to connect to CouchDB.  The username and password must
      # match the username and password set for the associated CouchDB.
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
      - /var/run/:/host/var/run/
      - ${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.DOMAIN}/peers/${peer}.${org}.${Conf.DOMAIN}/msp:/etc/hyperledger/fabric/msp
      - ${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.DOMAIN}/peers/${peer}.${org}.${Conf.DOMAIN}/tls:/etc/hyperledger/fabric/tls
      - ${peer}.${org}.${Conf.DOMAIN}:/var/hyperledger/production
    ports:
      - ${this.network.ports[org][peer].ADDRESS}:${this.network.ports[org][peer].ADDRESS}
    depends_on:
      - couchdb-${peer}.${org}
    networks:
      - hfn
    `).join("")}

  ${org}.cli:
    container_name: ${org}.cli
    image: hyperledger/fabric-tools:${Conf.FABRIC_VERSION}
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=DEBUG
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=${org}.cli
      - CORE_PEER_ADDRESS=peer0.${org}.${Conf.DOMAIN}:${this.network.ports[org].peer0.ADDRESS}
      - CORE_PEER_LOCALMSPID=${org}MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/peers/peer0.${org}.${Conf.DOMAIN}/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/peers/peer0.${org}.${Conf.DOMAIN}/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/peers/peer0.${org}.${Conf.DOMAIN}/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${org}.${Conf.DOMAIN}/users/Admin@${org}.${Conf.DOMAIN}/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ${this.params.path}/chaincode/:/opt/gopath/src/github.com/chaincode
        - ${this.params.path}/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ${this.params.path}/scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/
        - ${this.params.path}/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    depends_on:
      - ca.${org}.${Conf.DOMAIN}
      - orderer.${Conf.ORDERER_DOMAIN}
      - peer0.${org}.${Conf.DOMAIN}
    networks:
      - hfn  
    `).join("")}
`;
    }

    // eslint-enable
    print() {
        Logger.debug(this.content);
    }

    async save() {
        return this.writeFile(this.content);
    }
};
