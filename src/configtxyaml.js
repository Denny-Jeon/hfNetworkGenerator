const Logger = require("./logger");
const Conf = require("./conf");

module.exports = class ConfigTxYaml {
    constructor({ params, network }) {
        this.params = params;
        this.network = network;

        // eslint-disable
        this.content = `---
################################################################################
#
#   Section: Organizations
#
#   - This section defines the different organizational identities which will
#   be referenced later in the configuration.
#
################################################################################
Organizations:
    - &OrdererOrg
        Name: OrdererOrg
        ID: OrdererMSP
        MSPDir: crypto-config/ordererOrganizations/${Conf.ORDERER_DOMAIN}/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('OrdererMSP.admin')"

    ${this.network.orgs.map(org => `
    - &${org}
        Name: ${org}MSP
        ID: ${org}MSP
        MSPDir: crypto-config/peerOrganizations/${org}.${Conf.DOMAIN}/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('${org}MSP.admin', '${org}MSP.peer', '${org}MSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('${org}MSP.admin', '${org}MSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('${org}MSP.admin')"

        AnchorPeers:
            - Host: peer0.${org}.${Conf.DOMAIN}
            Port: 7051

    `).join("")}


################################################################################
#
#   SECTION: Capabilities
#
#   - This section defines the capabilities of fabric network. 
#
################################################################################

Capabilities:
    Channel: &ChannelCapabilities
        V1_3: true

    Orderer: &OrdererCapabilities
        V1_1: true

    Application: &ApplicationCapabilities
        V1_3: true
        V1_2: false
        V1_1: false


################################################################################
#
#   SECTION: Application
#
#   - This section defines the values to encode into a config transaction or
#   genesis block for application related parameters
#
################################################################################

Application: &ApplicationDefaults
    Organizations:

    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"

    Capabilities:
        <<: *ApplicationCapabilities


################################################################################
#
#   SECTION: Orderer
#
#   - This section defines the values to encode into a config transaction or
#   genesis block for orderer related parameters
#
################################################################################

Orderer: &OrdererDefaults
    OrdererType: solo
    Addresses:
        - orderer.${Conf.ORDERER_DOMAIN}:7050
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB

    #Kafka:
    #    Brokers:
    #        - 127.0.0.1:9092

    Organizations:

    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        BlockValidation:
            Type: ImplicitMeta
            Rule: "ANY Writers"


################################################################################
#
#   CHANNEL
#
#   This section defines the values to encode into a config transaction or
#   genesis block for channel related parameters.
#
################################################################################

Channel: &ChannelDefaults
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"

    Capabilities:
        <<: *ChannelCapabilities


################################################################################
#
#   Profile
#
#   - Different configuration profiles may be encoded here to be specified
#   as parameters to the configtxgen tool
#
################################################################################

Profiles:
    OrgsOrdererGenesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            OrgsConsortium:
                Organizations:
                    ${this.network.orgs.map(org => `- *${org}
                    `).join("")}

    OrgsChannel:
        Consortium: OrgsConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                ${this.network.orgs.map(org => `- *${org}
                `).join("")}
            Capabilities:
                <<: *ApplicationCapabilities
            `;
    }


    // eslint-enable
    print() {
        Logger.debug(this.content);
    }
};