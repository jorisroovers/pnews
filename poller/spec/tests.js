var poller = require('../poller'),
    request = require('request');

describe("poller.get_access_token", function () {
    it("should do a proper HTTP POST call", function () {
        var p = new poller.Poller({
            reddit_username: "test-username",
            reddit_password: "test-password",
            reddit_app_id: "test-app-id",
            reddit_app_token: "test-app-token",
            mongo_db_url: "test-mongo-db-url"
        });

        spyOn(request, 'post');

        p.get_access_token();

        var expected_url = "https://www.reddit.com/api/v1/access_token";
        var expected_auth = {user: 'test-app-id', pass: 'test-app-token'};
        var expected_form = {grant_type: 'password', username: 'test-username', password: 'test-password'};
        expect(request.post).toHaveBeenCalledWith(expected_url, {
            auth: expected_auth,
            form: expected_form,
            json: true
        }, jasmine.any(Function));
    });


});


