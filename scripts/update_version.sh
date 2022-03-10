#!/usr/bin/env node

const {execSync} = require('child_process');

function cleanOutput(output){
  return output.toString().replace(/\s/g, '')
}

function execSyncClean(command) {
  return cleanOutput(execSync(command))
}


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


const notStagedLines = execSyncClean("git status --porcelain=v1 2>/dev/null | wc -l");
const branch = execSyncClean("git rev-parse --abbrev-ref HEAD");
if (branch !== 'develop') {
  console.error('You need to be on develop branch to create the release')
  console.error("HINT: git checkout develop");
  process.exit(1)
}
if (+notStagedLines) {
  console.error("You have unstaged changes. Staged them before creating a new release");
  process.exit(1)
}
const localDevelop = execSyncClean("git rev-parse HEAD");
const remoteDevelop = execSyncClean("git rev-parse origin/develop");
if (localDevelop !== remoteDevelop) {
  console.error("Your local branch must be on sync with remote develop branch'");
  console.error("HINT: git fetch && git reset --hard origin/develop");
  process.exit(1)
}
try {
    execSync(`npm version ${version}`);
    execSync(`git push origin HEAD:develop && git push origin v${version}`);
    console.info(`Successfully pushed new addon version "v${version}".`);
} catch (e) {
    console.error(
        (e.stderr && e.stderr.toString()) || (e.stdout && e.stdout.toString()) || e.toString()
    );
    throw e;
}
