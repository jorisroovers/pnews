var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var SpecReporter = require('jasmine-spec-reporter');

gulp.task('default', function () {
    return gulp.src('spec/tests.js')
        .pipe(jasmine({
            reporter: new SpecReporter()
        }));
});