const FsExtra = require("fs-extra");
const Fs = require("fs");
const ShellJs = require("shelljs");
const AppRootPath = require("app-root-path");
const Logger = require("./logger");

module.exports = class FileWrapper {
    constructor(path, filename) {
        this.path = path;
        this.filename = `${path}/${filename}`;
    }

    createFolder(folderName = null) {
        const folder = folderName || this.path;

        Logger.debug("create folder: ", folder);

        return FsExtra.ensureDir(folder);
    }

    async execute(filename = null) {
        const sh = filename || this.filename;

        return new Promise((resolve, reject) => {
            ShellJs.exec(sh, { silent: false, shell: "/bin/bash" }, (code, stdout, err) => {
                if (code !== 0) reject(err);
                resolve(code);
            });
        });
    }

    clearFolder(folderName = null) {
        const folder = folderName || this.path;

        Logger.debug("clear folder: ", folder);

        return FsExtra.remove(folder);
    }

    writeFile(data, filename = null, options = null) {
        let file = this.filename;
        let option = { flag: "w+" };

        if (filename) file = filename;
        if (options != null) {
            option = options;
        }

        return Fs.writeFileSync(file, data, option);
    }

    copyExampleChaincode(src = `${AppRootPath}/src/examples/`) {
        return FsExtra.copySync(src, `${this.path}/chaincode/`);
    }

    async remove(filename = null) {
        if (filename) {
            await FsExtra.remove(filename);
        } else {
            await FsExtra.remove(this.filename);
        }
    }
};
