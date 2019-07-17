#!/usr/bin/env node

const Program = require("commander");
const NetworkCLI = require("./network/cli");
const Logger = require("./util/logger");
const Conf = require("./conf");

const tasks = {
    async createNetwork({
        orgs = 1, peers = 2, users = 2, channels = 1, path = null, inside = false,
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
            await cli.initNetwork();
        } catch (e) {
            Logger.error(`createNetwork: ${e}`);
        }

        return cli;
    },
    async removeNetwork({
        path = null, inside = false,
    }) {
        const cli = new NetworkCLI();

        try {
            await cli.init({
                path,
                inside,
            });

            cli.removeNetwork();
        } catch (e) {
            Logger.error(`removeNetwork: ${e}`);
        }

        return cli;
    },
    async installChaincode({
        org,
        peer,
        channel = `${Conf.channelPrefix}0`,
        name = "hfchaincode",
        version = "1.0.0",
        language = "node",
        ctor = {},
        policy = {},
        path = null,
        instantiate = false,
    }) {
        const cli = new NetworkCLI();

        try {
            cli.installChaincode({
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
            });
        } catch (e) {
            Logger.error(`installChaincode: ${e}`);
        }

        return cli;
    },
    async upgradeChaincode({
        org,
        peer,
        channel = `${Conf.channelPrefix}0`,
        name = "hfchaincode",
        version = "1.1.0",
        language = "node",
        ctor = {},
        policy = {},
        path = null,
    }) {
        const cli = new NetworkCLI();

        try {
            cli.upgradeChaincode({
                org,
                peer,
                channel,
                name,
                version,
                language,
                ctor,
                policy,
                path,
            });
        } catch (e) {
            Logger.error(`installChaincode: ${e}`);
        }

        return cli;
    },
};

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
                orgs: (!cmd.organizations) ? 1 : cmd.organizations,
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

Program
    .command("clean")
    .option("-P, --path <path>", "Path to deploy the network")
    .option("-i, --inside", "Optimized for running inside the docker compose network")
    .action(async (cmd) => {
        if (cmd) {
            await tasks.removeNetwork({
                path: cmd.path,
                inside: (!!cmd.inside),
            });
        } else {
            await tasks.removeNetwork();
        }
    });


Program
    .command("installcc")
    .option("-o, --organization <organization>", "Organization of installed chaincode")
    .option("-p, --peer <peer>", "Peer of installed chaincode")
    .option("-C, --channel <channel>", "Channel for installed chaincode")
    .option("-n, --name <name>", "Name of the chaincode")
    .option("-v, --version <version>", "Version of chaincode")
    .option("-l, --language <language>", "Language the chaincode is written in (default 'golang')")
    .option("-c, --ctor <ctor>", "Constructor message for the chaincode in JSON format (default '{}')")
    .option("-y, --policy <policy>", "Chanincode policy")
    .option("-P, --path <path>", "Path to deploy the network")
    .option("-i, --instantiate", "Instantiate chaincode true or false")
    .action(async (cmd) => {
        if (cmd) {
            await tasks.installChaincode({
                org: cmd.organization,
                peer: cmd.peer,
                channel: cmd.channel,
                name: cmd.name,
                version: cmd.version,
                language: cmd.language,
                ctor: cmd.ctor,
                policy: cmd.policy,
                path: cmd.path,
                instantiate: cmd.instantiate && true,
            });
        } else {
            await tasks.installChaincode();
        }
    });


Program
    .command("upgradecc")
    .option("-o, --organization <organization>", "Organization of installed chaincode")
    .option("-p, --peer <peer>", "Peer of installed chaincode")
    .option("-C, --channel <channel>", "Channel for installed chaincode")
    .option("-n, --name <name>", "Name of the chaincode")
    .option("-v, --version <version>", "Version of chaincode")
    .option("-l, --language <language>", "Language the chaincode is written in (default 'golang')")
    .option("-c, --ctor <ctor>", "Constructor message for the chaincode in JSON format (default '{}')")
    .option("-y, --policy <policy>", "Chanincode policy")
    .option("-P, --path <path>", "Path to deploy the network")
    .action(async (cmd) => {
        if (cmd) {
            await tasks.upgradeChaincode({
                org: cmd.organization,
                peer: cmd.peer,
                channel: cmd.channel,
                name: cmd.name,
                version: cmd.version,
                language: cmd.language,
                ctor: cmd.ctor,
                policy: cmd.policy,
                path: cmd.path,
            });
        } else {
            await tasks.upgradeChaincode();
        }
    });

Program.parse(process.argv);
