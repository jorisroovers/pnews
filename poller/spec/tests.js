var app = require("../app.js")

describe("foo", function () {
    it("should return foo", function () {
        expect(app.foo()).toBe("foo");
    });
});