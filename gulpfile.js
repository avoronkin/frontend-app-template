'use strict';
// process.env.BROWSERIFYSHIM_DIAGNOSTICS = 1;
var gulp = require('gulp');
var runSequence = require('run-sequence');
var path = require('path');
var _ = require('lodash');
var shim = require('browserify-shim');
var nodeResolve = require('resolve');
var merge = require('merge-stream');
var plugins = require('gulp-load-plugins')({
  rename: {
    'gulp-minify-css': 'minifyCSS',
    'gulp-include-source': 'includeSources',
    'gulp-jscs-stylish': 'jscsStylish'
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
  entryFile: './src/js/main.js',
  outputDir: './dist/',
  outputFile: 'build.js'
};

var production = (options.env === 'production');
var develop = (options.env === 'develop');

function buildName(prefix) {
  prefix = prefix || 'build';
  return (options.env === 'production') ? prefix + '_' + (new Date()).getTime() : prefix;
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


function getNPMPackageIds() {
  return ['debug', 'jquery'];
}

function getShimmedPackages() {
  // read package.json and get dependencies' package ids
  var packageManifest = {};
  try {
    packageManifest = require('./package.json');
  } catch (e) {
    // does not have a package.json manifest
  }
  return packageManifest.browser || {};
}

function getShimmedPackageIDs() {
  return _.keys(getShimmedPackages()) || [];
}


function compile(watch) {
  var vendorBundle = browserify();


  getNPMPackageIds().forEach(function(id) {
    vendorBundle.require(nodeResolve.sync(id), {
      expose: id
    });
  });

  _.forOwn(getShimmedPackages(), function(path, name) {
    vendorBundle.require(path, {
      expose: name
    });
  });

  vendorBundle.transform('browserify-shim');


  var appBundle = browserify(config.entryFile, {
    debug: true,
    paths: ['./src']
  });

  getNPMPackageIds().forEach(function(id) {
    appBundle.external(id);
  });
  getShimmedPackageIDs().forEach(function(id) {
    appBundle.external(id);
  });

  appBundle.transform(babel);

  var appBundler = watch ? watchify(appBundle) : appBundle;

  function rebundle() {
    var app = appBundler.bundle()
      .on('error', function(err) {
        console.error(err);
        this.emit('end');
      })
      .pipe(source(buildName('app') + '.js'))
      .pipe(buffer())
      .pipe(plugins.sourcemaps.init({
        loadMaps: true
      }))
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest(distFolder + '/js'))
      .pipe(plugins.if(develop, plugins.livereload()));


    var vendor = vendorBundle.bundle()
      .pipe(source(buildName('_vendor') + '.js'))
      .pipe(gulp.dest(distFolder + '/js'));


    return merge(app, vendor);
  }

  if (watch) {
    appBundler.on('update', function() {
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

gulp.task('js:code-review', function() {
  return gulp.src('./src/js/**/*.js')
    .pipe(plugins.jshint())
    .pipe(plugins.jscs())
    .on('error', function() {})
    .pipe(plugins.jscsStylish.combineWithHintResults())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});



gulp.task('css', ['clean:css'], function() {
  return gulp.src('./src/scss/main.scss')
    .pipe(plugins.sourcemaps.init())
    // .pipe(plugins.compass({
    //   project: path.join(__dirname, 'src'),
    //   css: '../dist/css',
    //   sass: 'scss',
    //   require: ['bootstrap-sass'],
    //   sourcemap: true,
    //   time: true
    // }))
    .pipe(plugins.sass({
      errLogToConsole: true
    }))
    .pipe(plugins.autoprefixer({
      browsers: ['> 1%'],
      cascade: true
    }))
    .pipe(plugins.if(production, plugins.minifyCSS()))
    .pipe(plugins.rename(buildName('app') + '.css'))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(distFolder + '/css'))
    .pipe(plugins.if(develop, plugins.livereload()));
});



gulp.task('build', function(callback) {
  runSequence('clean', ['copy', 'js', 'js:code-review', 'css'], 'html', callback);
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

  plugins.watch(['./src/js/**/*.js'], function() {
    gulp.start('js:code-review');
  });

});
