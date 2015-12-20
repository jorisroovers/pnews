var Q = require("q"),
    request = require('request'),
    mongoose = require('mongoose'),
    winston = require('winston'),
    version = require('./version');


var USER_AGENT = " pnews-poller:v" + version.version;

var URLS = {
    'reddit': {
        'access_token': "https://www.reddit.com/api/v1/access_token",
        'r_programming_top': "https://oauth.reddit.com/r/programming/top"
    }
};

function Poller(options) {

    var self = {
        options: options,
        // access_token MUST be set to a bogus token initially, otherwise the API returns HTML
        access_token: options.access_token || "bogus"
    };

    var _dbModel = null;

    // Simple way to get reddit access token as per: https://github.com/reddit/reddit/wiki/OAuth2-Quick-Start-Example
    self.get_access_token = function () {
        winston.info("Retrieving access code")
        data = {
            'grant_type': "password",
            'username': self.options.reddit_username,
            'password': self.options.reddit_password,
        };
        auth = {
            'user': self.options.reddit_app_id,
            'pass': self.options.reddit_app_token,
        };
        var deferred = Q.defer();
        request.post(URLS.reddit.access_token, {'auth': auth, 'form': data, 'json': true},
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    winston.info("Retrieved new access token");
                    self.access_token = body["access_token"];
                    deferred.resolve();
                }
            });
        return deferred.promise;
    };

    // Polls /r/programming for the top stories
    self.poll = function () {
        var deferred = Q.defer();
        winston.info("Polling reddit for latest programming news...")
        var options = {
            'url': URLS.reddit.r_programming_top,
            'auth': {'bearer': self.access_token},
            'headers': {
                'User-Agent': USER_AGENT
            },
            'json': true,
        }
        request.get(options, function (error, response, body) {
            if (error) {
                winston.error("An error occurred while trying to poll reddit:", error);
                return;
            }
            // if we are unauthenticated, then get a new token first and redo poll
            if (response.statusCode == 401) {
                winston.info("Access token expired, getting a new one...")
                self.get_access_token().then(self.poll).then(deferred.resolve);
            }
            else if (response.statusCode == 200) {
                // Unfortunately, mongoose doesn't support bulk save yet, so we'll need to save the posts one by one:
                //https://github.com/Automattic/mongoose/issues/723
                var savedCount = 0;
                body.data.children.forEach(function (postData) {
                    var post = new _dbModel(postData);
                    var query = {'data.id': postData.data.id};
                    _dbModel.update(query, postData, {upsert: true}, function (err) {
                        savedCount++;
                        if (err) {
                            winston.warn("Failed saving post: [%s] %s", post.data.title, post.data.title);
                        }
                        if (savedCount == body.data.children.length) {
                            winston.info("Saved posts to DB.");
                            deferred.resolve();
                        }
                    });
                });
            }
            else {
                winston.warn("Unexpected response:", response.statusCode);
            }
        });
        return deferred.promise;
    };

    self.init = function () {

        // Set connection to keep-alive so that we don't need to worry about losing the db connection:
        // http://mongoosejs.com/docs/connections.html
        var options = {
            server: {socketOptions: {keepAlive: 1}},
            replset: {socketOptions: {keepAlive: 1}}
        };
        mongoose.connect(self.options.mongo_db_url, options);
        // set strict: false so that we can just insert reddit posts without having to define the schema here
        var RedditPostSchema = mongoose.Schema({data: {id: {type: [String], index: true}}}, {strict: false});
        _dbModel = mongoose.model('RedditPost', RedditPostSchema);
    };

    self.close = function () {
        mongoose.disconnect();
    };

    return self;
}

module.exports.Poller = Poller;