'use strict';

var gulp = require('gulp');
// var gutil = require('gulp-util');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');

// var watch = require('gulp-watch');
var gulpMultinject = require('gulp-multinject');

var del = require('del');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var gulpif = require('gulp-if');
var runSequence = require('run-sequence');

var production = false;

var distFolder = './dist/';

function getBuildName(name) {
  return name + '_' + (new Date()).getTime();
}

var buildName = getBuildName('app');


gulp.task('clean:dist', function(cb) {
  del(['dist/**'], cb);
});


gulp.task('index', function() {
  return gulp.src(['./src/index.html'])
    .pipe(gulpMultinject([
        distFolder + 'js/' + buildName + '.js',
      ],
      'js'
    ))
    .pipe(gulpMultinject([
        distFolder + 'css/' + buildName + '.css',
      ],
      'css'
    ))
    .pipe(gulp.dest(distFolder));

});


gulp.task('scripts', function() {

  return gulp.src('./node_modules/app/main.js', {
      read: false
    }).pipe(browserify({
      // shim: {
      // },
      debug: false
    }))
    .pipe(rename(buildName + '.js'))
    .pipe(gulpif(production, uglify()))
    .pipe(gulp.dest(distFolder + '/js'));
});


gulp.task('styles', function() {
  gulp.src('./src/css/*.css')
    .pipe(concat(buildName + '.css'))
    .pipe(gulp.dest(distFolder + '/css'));
});


gulp.task('default', ['build']);

function build(cb) {
  cb = cb || function() {};
  buildName = getBuildName('app');

  runSequence('clean:dist', [
    'index',
    'scripts',
    'styles'
  ], cb);
}

gulp.task('dev', ['build'], function() {
  gulp.watch(['./node_modules/app/**/*.*', './src/**/*.*'], build);
});

gulp.task('production', function(cb) {
  production = true;
  build(cb);
  production = false;
});


gulp.task('build', build);
