#!/usr/bin/env node

// import * as dotenv from 'dotenv';
const dotenv = require('dotenv');
const axios = require('axios');
const yargs = require('yargs');
// import axios from 'axios';

dotenv.config({path: '.env'});

const argv = yargs
    // .command('lyr', 'Tells whether an year is leap year or not', {
    //     year: {
    //         description: 'the year to check for',
    //         alias: 'y',
    //         type: 'number'
    //     }
    // })
    .option('include-drafts', {
        alias: 'id',
        description: 'Include drafts in releases',
        type: 'boolean'
    })
    .option('date', {
        alias: 'd',
        description: 'Date for the release combination',
        type: 'string'
    })
    .help()
    .alias('help', 'h').argv;

// const testReleasesDate = process.env.TEST_RELEASES_DATE;
const testReleasesDate = yargs.argv.date;
const testReleasesTimestamp = Date.parse(testReleasesDate);
const isIncludeDrafts = yargs.argv.includeDrafts;
const repositories = [
    'pointnetwork-dashboard',
    'pointnetwork',
    'pointsdk',
    'pointnetwork-uninstaller'
];

const getReleases = async (repository) => {
    const result = await axios.get(
        `https://api.github.com/repos/pointnetwork/${repository}/releases`,
        {
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${process.env.GITHUB_PAT}`
            }
        });
    return result.data.sort((a, b) =>
        (Date.parse(a.created_at) > Date.parse(b.created_at)) ? 1 : -1);
};

const main = async () => {
    const combination = {};
    for (const repository of repositories) {
        const releases = await getReleases(repository);
        let foundRelease = {};
        for (const release of releases) {
            // console.log(release);
            if (Date.parse(release.created_at) <= testReleasesTimestamp
               && (release.draft === false || isIncludeDrafts === true)) {
                foundRelease = release;
            }
        }
        combination[repository] = foundRelease.tag_name;
    }
    console.log(`\nThe release combination that you must use to simulate Point Dashboard on ${testReleasesDate}.\n`);
    console.log(JSON.stringify(combination, null, 4));
    console.log('\nPlease set these versions in your .env file.\n');
};

main();
