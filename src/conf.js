module.exports = {
    PROJECT_NAME: "blockchain-network",
    PROJECT_ROOT: "blockchain",
    FABRIC_VERSION: "1.4.1",
    THIRDPARTY_VERSION: "0.4.15",
    PROJECT_NETWORK_NAME: "net",

    FABRIC_BIN_ROOT: "~/fabric-samples",
    FABRIC_COMPOSER_XTYPE: "hlfv1",
    FABRIC_COMPOSER_ENABLE: true,

    ORDERER_DOMAIN: "biz.com",

    DOMAIN: "com",
    ORG_PREFIX: "org",
    PEER_PREFIX: "peer",
    USER_PREFIX: "user",
    CHANNEL_PREFIX: "channel",

    CA_ADMIN_ID: "admin",
    CA_ADMIN_PASSWORD: "adminpw",

    CHAINCODE_POLICY: "AND ('Org1MSP.peer')",
};
