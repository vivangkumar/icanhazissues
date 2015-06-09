var gulp = require('gulp')
  , del = require('del')
  , minifyCss = require('gulp-minify-css')
  , uglify = require('gulp-uglify')
  , rename = require('gulp-rename')
  , concat = require('gulp-concat');

var paths = {
  css: ['./public/stylesheets/*.css'],
  js: ['./public/javascripts/*.js']
};

gulp.task('clean', function(done) {
  del(['build'], done);
});

gulp.task('minify-css', ['clean'], function() {
  return gulp.src(paths.css)
    .pipe(minifyCss())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./public/stylesheets/min'))
});

gulp.task('scripts', ['clean'], function() {
  return gulp.src(paths.js)
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./public/javascripts/min'));
});


gulp.task('watch', function() {
    gulp.watch(paths.js, ['scripts']);
    gulp.watch(paths.css, ['minify-css']);
});

gulp.task('default', ['watch', 'minify-css', 'scripts']);
