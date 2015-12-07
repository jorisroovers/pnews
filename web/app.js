var express = require('express'),
    mongoose = require('mongoose'),
    moment = require('moment'),
    winston = require('winston');

var app = express();
app.set('view engine', 'jade');
app.set('views', 'views');
app.use(express.static('assets'));

var RedditPost = null;


app.get('/', function (req, res) {
    var minUpvotes = process.env.REDDIT_MIN_UPVOTES || 1;
    RedditPost.find({'data.ups': {$gt: minUpvotes}}).sort({'data.ups': -1}).exec(function (err, posts) {
        if (err) {
            winston.warn("Error while fetching reddit posts from the DB: ", err);
            res.render('index', {title: 'pnews', message: 'An error occurred while fetching the results from the DB'});
        } else {
            // Create human friendly date strings for each post
            var now = moment.utc();
            var filteredPosts = [];
            for (var i = 0, len = posts.length; i < len; i++) {
                var date = moment.unix(posts[i].data.created_utc);
                var diff = moment.duration(now.diff(date)).days();
                // only keep posts of the last day
                if (diff < 1) {
                    filteredPosts.push(posts[i]);
                    posts[i].data.date_str = date.fromNow() + " (" + date.format("ddd, MMM Do YYYY, h:mm A") + ")";
                }
            }
            res.render('index', {title: 'pnews', message: 'Pnews', posts: filteredPosts});
        }
    });

});

var server = app.listen(process.env.WEB_SERVER_PORT || 3000, function () {
    winston.info("Starting pnews-web...");
    var host = server.address().address;
    var port = server.address().port;

    // Set connection to keep-alive so that we don't need to worry about losing the db connection:
    // http://mongoosejs.com/docs/connections.html
    var options = {
        server: {socketOptions: {keepAlive: 1}},
        replset: {socketOptions: {keepAlive: 1}}
    };
    mongoose.connect(process.env.MONGO_DB_URL, options);

    // set strict: false so that we can just insert reddit posts without having to define the schema here
    var RedditPostSchema = mongoose.Schema({
        data: {
            id: {type: [String], index: true},
            title: String,
            url: String,
            permalink: String,
            num_comments: Number,
            created_utc: Number,
            ups: Number
        }
    }, {strict: false});
    RedditPost = mongoose.model('RedditPost', RedditPostSchema);

    winston.info('pnews listening at http://%s:%s', host, port);
});