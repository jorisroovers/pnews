var cli = require('commander'),
    winston = require("winston"),
    version = require('./version'),
    reddit_poller = require("./reddit_poller"),
    hn_poller = require("./hackernews_poller");

// Add timestamp to logs
// http://stackoverflow.com/questions/10271373/how-can-i-add-timestamp-to-logs-using-node-js-library-winston
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp': true});

function assertEnvVariables(envVariables) {
    // Check whether all required variables are set
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
}

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
    var envVariables = ['REDDIT_USERNAME', 'REDDIT_PASSWORD', 'REDDIT_APP_ID', 'REDDIT_APP_TOKEN', 'MONGO_DB_URL'];
    assertEnvVariables(envVariables);

    // Initialize and then start polling
    var p = new reddit_poller.Poller({
        reddit_username: process.env.REDDIT_USERNAME,
        reddit_password: process.env.REDDIT_PASSWORD,
        reddit_app_id: process.env.REDDIT_APP_ID,
        reddit_app_token: process.env.REDDIT_APP_TOKEN,
        mongo_db_url: process.env.MONGO_DB_URL
    });
} else if (cli.source == "hackernews") {
    // TODO(joris.roovers): create a single interface for hackernews/reddit pollers
    var envVariables = ['MONGO_DB_URL'];
    assertEnvVariables(envVariables);
    var p = new hn_poller.HNPoller({mongo_db_url: process.env.MONGO_DB_URL});
}

winston.info("Starting pnews-poller [%s]...", cli.source);
p.init();
p.poll().then(function () {
    p.close();
    winston.info("All done!");
});
