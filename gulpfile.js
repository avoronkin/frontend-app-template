'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var path = require('path');
var merge = require('merge-stream');
var plugins = require('gulp-load-plugins')({
  rename: {
    'gulp-minify-css': 'minifyCSS',
    'gulp-include-source': 'includeSources'
  }
});
var del = require('del');

var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var babel = require('babelify');

var minimist = require('minimist');
var knownOptions = {
  string: 'env',
  default: {
    env: 'develop'
  }
};
var options = minimist(process.argv.slice(2), knownOptions);

var distFolder = './dist/';


var config = {
  entryFile: './node_modules/app/main.js',
  outputDir: './dist/',
  outputFile: 'build.js'
};

var production = (options.env === 'production');
var develop = (options.env === 'develop');

function buildName() {
  return (options.env === 'production') ? 'build_' + (new Date()).getTime() : 'build';
}


gulp.task('clean', function(cb) {
  del(['dist/**'], cb);
});
gulp.task('clean:js', function(cb) {
  del(['dist/js/**/*.*'], cb);
});
gulp.task('clean:css', function(cb) {
  del(['dist/css/**/*.*'], cb);
});
gulp.task('clean:fonts', function(cb) {
  del(['dist/fonts/**'], cb);
});
gulp.task('clean:images', function(cb) {
  del(['dist/images/**'], cb);
});

gulp.task('copy', ['clean:fonts', 'clean:images'], function() {
  var fonts = gulp.src('./src/fonts/**/*.*')
    .pipe(gulp.dest(distFolder + 'fonts'));

  var images = gulp.src('./src/images/**/*.*')
    .pipe(gulp.dest(distFolder + 'images'));

  return merge(fonts, images);
});


gulp.task('html', function() {
  return gulp.src('./src/index.html')
    .pipe(plugins.includeSources({
      cwd: distFolder
    }))
    .pipe(gulp.dest(distFolder));
});



function compile(watch) {
  var b = browserify(config.entryFile, {
    debug: true
  }).transform(babel);

  var bundler = watch ? watchify(b) : b;

  function rebundle() {
    return bundler.bundle()
      .on('error', function(err) {
        console.error(err);
        this.emit('end');
      })
      .pipe(source(buildName() + '.js'))
      .pipe(buffer())
      .pipe(plugins.sourcemaps.init({
        loadMaps: true
      }))
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest(distFolder + '/js'))
      .pipe(plugins.if(develop, plugins.livereload()));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling js...');
      del(['dist/js/**/*.*'], rebundle);
    });
  }

  return rebundle();
}


gulp.task('js', ['clean:js'], function() {
  return compile();
});
gulp.task('js:watch', ['clean:js'], function(cb) {
  return compile(true);
});



gulp.task('css', ['clean:css'], function() {
  return gulp.src('./src/scss/*.scss')
    .pipe(plugins.compass({
      project: path.join(__dirname, 'src'),
      css: 'css',
      sass: 'scss',
      require: ['bootstrap-sass'],
      time: true
    }))
    .pipe(plugins.rename(buildName() + '.css'))
    .pipe(plugins.if(production, plugins.minifyCSS()))
    .pipe(gulp.dest(distFolder + '/css'))
    .pipe(plugins.if(develop, plugins.livereload()));
});



gulp.task('build', function(callback) {
  runSequence('clean', ['copy', 'js', 'css'], 'html', callback);
});


gulp.task('default', ['build']);


gulp.task('dev', ['build'], function(cb) {
  plugins.livereload.listen();

  gulp.start('js:watch');

  plugins.watch(['src/scss/**/*.scss'], function() {
    gulp.start('css');
  });


  plugins.watch(['./dist/js/**/*.js', './dist/css/**/*.*'], function() {
    gulp.start('html');
  });

});