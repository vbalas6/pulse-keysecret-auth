var gulp = require('gulp');
var replace = require('gulp-replace');
var rename = require("gulp-rename");
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('default', function() {
    // place code for your default task here
});

gulp.task('server-build', function() {
    gulp.src(['node_modules/hapi-auth-hawk/lib/index.js'])
        .pipe(replace('authenticate: function (request, reply) {', "authenticate: function (request, reply) { \n\n            // Reformat to Hawk \n            request.raw.req.headers.authorization = request.raw.req.headers.authorization.replace('ReaderPlus key=', 'Hawk id=');"))
        .pipe(replace("server.auth.scheme('hawk', internals.hawk);", "server.auth.scheme('keySecret', internals.hawk);"))
        .pipe(replace("server.auth.scheme('bewit', internals.bewit);", ""))
        .pipe(rename("scheme.js"))
        .pipe(gulp.dest('lib'));
});

gulp.task('client-build', function() {
    return browserify('lib/browser.js', { standalone: 'keySecret' }).bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('browser.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['client-build', 'server-build']);