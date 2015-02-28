'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
  rename: {
    'gulp-minify-css': 'minifyCSS'
  }
});
var del = require('del');
var browserify = require('browserify');
var transform = require('vinyl-transform');
var minimist = require('minimist');
var knownOptions = {
  string: 'env',
  default: {
    env: 'develop'
  }
};
var options = minimist(process.argv.slice(2), knownOptions);

var distFolder = './dist/';
var buildName;


gulp.task('buildname', function(cb) {
  var production = (options.env === 'production');

  buildName = production ? 'build_' + (new Date()).getTime() : 'build';
  cb();
});


gulp.task('clean', function(cb) {
  del(['dist/**'], cb);
});


gulp.task('template', ['clean', 'buildname'], function() {
  return gulp.src(['./src/index.html'])
    .pipe(plugins.multinject([
        'js/' + buildName + '.js',
      ],
      'js'
    ))
    .pipe(plugins.multinject([
        'css/' + buildName + '.css',
      ],
      'css'
    ))
    .pipe(gulp.dest(distFolder));
});


gulp.task('scripts', ['clean', 'buildname'], function() {
  var production = (options.env === 'production');
  var develop = (options.env === 'develop');

  var browserified = transform(function(filename) {
    var b = browserify(filename);
    return b.bundle();
  });

  return gulp.src('./node_modules/app/main.js', {
      // read: false
    })
    .pipe(browserified)
    // .pipe(plugins.browserify({
    //   // shim: {
    //   // },
    //   debug: false
    // }))
    .pipe(plugins.sourcemaps.init({loadMaps: true}))
    .pipe(plugins.rename(buildName + '.js'))
    .pipe(plugins.if(production, plugins.uglify()))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(distFolder + '/js'))
    .pipe(plugins.if(develop, plugins.livereload()));
});


gulp.task('styles', ['clean', 'buildname'], function() {
  var production = (options.env === 'production');
  var develop = (options.env === 'develop');

  return gulp.src('./src/css/*.css')
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat(buildName + '.css'))
    .pipe(plugins.if(production, plugins.minifyCSS()))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(distFolder + '/css'))
    .pipe(plugins.if(develop, plugins.livereload()));
});


// gulp.task('nodemon', ['build'], function() {
//   return plugins.nodemon({
//     script: 'server.js'
//   });
// });


gulp.task('build', ['template', 'scripts', 'styles']);


gulp.task('default', ['build']);


gulp.task('dev', function() {
  plugins.livereload.listen();
  gulp.watch(['./node_modules/app/**/*.*', './src/**/*.*'], ['build']);
});