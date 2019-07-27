"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
exports.TranspileTypescript = (paths, outDir) => {
    return new Promise(resolve => {
        const child = child_process_1.spawn('npx', [
            'gapi',
            'build',
            '--glob',
            `${paths.toString()}`,
            '--outDir',
            outDir
        ]);
        // child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
        child.on('close', code => {
            if (code !== 0) {
                throw new Error();
            }
            resolve();
        });
    });
};
