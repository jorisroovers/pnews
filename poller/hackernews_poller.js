var TIMEOUT = 1200000, HN_MAX_FETCH_STORIES = 100;

var Q = require("q"),
    request = require('request'),
    mongoose = require('mongoose'),
    winston = require('winston'),
    version = require('./version');


var URLS = {
    'hn': {
        'topstories': "https://hacker-news.firebaseio.com/v0/topstories.json",
        'story': "https://hacker-news.firebaseio.com/v0/item/"
    }
};


function HNPoller(options) {

    var self = {
        options: options,
    };

    var _dbModel = null;

    self.init = function () {
        winston.info("Initializing poller...");
        // Set connection to keep-alive so that we don't need to worry about losing the db connection:
        // http://mongoosejs.com/docs/connections.html
        var options = {
            server: {socketOptions: {keepAlive: 1}},
            replset: {socketOptions: {keepAlive: 1}}
        };
        mongoose.connect(self.options.mongo_db_url, options);
        // set strict: false so that we can just insert reddit posts without having to define the schema here
        var HNPostSchema = mongoose.Schema({id: {type: [Number], index: true}}, {strict: false});
        _dbModel = mongoose.model('HNPost', HNPostSchema);
    };

    self.poll = function () {
        var deferred = Q.defer();
        var options = {
            'url': URLS.hn.topstories,
            'json': true,
        };
        winston.info("Retrieving HN top stories...");
        request.get(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {

                // for each story-id, fetch story details
                winston.info("Retrieving HN top stories...");
                var topstories = body;
                for (var i = 0; i < Math.min(HN_MAX_FETCH_STORIES, topstories.length); i++) {
                    console.log("Retrieving details for story " + topstories[i]);
                    var options = {
                        'url': URLS.hn.story + topstories[i] + ".json",
                        'json': true,
                    };
                    request.get(options, function (error, response, storyData) {
                        // Unfortunately, mongoose doesn't support bulk save yet, so we'll need to save the posts one by one:
                        //https://github.com/Automattic/mongoose/issues/723
                        var story = new _dbModel(storyData);
                        var query = {'id': storyData.id};
                        _dbModel.update(query, storyData, {upsert: true}, function (err) {
                            if (err) {
                                winston.warn("Failed saving story: %s", story.id);
                            } else {
                                winston.info("Saved story: (%s) %s", story.id, story.title);
                            }
                        });
                    });
                }
                deferred.resolve();
            } else {
                winston.warn("An error occured while fetching HN top stories: " + error);
            }
        });
        return deferred.promise;
    };

    return self;
};

//TODO(joris.roovers): Poller interface that is shared between HN and reddit pollers

var p = new HNPoller({mongo_db_url: process.env.MONGO_DB_URL});
p.init();
setInterval(function () {
    p.poll();
}, TIMEOUT);
p.poll();

