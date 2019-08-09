const fs = require("fs");
const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

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
                const path = `${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.domain}/ca/`;
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
        this.orderers = `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '3.5'

volumes:
  orderer.${Conf.ordererDomain}:

networks:
  hfn:
    # must space
    name: ${Conf.projectNetworkName}_hfn

services:
  # orderer
  orderer.${Conf.ordererDomain}:
    image: hyperledger/fabric-orderer:${Conf.fabricVersion}
    container_name: orderer.${Conf.ordererDomain}
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
        - ../channel-artifacts/OrgsOrdererGenesis/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
        - ../crypto-config/ordererOrganizations/${Conf.ordererDomain}/orderers/orderer.${Conf.ordererDomain}/msp:/var/hyperledger/orderer/msp
        - ../crypto-config/ordererOrganizations/${Conf.ordererDomain}/orderers/orderer.${Conf.ordererDomain}/tls/:/var/hyperledger/orderer/tls
        - orderer.${Conf.ordererDomain}:/var/hyperledger/production/orderer
    ports:
      - 7050:7050
    networks:
      - hfn
`;

        this.contents = this.network.orgs.map(org => `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '3.5'

volumes:
  ca.${org}.${Conf.domain}:
  ${this.network.peers.map(peer => `
  # couchdb-${peer}.${org}.${Conf.domain}:
  ${peer}.${org}.${Conf.domain}:
  `).join("")}

networks:
  hfn:
    # must space
    name: ${Conf.projectNetworkName}_hfn

services:
  ca.${org}.${Conf.domain}:
    image: hyperledger/fabric-ca:${Conf.fabricVersion}
    container_name: ca.${org}.${Conf.domain}
    environment:
      - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
      - FABRIC_CA_SERVER_CA_NAME=ca.${org}.${Conf.domain}
      # - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_TLS_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.${org}.${Conf.domain}-cert.pem
      - FABRIC_CA_SERVER_TLS_KEYFILE=/etc/hyperledger/fabric-ca-server-config/${this.privateKey[org]}
    ports:
      - "${this.network.ports[org].CA}:7054"
    command: sh -c 'fabric-ca-server start --ca.certfile /etc/hyperledger/fabric-ca-server-config/ca.${org}.${Conf.domain}-cert.pem --ca.keyfile /etc/hyperledger/fabric-ca-server-config/${this.privateKey[org]} -b ${Conf.caAdminId}:${Conf.caAdminPassword} -d'
    volumes:
      - ../crypto-config/peerOrganizations/${org}.${Conf.domain}/ca/:/etc/hyperledger/fabric-ca-server-config   
    networks:
      - hfn

  ${this.network.peers.map(peer => `
  couchdb-${peer}.${org}.${Conf.domain}:
    container_name: couchdb-${peer}.${org}.${Conf.domain}
    image: hyperledger/fabric-couchdb
    # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
    # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
    environment:
      - COUCHDB_USER=
      - COUCHDB_PASSWORD=ca0
    # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
    # for example map it to utilize Fauxton User Interface in dev environments.
    ports:
      - "${this.network.ports[org][peer].COUCHDB}:5984"
    networks:
      - hfn

  ${peer}.${org}.${Conf.domain}:
    image: hyperledger/fabric-peer:${Conf.fabricVersion}
    container_name: ${peer}.${org}.${Conf.domain}
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      # the following setting starts chaincode containers on the same
      # bridge network as the peers
      # https://docs.docker.com/compose/networking/
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${Conf.projectNetworkName}_hfn
      - FABRIC_LOGGING_SPEC=INFO
      #- FABRIC_LOGGING_SPEC=DEBUG
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      # must not space
      - CORE_PEER_ID=${peer}.${org}.${Conf.domain}
      - CORE_PEER_ADDRESS=${peer}.${org}.${Conf.domain}:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_LISTENADDRESS=0.0.0.0:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_CHAINCODEADDRESS=${peer}.${org}.${Conf.domain}:${this.network.ports[org][peer].CHAINCODEADDRESS}
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${this.network.ports[org][peer].CHAINCODEADDRESS}
      ${this.network.peers.length <= 1 ? "# - CORE_PEER_GOSSIP_BOOTSTRAP="
        : `- CORE_PEER_GOSSIP_BOOTSTRAP=${peer === `${Conf.peerPrefix}0`
            ? `${Conf.peerPrefix}1.${org}.${Conf.domain}:${this.network.ports[org][`${Conf.peerPrefix}1`].ADDRESS}`
            : `${Conf.peerPrefix}0.${org}.${Conf.domain}:${this.network.ports[org][`${Conf.peerPrefix}0`].ADDRESS}`}
      `}
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=${peer}.${org}.${Conf.domain}:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_LOCALMSPID=${org}MSP
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb-${peer}.${org}.${Conf.domain}:5984
      # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
      # provide the credentials for ledger to connect to CouchDB.  The username and password must
      # match the username and password set for the associated CouchDB.
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
      - /var/run/:/host/var/run/
      - ../crypto-config/peerOrganizations/${org}.${Conf.domain}/peers/${peer}.${org}.${Conf.domain}/msp:/etc/hyperledger/fabric/msp
      - ../crypto-config/peerOrganizations/${org}.${Conf.domain}/peers/${peer}.${org}.${Conf.domain}/tls:/etc/hyperledger/fabric/tls
      - ${peer}.${org}.${Conf.domain}:/var/hyperledger/production
    ports:
      - ${this.network.ports[org][peer].ADDRESS}:${this.network.ports[org][peer].ADDRESS}
    depends_on:
      - couchdb-${peer}.${org}.${Conf.domain}
    networks:
      - hfn
    `).join("")}     
`);


        this.cli = `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '3.5'

networks:
  hfn:
    # must space
    name: ${Conf.projectNetworkName}_hfn

services:
  cli-${Conf.projectNetworkName}:
    container_name: cli-${Conf.projectNetworkName}
    image: hyperledger/fabric-tools:${Conf.fabricVersion}
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=DEBUG
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli-${Conf.projectNetworkName}
      - CORE_PEER_ADDRESS=peer0.${Conf.orgPrefix}1.${Conf.domain}:${this.network.ports[`${Conf.orgPrefix}1`].peer0.ADDRESS}
      - CORE_PEER_LOCALMSPID=${Conf.orgPrefix}1MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/peers/peer0.${Conf.orgPrefix}1.${Conf.domain}/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/peers/peer0.${Conf.orgPrefix}1.${Conf.domain}/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/peers/peer0.${Conf.orgPrefix}1.${Conf.domain}/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/users/Admin@${Conf.orgPrefix}1.${Conf.domain}/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ../chaincode/:/opt/gopath/src/github.com/chaincode
        - ../crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ../scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/
        - ../channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    networks:
      - hfn 
`;

        this.content = `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '3.5'

volumes:
  orderer.${Conf.ordererDomain}:
  ${this.network.orgs.map(org => `
  ca.${org}.${Conf.domain}:
  `).join("")}
  ${this.network.orgs.map(org => `
  ${this.network.peers.map(peer => `
  # couchdb-${peer}.${org}.${Conf.domain}:
  ${peer}.${org}.${Conf.domain}:
  `).join("")}
  `).join("")}

networks:
  hfn:
    # must space
    name: ${Conf.projectNetworkName}_hfn

services:
  # orderer
  orderer.${Conf.ordererDomain}:
    image: hyperledger/fabric-orderer:${Conf.fabricVersion}
    container_name: orderer.${Conf.ordererDomain}
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
        - ./channel-artifacts/OrgsOrdererGenesis/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
        - ./crypto-config/ordererOrganizations/${Conf.ordererDomain}/orderers/orderer.${Conf.ordererDomain}/msp:/var/hyperledger/orderer/msp
        - ./crypto-config/ordererOrganizations/${Conf.ordererDomain}/orderers/orderer.${Conf.ordererDomain}/tls/:/var/hyperledger/orderer/tls
        - orderer.${Conf.ordererDomain}:/var/hyperledger/production/orderer
    ports:
      - 7050:7050
    networks:
      - hfn
    
  ${this.network.orgs.map(org => `
  ca.${org}.${Conf.domain}:
    image: hyperledger/fabric-ca:${Conf.fabricVersion}
    container_name: ca.${org}.${Conf.domain}
    environment:
      - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
      - FABRIC_CA_SERVER_CA_NAME=ca.${org}.${Conf.domain}
      # - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_TLS_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.${org}.${Conf.domain}-cert.pem
      - FABRIC_CA_SERVER_TLS_KEYFILE=/etc/hyperledger/fabric-ca-server-config/${this.privateKey[org]}
    ports:
      - "${this.network.ports[org].CA}:7054"
    command: sh -c 'fabric-ca-server start --ca.certfile /etc/hyperledger/fabric-ca-server-config/ca.${org}.${Conf.domain}-cert.pem --ca.keyfile /etc/hyperledger/fabric-ca-server-config/${this.privateKey[org]} -b ${Conf.caAdminId}:${Conf.caAdminPassword} -d'
    volumes:
      - ./crypto-config/peerOrganizations/${org}.${Conf.domain}/ca/:/etc/hyperledger/fabric-ca-server-config   
    networks:
      - hfn
  `).join("")}

  ${this.network.orgs.map(org => `
  ${this.network.peers.map(peer => `
  couchdb-${peer}.${org}.${Conf.domain}:
    container_name: couchdb-${peer}.${org}.${Conf.domain}
    image: hyperledger/fabric-couchdb
    # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
    # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
    environment:
      - COUCHDB_USER=
      - COUCHDB_PASSWORD=ca0
    # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
    # for example map it to utilize Fauxton User Interface in dev environments.
    ports:
      - "${this.network.ports[org][peer].COUCHDB}:5984"
    networks:
      - hfn

  ${peer}.${org}.${Conf.domain}:
    image: hyperledger/fabric-peer:${Conf.fabricVersion}
    container_name: ${peer}.${org}.${Conf.domain}
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      # the following setting starts chaincode containers on the same
      # bridge network as the peers
      # https://docs.docker.com/compose/networking/
      - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${Conf.projectNetworkName}_hfn
      - FABRIC_LOGGING_SPEC=INFO
      #- FABRIC_LOGGING_SPEC=DEBUG
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      # must not space
      - CORE_PEER_ID=${peer}.${org}.${Conf.domain}
      - CORE_PEER_ADDRESS=${peer}.${org}.${Conf.domain}:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_LISTENADDRESS=0.0.0.0:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_CHAINCODEADDRESS=${peer}.${org}.${Conf.domain}:${this.network.ports[org][peer].CHAINCODEADDRESS}
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${this.network.ports[org][peer].CHAINCODEADDRESS}
      ${this.network.peers.length <= 1 ? "# - CORE_PEER_GOSSIP_BOOTSTRAP="
        : `- CORE_PEER_GOSSIP_BOOTSTRAP=${peer === `${Conf.peerPrefix}0`
            ? `${Conf.peerPrefix}1.${org}.${Conf.domain}:${this.network.ports[org][`${Conf.peerPrefix}1`].ADDRESS}`
            : `${Conf.peerPrefix}0.${org}.${Conf.domain}:${this.network.ports[org][`${Conf.peerPrefix}0`].ADDRESS}`}
      `}
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=${peer}.${org}.${Conf.domain}:${this.network.ports[org][peer].ADDRESS}
      - CORE_PEER_LOCALMSPID=${org}MSP
      - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
      - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb-${peer}.${org}.${Conf.domain}:5984
      # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
      # provide the credentials for ledger to connect to CouchDB.  The username and password must
      # match the username and password set for the associated CouchDB.
      - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
      - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
      - /var/run/:/host/var/run/
      - ./crypto-config/peerOrganizations/${org}.${Conf.domain}/peers/${peer}.${org}.${Conf.domain}/msp:/etc/hyperledger/fabric/msp
      - ./crypto-config/peerOrganizations/${org}.${Conf.domain}/peers/${peer}.${org}.${Conf.domain}/tls:/etc/hyperledger/fabric/tls
      - ${peer}.${org}.${Conf.domain}:/var/hyperledger/production
    ports:
      - ${this.network.ports[org][peer].ADDRESS}:${this.network.ports[org][peer].ADDRESS}
    depends_on:
      - couchdb-${peer}.${org}.${Conf.domain}
    networks:
      - hfn
    `).join("")}
    `).join("")}

  cli-${Conf.projectNetworkName}:
    container_name: cli-${Conf.projectNetworkName}
    image: hyperledger/fabric-tools:${Conf.fabricVersion}
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - FABRIC_LOGGING_SPEC=DEBUG
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli-${Conf.projectNetworkName}
      - CORE_PEER_ADDRESS=peer0.${Conf.orgPrefix}1.${Conf.domain}:${this.network.ports[`${Conf.orgPrefix}1`].peer0.ADDRESS}
      - CORE_PEER_LOCALMSPID=${Conf.orgPrefix}1MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/peers/peer0.${Conf.orgPrefix}1.${Conf.domain}/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/peers/peer0.${Conf.orgPrefix}1.${Conf.domain}/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/peers/peer0.${Conf.orgPrefix}1.${Conf.domain}/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/users/Admin@${Conf.orgPrefix}1.${Conf.domain}/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ./chaincode/:/opt/gopath/src/github.com/chaincode
        - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ./scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/
        - ./channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    depends_on:
      - ca.${Conf.orgPrefix}1.${Conf.domain}
      - orderer.${Conf.ordererDomain}
      - peer0.${Conf.orgPrefix}1.${Conf.domain}
    networks:
      - hfn  
`;
    }

    // eslint-enable
    print() {
        Logger.debug(this.content);
    }

    async save() {
        this.writeFile(this.cli, `${this.params.path}/compose/docker-compose-cli.yaml`);
        this.writeFile(this.orderers, `${this.params.path}/compose/docker-compose-orderer.yaml`);
        this.contents.map((content, index) => this.writeFile(content, `${this.params.path}/compose/docker-compose-${this.network.orgs[index]}.yaml`));

        this.writeFile(this.content);
    }
};
