const Os = require("os");
const { resolve, join } = require("path");
const Logger = require("./logger");
const Conf = require("./conf");
const ConfigTxYaml = require("./configtxyaml");
const CryptoConfig = require("./cryptoconfig");
const DockerComposer = require("./dockercomposer");
const CryptoShGenerator = require("./cryptoshgenerator");
const ChannelArtifactsShGenerator = require("./channelartifactsshgenerator");


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

        this.initNetwork();
    }

    async initNetwork() {
        try {
            this.params.path = this.params.path
                ? resolve(Os.homedir(), this.params.path)
                : join(Os.homedir(), Conf.FABRIC_NETWORK_ROOT);

            await this.makeNetworkConfig();

            // create configtx
            const configTxYaml = new ConfigTxYaml({ params: this.params, network: this.network });
            configTxYaml.print();

            // create crypto-config
            const cryptoConfig = new CryptoConfig({ params: this.params, network: this.network });
            cryptoConfig.print();

            // create docker-composer
            const dockerComposer = new DockerComposer({ params: this.params, network: this.network });
            dockerComposer.build();
            dockerComposer.print();


            // create crypto-config.sh
            const cryptoShGenerator = new CryptoShGenerator({ params: this.params, network: this.network });
            cryptoShGenerator.print();

            // create channel-artifacts
            const channelArtifactsShGenerator = new ChannelArtifactsShGenerator({ params: this.params, network: this.network });
            channelArtifactsShGenerator.print();
        } catch (e) {
            Logger.error(`initNetwork: ${e}`);
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
};
