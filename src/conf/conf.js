module.exports = env => ({
    projectName: env.PROJECT_NAME || "hfProject",
    projectRoot: env.PROJECT_ROOT || "hfNetwork",
    projectNetworkName: env.PROJECT_NETWORK_NAME || "net",

    fabricVersion: env.FABRIC_VERSION || "1.4.1",
    thirdPartyVersion: env.THIRDPARTY_VERSION || "0.4.15",
    fabricBinRoot: env.FABRIC_BIN_ROOT || "~/fabric-samples",
    fabricComposerXtype: env.FABRIC_COMPOSER_XTYPE || "hlfv1",
    fabricComposerEnable: (!!(env.FABRIC_COMPOSER_ENABLE
                && env.FABRIC_COMPOSER_ENABLE === "true")) || false,
    ordererDomain: env.ORDERER_DOMAIN || "hforderer.com",
    domain: env.DOMAIN || "com",
    orgPrefix: env.ORG_PREFIX || "org",
    peerPrefix: env.PEER_PREFIX || "peer",
    userPrefix: env.USER_PREFIX || "user",
    channelPrefix: env.CHANNEL_PREFIX || "channel",

    caAdminId: env.CA_ADMIN_ID || "admin",
    caAdminPassword: env.CA_ADMIN_PASSWORD || "adminpw",

    chaincodePolicy: env.CHAINCODE_POLICY || "{}",
});
