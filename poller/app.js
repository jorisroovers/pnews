var Q = require("q");
var request = require('request');

var VERSION = "0.0.1"
var USER_AGENT = " pnews-poller:v" + VERSION;
var TIMEOUT = 10000;

var URLS = {
    'reddit': {
        'access_token': "https://www.reddit.com/api/v1/access_token",
        'r_programming_top': "https://oauth.reddit.com/r/programming/top"
    }
}
var ACCESS_TOKEN = "dw"; // For now, we use a global var to store the access token

// Simple way to get reddit access token as per: https://github.com/reddit/reddit/wiki/OAuth2-Quick-Start-Example
function get_access_token() {
    console.info("Retrieving access code")
    data = {
        'grant_type': "password",
        'username': process.env.REDDIT_USERNAME,
        'password': process.env.REDDIT_PASSWORD,
    };
    auth = {
        'user': process.env.REDDIT_APP_ID,
        'pass': process.env.REDDIT_APP_TOKEN,
    };
    var deferred = Q.defer();
    request.post(URLS.reddit.access_token, {'auth': auth, 'form': data, 'json': true},
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.info("Retrieved new access token");
                ACCESS_TOKEN = body["access_token"];
                deferred.resolve();
            }
        });
    return deferred.promise;
}

// Polls /r/programming for the top stories
function poll() {
    console.info("Polling reddit for latest programming news")
    options = {
        'url': URLS.reddit.r_programming_top,
        'auth': {'bearer': ACCESS_TOKEN},
        'headers': {
            'User-Agent': USER_AGENT
        },
        'json': true,
    }
    // try to get
    request.get(options, function (error, response, body) {
        if (error) {
            console.error("An error occured while trying to poll reddit:", error);
            return;
        }
        // if we are unauthenticated, then get a new token first and redo poll
        if (response.statusCode == 401) {
            console.info("Access token expired, getting a new one...")
            get_access_token().then(poll);
        }
        else if (response.statusCode == 200) {
            body.data.children.forEach(function (post) {
                console.info("[%s] %s", post.data.score, post.data.title);
                console.info("\t", post.data.permalink);
                console.info("\t", post.data.url);
            });
        }
        else {
            console.warn("Unexpected response:", response.statusCode);
        }
    });
}

function init() {
    // Check whether all required variables are set
    var envVariables = ['REDDIT_USERNAME', 'REDDIT_PASSWORD', 'REDDIT_APP_ID', 'REDDIT_APP_TOKEN'];
    var initError = false;
    envVariables.forEach(function (item) {
        if (!process.env[item]) {
            console.error("The environment variable '%s' must be defined.", item);
            initError = true;
        }
    });

    // exit if an init error occured
    if (initError) {
        console.error("pnews-poller not correctly initialized, exiting.");
        process.exit(1)
    }
}

//////////////////
// ENTRY POINT
//////////////////

// Initialize and then start polling
init();
setInterval(poll, TIMEOUT);
poll();
