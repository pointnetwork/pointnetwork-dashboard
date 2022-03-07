#!/usr/bin/env node

// - Leverages `npm version` script which creates a new tag
// - Updates package.json, adding this new version
// - Pushes the tag to the repository

const version = process.argv[2];

if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(
        `Unsupported version format: "${version}". ` +
            `Please provide a unique sequence of major, minor and build version identifiers.`
    );
}

const {execSync} = require('child_process');

try {
    execSync(`npm version ${version}`).toString();
    execSync(`git push && git push origin v${version}`).toString();
    console.info(`Successfully pushed new addon version "v${version}".`);
} catch (e) {
    console.error(
        (e.stderr && e.stderr.toString()) || (e.stdout && e.stdout.toString()) || e.toString()
    );
    throw e;
}
