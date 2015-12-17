var cli = require('commander'),
    winston = require("winston"),
    version = require('./version'),
    reddit_poller = require("./poller"),
    hn_poller = require("./hackernews_poller");

var TIMEOUT = 30000;

//////////////////
// ENTRY POINT
//////////////////

cli
    .version(version.version)
    .option("-s, --source [source]", "required. Source of news (reddit|hackernews)", /^(reddit|hackernews)$/i)
    .parse(process.argv);

if (cli.source === true || cli.source === undefined) {
    // commander.js is a little weird in that it will set the specified option to the string if the passed option
    // fits the regex, to true if it the option is specified but contains an illegal value and just to undefined
    // if the option is not passed.
    // In all these cases, we just print help output.
    cli.help();
} else if (cli.source == "reddit") {

    winston.info("Starting pnews-poller...")
    // Check whether all required variables are set
    var envVariables = ['REDDIT_USERNAME', 'REDDIT_PASSWORD', 'REDDIT_APP_ID', 'REDDIT_APP_TOKEN', 'MONGO_DB_URL'];
    var initError = false;
    envVariables.forEach(function (item) {
        if (!process.env[item]) {
            winston.error("The environment variable '%s' must be defined.", item);
            initError = true;
        }
    });

    // exit if an init error occured
    if (initError) {
        winston.error("pnews-poller not correctly initialized, exiting.");
        process.exit(1)
    }

    // Initialize and then start polling
    var p = new reddit_poller.Poller({
        reddit_username: process.env.REDDIT_USERNAME,
        reddit_password: process.env.REDDIT_PASSWORD,
        reddit_app_id: process.env.REDDIT_APP_ID,
        reddit_app_token: process.env.REDDIT_APP_TOKEN,
        mongo_db_url: process.env.MONGO_DB_URL
    });
    p.init();
    setInterval(function () {
        p.poll();
    }, TIMEOUT);
    p.poll();

} else if (cli.source == "hackernews") {
    // TODO(joris.roovers): create a single interface for hackernews/reddit pollers
    var p = new hn_poller.HNPoller({mongo_db_url: process.env.MONGO_DB_URL});
    p.init();
    p.poll().then(function () {
        p.close();
    });
}