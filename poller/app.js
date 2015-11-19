var Q = require("q"),
    request = require('request'),
    mongoose = require('mongoose');

var VERSION = "0.0.1"
var USER_AGENT = " pnews-poller:v" + VERSION;
var TIMEOUT = 10000;

var URLS = {
    'reddit': {
        'access_token': "https://www.reddit.com/api/v1/access_token",
        'r_programming_top': "https://oauth.reddit.com/r/programming/top"
    }
}

// TODO(jroovers): For now, we use some global vars to store some stuff, let's change this soon
var ACCESS_TOKEN = "bogus"; // this MUST be set to a bogus token initially, otherwise the API returns HTML
var RedditPost = null;

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
    console.info("Polling reddit for latest programming news...")
    var options = {
        'url': URLS.reddit.r_programming_top,
        'auth': {'bearer': ACCESS_TOKEN},
        'headers': {
            'User-Agent': USER_AGENT
        },
        'json': true,
    }
    request.get(options, function (error, response, body) {
        if (error) {
            console.error("An error occurred while trying to poll reddit:", error);
            return;
        }
        // if we are unauthenticated, then get a new token first and redo poll
        if (response.statusCode == 401) {
            console.info("Access token expired, getting a new one...")
            get_access_token().then(poll);
        }
        else if (response.statusCode == 200) {
            // Unfortunately, mongoose doesn't support bulk save yet, so we'll need to save the posts one by one:
            //https://github.com/Automattic/mongoose/issues/723
            var savedCount = 0;
            body.data.children.forEach(function (postData) {
                var post = new RedditPost(postData);
                var query = {'data.id': postData.data.id};
                RedditPost.update(query, postData, {upsert: true}, function (err) {
                    savedCount++;
                    if (err) {
                        console.warn("Failed saving post: [%s] %s", post.data.title, post.data.title);
                    }
                    if (savedCount == body.data.children.length) {
                        console.info("Saved posts to DB.")
                    }
                });
            });
        }
        else {
            console.warn("Unexpected response:", response.statusCode);
        }
    });
}

function init() {
    console.info("Starting pnews-poller...")
    // Check whether all required variables are set
    var envVariables = ['REDDIT_USERNAME', 'REDDIT_PASSWORD', 'REDDIT_APP_ID', 'REDDIT_APP_TOKEN', 'MONGO_DB_URL'];
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

    // Set connection to keep-alive so that we don't need to worry about losing the db connection:
    // http://mongoosejs.com/docs/connections.html
    var options = {
        server: {socketOptions: {keepAlive: 1}},
        replset: {socketOptions: {keepAlive: 1}}
    };
    mongoose.connect(process.env.MONGO_DB_URL, options);
    // set strict: false so that we can just insert reddit posts without having to define the schema here
    var RedditPostSchema = mongoose.Schema({data: {id: {type: [String], index: true}}}, {strict: false});
    RedditPost = mongoose.model('RedditPost', RedditPostSchema);

}

//////////////////
// ENTRY POINT
//////////////////

// Initialize and then start polling
init();
setInterval(poll, TIMEOUT);
poll();
