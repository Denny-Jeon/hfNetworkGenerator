#!/usr/bin/env node

const Program = require("commander");
const NetworkCLI = require("./networkCLI");
const Logger = require("./logger");

const tasks = {
    async createNetwork({
        orgs = 2, peers = 2, users = 2, channels = 1, path = null, inside = false,
    }) {
        const cli = new NetworkCLI();

        try {
            await cli.init({
                orgs: Number.parseInt(orgs, 10),
                peers: Number.parseInt(peers, 10),
                users: Number.parseInt(users, 10),
                channels: Number.parseInt(channels, 10),
                path,
                inside,
            });
        } catch (e) {
            Logger.error(`createNetwork: ${e}`);
        }

        return cli;
    },
    async removerNetowrk() {
        return null;
    },
};

Logger.debug("start");

Program
    .command("new")
    .option("-c, --channels <channels>", "Channels in the network")
    .option("-o, --organizations <organizations>", "Amount of organizations")
    .option("-u, --users <users>", "Users per organization")
    .option("-p, --peers <peers>", "Peers per organization")
    .option("-P, --path <path>", "Path to deploy the network")
    .option("-i, --inside", "Optimized for running inside the docker compose network")
    .action(async (cmd) => {
        if (cmd) {
            await tasks.createNetwork({
                orgs: (!cmd.organizations || (cmd.organizations <= 2) ? 2 : cmd.organizations),
                peers: (!cmd.peers || (cmd.peers <= 1) ? 1 : cmd.peers),
                users: (!cmd.users || (cmd.users <= 1) ? 1 : cmd.users),
                channels: (!cmd.channels || (cmd.channels <= 1) ? 1 : cmd.channels),
                path: cmd.path,
                inside: (!!cmd.inside),
            });
        } else {
            await tasks.createNetwork();
        }
    });

Program.parse(process.argv);
