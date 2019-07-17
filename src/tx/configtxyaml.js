const Logger = require("../util/logger");
const Conf = require("../conf");
const FileWrapper = require("../util/filewrapper");

module.exports = class ConfigTxYaml extends FileWrapper {
    constructor({ params, network }) {
        super(params.path, "configtx.yaml");

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
        MSPDir: crypto-config/ordererOrganizations/${Conf.ordererDomain}/msp
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
        MSPDir: crypto-config/peerOrganizations/${org}.${Conf.domain}/msp
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
            - Host: ${Conf.peerPrefix}0.${org}.${Conf.domain}
              Port: ${this.network.ports[org][`${Conf.peerPrefix}0`].ADDRESS}

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
        - orderer.${Conf.ordererDomain}:7050
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

    async save() {
        return this.writeFile(this.content);
    }
};
