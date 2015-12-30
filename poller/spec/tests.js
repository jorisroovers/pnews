var poller = require('../reddit_poller'),
    request = require('request'),
    nock = require('nock'),
    winston = require('winston');

// disable info/warn logging during tests
winston.level = 'error';

// mock access_token request
nock('https://www.reddit.com')
    .persist() // allows us to use this mock more than once
    .post('/api/v1/access_token')
    .reply(200, {
        access_token: "new-access-token"
    });

describe("poller.get_access_token", function () {
    it("should do a proper HTTP POST call", function () {

        var p = new poller.Poller({
            reddit_username: "test-username",
            reddit_password: "test-password",
            reddit_app_id: "test-app-id",
            reddit_app_token: "test-app-token",
            mongo_db_url: "test-mongo-db-url",
        });
        expect(p.access_token).toBe("bogus");

        // get access token and verify that it has been retrieved correctly.
        spyOn(request, 'post').and.callThrough();
        p.get_access_token().then(function () {
            var expected_url = "https://www.reddit.com/api/v1/access_token";
            var expected_auth = {user: 'test-app-id', pass: 'test-app-token'};
            var expected_form = {grant_type: 'password', username: 'test-username', password: 'test-password'};
            expect(request.post).toHaveBeenCalledWith(expected_url, {
                auth: expected_auth,
                form: expected_form,
                json: true
            }, jasmine.any(Function));

            expect(p.access_token).toBe("new-access-token");

        });
    });

});

describe("Poller", function () {
    it("should have a 'bogus' token by default", function () {
        var p = new poller.Poller({});
        expect(p.access_token).toBe("bogus");

        // if you change the default access token, then that should be the access token
        p = new poller.Poller({access_token: "foo"});
        expect(p.access_token).toBe("foo");
    });

});


