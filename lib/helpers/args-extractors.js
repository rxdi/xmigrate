"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.includes = (i) => process.argv.toString().includes(i);
exports.nextOrDefault = (i, fb = true, type = (p) => p) => {
    if (process.argv.toString().includes(i)) {
        const isNextArgumentPresent = process.argv[process.argv.indexOf(i) + 1];
        if (!isNextArgumentPresent) {
            return fb;
        }
        if (isNextArgumentPresent.includes('--')) {
            return fb;
        }
        return type(isNextArgumentPresent);
    }
    return fb;
};
