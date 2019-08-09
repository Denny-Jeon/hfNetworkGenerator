const Os = require("os");
const { resolve, join } = require("path");
const Logger = require("../util/logger");
const Conf = require("../conf");
const NetworkFolder = require("./createfolder");
const ConfigTxYaml = require("../tx/configtxyaml");
const CryptoConfigYaml = require("../cryptoconfig/yaml");
const DockerComposer = require("../docker/dockercompose");
const CryptoShGenerator = require("../cryptoconfig/cryptoshgenerator");
const ChannelArtifactsShGenerator = require("../channel/artifactsshgenerator");
const NetworkRestartShGenerator = require("./restartshgenerator");
const NetworkCleanShGenerator = require("./cleanshgenerator");
const CreateChannelShGenerator = require("../channel/createshgenerator");
const JoinChannelShGenerator = require("../channel/joinshgenerator");
const UpdateAnchorShGenerator = require("../channel/updateanchorshgenerator");
const ChannelCliShGenerator = require("../channel/clishgenerator");
const CreateConnectionYamlGenerator = require("../connection/createyamlgenerator");
const InstallChaincodeShGenerator = require("../chaincode/installshgenerator");
const ChaincodeCliShGenerator = require("../chaincode/clishgenerator");
const UpgradeChaincodeShGenerator = require("../chaincode/upgradeshgenerator");
const SetEnvShGenerator = require("../cli/setenvshgenerator");
const SetGlobalsShGenerator = require("../cli/setglobalsshgenerator");
const SaveNetworkParams = require("./saveparams");


module.exports = class NetworkCLI {
    // constructor() { }

    init({
        orgs = 1, peers = 2, users = 2, channels = 1, path = null, inside = false,
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
                : join(Os.homedir(), Conf.projectRoot);

            await this.makeNetworkConfig();

            Logger.debug(this.network);
            Logger.debug(JSON.stringify(this.network));

            const networkFolder = new NetworkFolder({ params: this.params, network: this.network });
            await networkFolder.generate();

            // create configtx.yaml
            const configTxYaml = new ConfigTxYaml({ params: this.params, network: this.network });
            // configTxYaml.print();
            configTxYaml.save();

            // create crypto-config.yaml
            const cryptoConfig = new CryptoConfigYaml({ params: this.params, network: this.network });
            // cryptoConfig.print();
            cryptoConfig.save();

            // create crypto-config.sh
            const cryptoShGenerator = new CryptoShGenerator({ params: this.params, network: this.network });
            // cryptoShGenerator.print();
            cryptoShGenerator.save();
            await cryptoShGenerator.execute();

            // create channel-artifacts.sh
            const channelArtifactsShGenerator = new ChannelArtifactsShGenerator({ params: this.params, network: this.network });
            // channelArtifactsShGenerator.print();
            channelArtifactsShGenerator.save();
            await channelArtifactsShGenerator.execute();

            // create docker-composer.yaml
            const dockerComposer = new DockerComposer({ params: this.params, network: this.network });
            await dockerComposer.build();
            // dockerComposer.print();
            await dockerComposer.save();

            // create network-restart.sh
            const networkRestartShGenerator = new NetworkRestartShGenerator({ params: this.params, network: this.network });
            // networkRestartShGenerator.print();
            await networkRestartShGenerator.save();
            await networkRestartShGenerator.execute();

            // create network-clean.sh
            const networkCleanShGenerator = new NetworkCleanShGenerator({ params: this.params, network: this.network });
            // networkCleanShGenerator.print();
            await networkCleanShGenerator.save();

            // create scripts/set-globals.sh
            const setGlobalsShGenerator = new SetGlobalsShGenerator({ params: this.params, network: this.network });
            // setGlobalsShGenerator.print();
            await setGlobalsShGenerator.save();

            // create scripts/set-env.sh
            const setEnvShGenerator = new SetEnvShGenerator({ params: this.params, network: this.network });
            // setEnvShGenerator.print();
            await setEnvShGenerator.save();

            // create scripts/create-channels.sh
            const createChannelShGenerator = new CreateChannelShGenerator({ params: this.params, network: this.network });
            // createChannelShGenerator.print();
            await createChannelShGenerator.save();

            // create scripts/join-channels.sh
            const joinChannelShGenerator = new JoinChannelShGenerator({ params: this.params, network: this.network });
            // joinChannelShGenerator.print();
            await joinChannelShGenerator.save();

            // create scripts/update-anchor-peers.sh
            const updateAnchorShGenerator = new UpdateAnchorShGenerator({ params: this.params, network: this.network });
            updateAnchorShGenerator.print();
            await updateAnchorShGenerator.save();

            // create scripts/cli.sh
            const channelCliShGenerator = new ChannelCliShGenerator({ params: this.params, network: this.network });
            // channelCliShGenerator.print();
            await channelCliShGenerator.save();
            await channelCliShGenerator.execute();

            // create connections/org1_connection.yaml, connections/org1_connection.json connections/org1_AdminCard.sh
            const createConnectionYamlGenerator = new CreateConnectionYamlGenerator({ params: this.params, network: this.network });
            // createConnectionYamlGenerator.print();
            await createConnectionYamlGenerator.save();
            await createConnectionYamlGenerator.executeAdminCard();


            // create scripts/install-chaincode.sh
            const installChaincodeShGenerator = new InstallChaincodeShGenerator({ params: this.params, network: this.network });
            // installChaincodeShGenerator.print();
            await installChaincodeShGenerator.save();

            // create scripts/install-chaincode.sh
            const upgradeChaincodeShGenerator = new UpgradeChaincodeShGenerator({ params: this.params, network: this.network });
            // upgradeChaincodeShGenerator.print();
            await upgradeChaincodeShGenerator.save();

            // create ~/.hfng/projectname.json
            Logger.debug(JSON.stringify(this.network));
            const saveNetworkParams = new SaveNetworkParams({ params: this.params, network: this.network });
            await saveNetworkParams.save();
        } catch (e) {
            Logger.error(`initNetwork: ${e}`);
        }
    }


    async removeNetwork() {
        try {
            this.params.path = this.params.path
                ? resolve(Os.homedir(), this.params.path)
                : join(Os.homedir(), Conf.projectRoot);

            // create network-restart
            this.network = {
                orgs: [],
            };
            const networkCleanShGenerator = new NetworkCleanShGenerator({ params: this.params, network: this.network });
            await networkCleanShGenerator.execute();

            // delete ~/.hfng/prjectname.json
            const saveNetworkParams = new SaveNetworkParams({ params: this.params, network: this.network });
            await saveNetworkParams.delete();
        } catch (e) {
            Logger.error(`removeNetwork: ${e}`);
        }
    }


    async makeNetworkConfig() {
        try {
            this.network = {
                orgs: [],
                ports: {},
                peers: [],
                users: [],
                channels: [],
            };

            let index = 0;

            for (let i = 0; i < this.params.orgs; i += 1) {
                this.network.orgs.push(`${Conf.orgPrefix}${i + 1}`);

                index = (7 + i) * 1000 + 50;

                const port = {};
                for (let j = 0; j < this.params.peers; j += 1) {
                    port[`${Conf.peerPrefix}${j}`] = {
                        ADDRESS: (index += 1),
                        // eslint-disable-next-line no-multi-assign
                        CHAINCODEADDRESS: (index += 1),
                        // eslint-disable-next-line no-multi-assign
                        COUCHDB: (index += 1),
                    };
                }

                // eslint-disable-next-line no-multi-assign
                port.CA = (index += 1);
                this.network.ports[`${Conf.orgPrefix}${i + 1}`] = port;
            }

            for (let i = 0; i < this.params.peers; i += 1) {
                this.network.peers.push(`${Conf.peerPrefix}${i}`);
            }
            for (let i = 0; i < this.params.users; i += 1) {
                this.network.users.push(`${Conf.userPrefix}${i}`);
            }
            for (let i = 0; i < this.params.channels; i += 1) {
                this.network.channels.push(`${Conf.channelPrefix}${i}`);
            }

            Logger.debug(this.network);
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
                : join(Os.homedir(), Conf.projectRoot);

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
                : join(Os.homedir(), Conf.projectRoot);

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
