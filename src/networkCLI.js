const Os = require("os");
const { resolve, join } = require("path");
const Logger = require("./logger");
const Conf = require("./conf");
const NetworkFolder = require("./networkfolder");
const ConfigTxYaml = require("./configtxyaml");
const CryptoConfigYaml = require("./cryptoconfigyaml");
const DockerComposer = require("./dockercomposer");
const CryptoShGenerator = require("./cryptoshgenerator");
const ChannelArtifactsShGenerator = require("./channelartifactsshgenerator");
const NetworkRestartShGenerator = require("./networkrestartshgenerator");
const NetworkCleanShGenerator = require("./networkcleanshgenerator");
const CreateChannelShGenerator = require("./createchannelshgenerator");
const JoinChannelShGenerator = require("./joinchannelshgenerator");
const UpdateAnchorShGenerator = require("./updateanchorshgenerator");
const CreateCliShGenerator = require("./createclishgenerator");
const CreateConnectionYamlGenerator = require("./createconnectionyamlgenerator");
const InstallChaincodeShGenerator = require("./installchaincodeshgenerator");
const ChaincodeCliShGenerator = require("./chaincodeclishgenerator");
const UpgradeChaincodeShGenerator = require("./upgradechaincodeshgenerator");
const SetEnvShGenerator = require("./setenvshgenerator");

module.exports = class NetworkCLI {
    // constructor() { }

    init({
        orgs = 2, peers = 2, users = 2, channels = 1, path = null, inside = false,
    }) {
        this.params = {
            orgs,
            peers,
            users,
            channels,
            path,
            inside,
        };
    }

    async initNetwork() {
        try {
            this.params.path = this.params.path
                ? resolve(Os.homedir(), this.params.path)
                : join(Os.homedir(), Conf.PROJECT_ROOT);

            await this.makeNetworkConfig();

            const networkFolder = new NetworkFolder({ params: this.params, network: this.network });
            await networkFolder.generate();

            // create configtx.yaml
            const configTxYaml = new ConfigTxYaml({ params: this.params, network: this.network });
            configTxYaml.print();
            configTxYaml.save();

            // create crypto-config.yaml
            const cryptoConfig = new CryptoConfigYaml({ params: this.params, network: this.network });
            cryptoConfig.print();
            cryptoConfig.save();

            // create crypto-config.sh
            const cryptoShGenerator = new CryptoShGenerator({ params: this.params, network: this.network });
            cryptoShGenerator.print();
            cryptoShGenerator.save();
            await cryptoShGenerator.execute();

            // create channel-artifacts.sh
            const channelArtifactsShGenerator = new ChannelArtifactsShGenerator({ params: this.params, network: this.network });
            channelArtifactsShGenerator.print();
            channelArtifactsShGenerator.save();
            await channelArtifactsShGenerator.execute();

            // create docker-composer.yaml
            const dockerComposer = new DockerComposer({ params: this.params, network: this.network });
            await dockerComposer.build();
            dockerComposer.print();
            await dockerComposer.save();

            // create network-restart.sh
            const networkRestartShGenerator = new NetworkRestartShGenerator({ params: this.params, network: this.network });
            networkRestartShGenerator.print();
            await networkRestartShGenerator.save();
            await networkRestartShGenerator.execute();

            // create network-clean.sh
            const networkCleanShGenerator = new NetworkCleanShGenerator({ params: this.params, network: this.network });
            networkCleanShGenerator.print();
            await networkCleanShGenerator.save();

            // create scripts/create-channels.sh
            const createChannelShGenerator = new CreateChannelShGenerator({ params: this.params, network: this.network });
            createChannelShGenerator.print();
            await createChannelShGenerator.save();

            // create scripts/join-channels.sh
            const joinChannelShGenerator = new JoinChannelShGenerator({ params: this.params, network: this.network });
            joinChannelShGenerator.print();
            await joinChannelShGenerator.save();

            // create scripts/update-anchor-peers.sh
            const updateAnchorShGenerator = new UpdateAnchorShGenerator({ params: this.params, network: this.network });
            updateAnchorShGenerator.print();
            await updateAnchorShGenerator.save();

            // create scripts/cli.sh
            const createCliShGenerator = new CreateCliShGenerator({ params: this.params, network: this.network });
            createCliShGenerator.print();
            await createCliShGenerator.save();
            await createCliShGenerator.execute();

            // create connections/org1_connection.yaml, connections/org1_connection.json connections/org1_AdminCard.sh
            const createConnectionYamlGenerator = new CreateConnectionYamlGenerator({ params: this.params, network: this.network });
            createConnectionYamlGenerator.print();
            await createConnectionYamlGenerator.save();
            await createConnectionYamlGenerator.executeAdminCard();


            // create scripts/install-chaincode.sh
            const installChaincodeShGenerator = new InstallChaincodeShGenerator({ params: this.params, network: this.network });
            installChaincodeShGenerator.print();
            await installChaincodeShGenerator.save();

            // create scripts/install-chaincode.sh
            const upgradeChaincodeShGenerator = new UpgradeChaincodeShGenerator({ params: this.params, network: this.network });
            upgradeChaincodeShGenerator.print();
            await upgradeChaincodeShGenerator.save();

            // create scripts/set-env.sh
            const setEnvShGenerator = new SetEnvShGenerator({ params: this.params, network: this.network });
            setEnvShGenerator.print();
            await setEnvShGenerator.save();
        } catch (e) {
            Logger.error(`initNetwork: ${e}`);
        }
    }


    async removeNetwork() {
        try {
            this.params.path = this.params.path
                ? resolve(Os.homedir(), this.params.path)
                : join(Os.homedir(), Conf.PROJECT_ROOT);

            // create network-restart
            const networkCleanShGenerator = new NetworkCleanShGenerator({ params: this.params, network: this.network });
            await networkCleanShGenerator.execute();
        } catch (e) {
            Logger.error(`removeNetwork: ${e}`);
        }
    }


    async makeNetworkConfig() {
        try {
            this.network = {
                orgs: [],
                ports: [],
                peers: [],
                users: [],
                channels: [],
            };

            let index = 0;

            for (let i = 0; i < this.params.orgs; i += 1) {
                this.network.orgs.push(`${Conf.ORG_PREFIX}${i + 1}`);

                index = (7 + i) * 1000 + 50;

                const port = [];
                for (let j = 0; j < this.params.peers; j += 1) {
                    port[`${Conf.PEER_PREFIX}${j}`] = {
                        ADDRESS: (index += 1),
                        // eslint-disable-next-line no-multi-assign
                        CHAINCODEADDRESS: (index += 1),
                        // eslint-disable-next-line no-multi-assign
                        COUCHDB: (index += 1),
                    };
                }

                // eslint-disable-next-line no-multi-assign
                port.CA = (index += 1);
                this.network.ports[`${Conf.ORG_PREFIX}${i + 1}`] = port;
            }

            Logger.debug(this.network.ports);

            for (let i = 0; i < this.params.peers; i += 1) {
                this.network.peers.push(`${Conf.PEER_PREFIX}${i}`);
            }
            for (let i = 0; i < this.params.users; i += 1) {
                this.network.users.push(`${Conf.USER_PREFIX}${i}`);
            }
            for (let i = 0; i < this.params.channels; i += 1) {
                this.network.channels.push(`${Conf.CHANNEL_PREFIX}${i}`);
            }
        } catch (e) {
            Logger.error(`makeNetworkConfig: ${e}`);
        }
    }


    async installChaincode({
        org,
        peer,
        channel,
        name,
        version,
        language,
        ctor,
        policy,
        path,
        instantiate,
    }) {
        try {
            this.params = {
                org,
                peer,
                channel,
                name,
                version,
                language,
                ctor,
                policy,
                path,
                instantiate,
            };

            this.params.path = this.params.path
                ? resolve(Os.homedir(), this.params.path)
                : join(Os.homedir(), Conf.PROJECT_ROOT);

            this.params.mode = "install";

            // create network-restart
            const chaincodeCliShGenerator = new ChaincodeCliShGenerator({ params: this.params });
            await chaincodeCliShGenerator.save();
            await chaincodeCliShGenerator.execute();
        } catch (e) {
            Logger.error(`installChaincode: ${e}`);
        }
    }

    async upgradeChaincode({
        org,
        peer,
        channel,
        name,
        version,
        language,
        ctor,
        policy,
        path,
    }) {
        try {
            this.params = {
                org,
                peer,
                channel,
                name,
                version,
                language,
                ctor,
                policy,
                path,
            };

            this.params.path = this.params.path
                ? resolve(Os.homedir(), this.params.path)
                : join(Os.homedir(), Conf.PROJECT_ROOT);

            this.params.mode = "upgrade";

            // create network-restart
            const chaincodeCliShGenerator = new ChaincodeCliShGenerator({ params: this.params });
            await chaincodeCliShGenerator.save();
            await chaincodeCliShGenerator.execute();
        } catch (e) {
            Logger.error(`installChaincode: ${e}`);
        }
    }
};
