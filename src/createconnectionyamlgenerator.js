const JsYaml = require("yamljs");
const Logger = require("./logger");
const Conf = require("./conf");
const FileWrapper = require("./filewrapper");

module.exports = class CreateConnectionYamlGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, `connections/${Conf.ORG_PREFIX}1_connection.yaml`);
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `---
name: ${Conf.PROJECT_NAME}
${Conf.FABRIC_COMPOSER_XTYPE ? `x-type: ${Conf.FABRIC_COMPOSER_XTYPE}` : ""}
version: 1.0.0
client:
    organization: ${this.network.orgs[0]}
    connection:
        timeout:
            peer:
                endorser: '300'
            orderer: '300'
#channels:
${this.network.channels.map(ch => `
#    ${ch}:
#        orderers:
#            - orderer.${Conf.ORDERER_DOMAIN}
#        peers:
         ${this.network.orgs.map(org => `
             ${this.network.peers.map(peer => `
#            ${peer}.${org}.${Conf.DOMAIN}: {}
             `).join("")}
         `).join("")}
`).join("")}

channels:
    ${this.network.channels[0]}:
        orderers:
           - orderer.${Conf.ORDERER_DOMAIN}
        peers:
        ${this.network.orgs.map(org => `
            ${this.network.peers.map(peer => `
            ${peer}.${org}.${Conf.DOMAIN}: {}            
            `).join("")}
        `).join("")}

organizations:
    ${this.network.orgs.map(org => `
    ${org}:
        mspid: ${org}MSP
        peers:
            ${this.network.peers.map(peer => `
            - ${peer}.${org}.${Conf.DOMAIN}
            `).join("")}
        certificateAuthorities:
            - ca.${org}.${Conf.DOMAIN}
    `).join("")}
orderers:
    orderer.${Conf.ORDERER_DOMAIN}:
        url: grpcs://localhost:7050
        grpcOptions:
            ssl-target-name-override: orderer.${Conf.ORDERER_DOMAIN}
            grpc-max-send-message-length: -1
        tlsCACerts:
            path: "${this.params.path}/crypto-config/ordererOrganizations/${Conf.ORDERER_DOMAIN}/tlsca/tlsca.${Conf.ORDERER_DOMAIN}-cert.pem"
peers:
    ${this.network.orgs.map(org => `
        ${this.network.peers.map(peer => `
    ${peer}.${org}.${Conf.DOMAIN}:
        url: grpcs://localhost:${this.network.ports[org][peer].ADDRESS}
        tlsCACerts:
            path: "${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.DOMAIN}/tlsca/tlsca.${org}.${Conf.DOMAIN}-cert.pem"
        grpcOptions:
            ssl-target-name-override: ${peer}.${org}.${Conf.DOMAIN}
    `).join("")}
    `).join("")}
certificateAuthorities:
    ${this.network.orgs.map(org => `
    ca.${org}.${Conf.DOMAIN}:
        url: http://ca.${org}.${Conf.DOMAIN}:${this.network.ports[org].CA}
        caName: ca.${org}.${Conf.DOMAIN}
        httpOption:
            verify: false
    `).join("")}
`;
    }

    getAdminCardSh() {
        this.adminCard = `
#!/bin/bash

CRYPTO_CONFIG_KEYSTORE="${this.params.path}/crypto-config/peerOrganizations/${Conf.ORG_PREFIX}1.${Conf.DOMAIN}/users/Admin@${Conf.ORG_PREFIX}1.${Conf.DOMAIN}/msp/keystore"
ADMIN_CERTS="${this.params.path}/crypto-config/peerOrganizations/${Conf.ORG_PREFIX}1.${Conf.DOMAIN}/users/Admin@${Conf.ORG_PREFIX}1.${Conf.DOMAIN}/msp/admincerts/Admin@${Conf.ORG_PREFIX}1.${Conf.DOMAIN}-cert.pem"
KEY_FILENAME=\`ls "$CRYPTO_CONFIG_KEYSTORE"\`
PRIVATE_KEY="$CRYPTO_CONFIG_KEYSTORE/$KEY_FILENAME"
HL_COMPOSER_CLI=\`which composer\`

if [ -f "$PRIVATE_KEY"  ] && [ -f "$ADMIN_CERTS" ]; then
    echo $PRIVATE_KEY
    echo $ADMIN_CERTS

    "$HL_COMPOSER_CLI"  card delete -c PeerAdmin${Conf.ORG_PREFIX}1@${Conf.PROJECT_NAME}

    CARDOUTPUT=${this.params.path}/connections/PeerAdmin${Conf.ORG_PREFIX}1@${Conf.PROJECT_NAME}
    "$HL_COMPOSER_CLI"  card create -p ${this.params.path}/connections/${Conf.ORG_PREFIX}1_connection.json -u PeerAdmin${Conf.ORG_PREFIX}1 -c "$ADMIN_CERTS" -k "$PRIVATE_KEY" -r PeerAdmin -r ChannelAdmin --file $CARDOUTPUT
    "$HL_COMPOSER_CLI"  card import --file ${this.params.path}/connections/PeerAdmin${Conf.ORG_PREFIX}1@${Conf.PROJECT_NAME}.card
    "$HL_COMPOSER_CLI"  card list
    rm ${this.params.path}/connections/PeerAdmin${Conf.ORG_PREFIX}1@${Conf.PROJECT_NAME}.card
fi
        
`;
    }

    // eslint-enable
    print() {
        Logger.debug(this.content);
        Logger.debug(JSON.stringify(JsYaml.parse(this.content)));
    }


    async save() {
        this.writeFile(this.content);
        this.writeFile(JSON.stringify(JsYaml.parse(this.content), undefined, 4),
            `${this.params.path}/connections/${Conf.ORG_PREFIX}1_connection.json`);
        this.getAdminCardSh();
        return this.writeFile(this.adminCard,
            `${this.params.path}/connections/${Conf.ORG_PREFIX}1_AdminCard.sh`,
            {
                flag: "w+",
                mode: "0755",
            });
    }

    async executeAdminCard() {
        if (Conf.FABRIC_COMPOSER_ENABLE === true) {
            await this.execute(`${this.params.path}/connections/${Conf.ORG_PREFIX}1_AdminCard.sh`);
        }
    }
};
