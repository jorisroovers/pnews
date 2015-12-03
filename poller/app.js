var poller = require("./poller"),
    winston = require('winston');
var TIMEOUT = 10000;

//////////////////
// ENTRY POINT
//////////////////

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
var p = new poller.Poller({
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
