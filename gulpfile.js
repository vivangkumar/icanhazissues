var gulp = require('gulp')
  , del = require('del')
  , react = require('gulp-react')
  , minifyCss = require('gulp-minify-css')
  , uglify = require('gulp-uglify')
  , rename = require('gulp-rename')
  , concat = require('gulp-concat');

var paths = {
  css: ['./public/stylesheets/*.css'],
  js: ['./public/javascripts/*.js'],
  jsx: ['./public/javascripts/react/*.jsx']
};

gulp.task('clean', function(done) {
  del(['build'], done);
});

gulp.task('minify-css', ['clean'], function() {
  return gulp.src(paths.css)
    .pipe(minifyCss())
    .pipe(gulp.dest('./public/stylesheets/min'))
});

gulp.task('scripts', ['clean'], function() {
  return gulp.src(paths.js)
    .pipe(concat('bundle.js'))
    .pipe(gulp.dest('./public/javascripts/min'))
    .pipe(rename('bundle.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/javscripts/min'));
});

gulp.task('react', ['clean'], function() {
  return gulp.src(paths.jsx)
    .pipe(react())
    .pipe(gulp.dest('./public/javascripts/react/js'))
})

gulp.task('watch', function() {
    gulp.watch(paths.js, ['scripts']);
    gulp.watch(paths.css, ['minify-css']);
    gulp.watch(paths.jsx, ['react'])
});

gulp.task('default', ['watch', 'minify-css', 'scripts', 'react']);
