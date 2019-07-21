const JsYaml = require("yamljs");
const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class CreateConnectionYamlGenerator extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, `connections/${Conf.orgPrefix}1_connection.yaml`);
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `---
name: ${Conf.projectName}
x-type: ${Conf.fabricComposerXtype}
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
#            - orderer.${Conf.ordererDomain}
#        peers:
         ${this.network.orgs.map(org => `
             ${this.network.peers.map(peer => `
#            ${peer}.${org}.${Conf.domain}: {}
             `).join("")}
         `).join("")}
`).join("")}

channels:
    ${this.network.channels[0]}:
        orderers:
           - orderer.${Conf.ordererDomain}
        peers:
        ${this.network.orgs.map(org => `
            ${this.network.peers.map(peer => `
            ${peer}.${org}.${Conf.domain}: {}            
            `).join("")}
        `).join("")}

organizations:
    ${this.network.orgs.map(org => `
    ${org}:
        mspid: ${org}MSP
        peers:
            ${this.network.peers.map(peer => `
            - ${peer}.${org}.${Conf.domain}
            `).join("")}
        certificateAuthorities:
            - ca.${org}.${Conf.domain}
    `).join("")}
orderers:
    orderer.${Conf.ordererDomain}:
        url: grpcs://localhost:7050
        grpcOptions:
            ssl-target-name-override: orderer.${Conf.ordererDomain}
            grpc-max-send-message-length: -1
        tlsCACerts:
            path: "${this.params.path}/crypto-config/ordererOrganizations/${Conf.ordererDomain}/tlsca/tlsca.${Conf.ordererDomain}-cert.pem"
peers:
    ${this.network.orgs.map(org => `
        ${this.network.peers.map(peer => `
    ${peer}.${org}.${Conf.domain}:
        url: grpcs://localhost:${this.network.ports[org][peer].ADDRESS}
        tlsCACerts:
            path: "${this.params.path}/crypto-config/peerOrganizations/${org}.${Conf.domain}/tlsca/tlsca.${org}.${Conf.domain}-cert.pem"
        grpcOptions:
            ssl-target-name-override: ${peer}.${org}.${Conf.domain}
    `).join("")}
    `).join("")}
certificateAuthorities:
    ${this.network.orgs.map(org => `
    ca.${org}.${Conf.domain}:
        url: http://localhost:${this.network.ports[org].CA}
        caName: ca.${org}.${Conf.domain}
        httpOption:
            verify: false
    `).join("")}
`;
    }

    getAdminCardSh() {
        this.adminCard = `
#!/bin/bash

CRYPTO_CONFIG_KEYSTORE="${this.params.path}/crypto-config/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/users/Admin@${Conf.orgPrefix}1.${Conf.domain}/msp/keystore"
ADMIN_CERTS="${this.params.path}/crypto-config/peerOrganizations/${Conf.orgPrefix}1.${Conf.domain}/users/Admin@${Conf.orgPrefix}1.${Conf.domain}/msp/admincerts/Admin@${Conf.orgPrefix}1.${Conf.domain}-cert.pem"
KEY_FILENAME=\`ls "$CRYPTO_CONFIG_KEYSTORE"\`
PRIVATE_KEY="$CRYPTO_CONFIG_KEYSTORE/$KEY_FILENAME"
HL_COMPOSER_CLI=\`which composer\`

if [ -f "$PRIVATE_KEY"  ] && [ -f "$ADMIN_CERTS" ]; then
    echo $PRIVATE_KEY
    echo $ADMIN_CERTS

    "$HL_COMPOSER_CLI"  card delete -c PeerAdmin${Conf.orgPrefix}1@${Conf.projectName}

    CARDOUTPUT=${this.params.path}/connections/PeerAdmin${Conf.orgPrefix}1@${Conf.projectName}
    "$HL_COMPOSER_CLI"  card create -p ${this.params.path}/connections/${Conf.orgPrefix}1_connection.json -u PeerAdmin${Conf.orgPrefix}1 -c "$ADMIN_CERTS" -k "$PRIVATE_KEY" -r PeerAdmin -r ChannelAdmin --file $CARDOUTPUT
    "$HL_COMPOSER_CLI"  card import --file ${this.params.path}/connections/PeerAdmin${Conf.orgPrefix}1@${Conf.projectName}.card
    "$HL_COMPOSER_CLI"  card list
    rm ${this.params.path}/connections/PeerAdmin${Conf.orgPrefix}1@${Conf.projectName}.card
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
            `${this.params.path}/connections/${Conf.orgPrefix}1_connection.json`);
        this.getAdminCardSh();
        return this.writeFile(this.adminCard,
            `${this.params.path}/connections/${Conf.orgPrefix}1_AdminCard.sh`,
            {
                flag: "w+",
                mode: "0755",
            });
    }

    async executeAdminCard() {
        if (Conf.fabricComposerEnable) {
            await this.execute(`${this.params.path}/connections/${Conf.orgPrefix}1_AdminCard.sh`);
        }
    }
};
