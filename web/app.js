var express = require('express'),
    mongoose = require('mongoose');

var app = express();
app.set('view engine', 'jade');
app.set('views', 'views');
app.use(express.static('assets'));

var RedditPost = null;

app.get('/', function (req, res) {
    RedditPost.find().sort({'data.ups': -1}).exec(function (err, posts) {
        if (err) {
            console.warn("Error while fetching reddit posts from the DB: ", err);
            res.render('index', {title: 'pnews', message: 'An error occurred while fetching the results from the DB'});
        } else {
            res.render('index', {title: 'pnews', message: 'Pnews', posts: posts});
        }
    });

});

var server = app.listen(process.env.WEB_SERVER_PORT || 3000, function () {
    console.info("Starting pnews-web...");
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
            ups: Number
        }
    }, {strict: false});
    RedditPost = mongoose.model('RedditPost', RedditPostSchema);

    console.info('pnews listening at http://%s:%s', host, port);
});