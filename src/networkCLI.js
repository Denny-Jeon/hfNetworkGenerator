// import Os from "os";
// import { resolve, join } from "path";
// import Logger from "./logger";
// import * as Conf from "./conf";
// import ConfigTxYaml from "./configtxyaml";

const Os = require("os");
const { resolve, join } = require("path");
const Logger = require("./logger");
const Conf = require("./conf");
const ConfigTxYaml = require("./configtxyaml");


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
                : join(Os.homedir(), Conf.HyperledgerFabricNetworkRoot);

            await this.makeNetworkConfig();

            // make
            const configTxYaml = new ConfigTxYaml({ params: this.params, network: this.network });
            configTxYaml.print();
        } catch (e) {
            Logger.error(`initNetwork: ${e}`);
        }
    }

    async makeNetworkConfig() {
        try {
            this.network = {
                orgs: [],
                peers: [],
                users: [],
                channels: [],
            };

            for (let i = 0; i < this.params.orgs; i += 1) {
                this.network.orgs.push(`${Conf.ORG_PREFIX}${i + 1}`);
            }
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
