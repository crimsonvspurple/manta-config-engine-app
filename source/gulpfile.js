var browserify = require('gulp-browserify');
var download   = require('gulp-download');
var gulp       = require('gulp');
var reactify   = require('reactify');
var rename     = require('gulp-rename');
var sass       = require('gulp-sass');

var fileList   = require('gulp-filelist');

var path = {
	dest: '../build/',
	base: 'web/',
	entry: 'web/main.jsx',
	html: 'web/index.html',
	images: 'web/images/*',
	sass: 'web/styles/main.sass',
	keyboardLayouts: 'web/keyboard-layouts/*',
	presets: '../node_modules/dota2-manta-config-engine/presets/*',
	basePresets: '../node_modules/dota2-manta-config-engine/',
	cycles: '../node_modules/dota2-manta-config-engine/extensions/cycles/*',
	chatwheels: '../node_modules/dota2-manta-config-engine/extensions/chatwheels/*',
	layouts: '../node_modules/dota2-manta-config-engine/extensions/layouts/*',
	baseExtensions: '../node_modules/dota2-manta-config-engine/extensions/'
};

var urls = [{
	file: 'FileSaver.min.js',
	url: 'https://raw.githubusercontent.com/eligrey/FileSaver.js/master/FileSaver.min.js'
}];

gulp.task('complete', ['download', 'copy', 'build', 'style']);

gulp.task('default', ['copy', 'build', 'style']);

gulp.task('build', function () {
	return gulp.src(path.entry)
		.pipe(browserify({
			transform: [reactify]
		}))
		.pipe(rename(function (path) {
			path.basename = 'app';
			path.extname = '.js';
		}))
		.pipe(gulp.dest(path.dest));
});

gulp.task('style', function () {
	return gulp.src(path.sass, {
			base: path.base
		})
		.pipe(sass().on('error', sass.logError))
		.pipe(gulp.dest(path.dest));
});

gulp.task('copy', ['copy-app', 'copy-presets', 'copy-cycles', 'copy-chatwheels', 'copy-layouts']);

gulp.task('copy-app', function () {
	return gulp.src([
			path.keyboardLayouts,
			path.html,
			path.images
		], {
			base: path.base
		})
		.pipe(gulp.dest(path.dest));
});

gulp.task('copy-presets', function () {
	return gulp.src(path.presets, {
			base: path.basePresets
		})
		.pipe(fileList('presets.json', {
			flatten: true
		}))
		.pipe(gulp.dest(path.dest));
});

gulp.task('copy-cycles', function () {
	return gulp.src(path.cycles, {
			base: path.baseExtensions
		})
		.pipe(fileList('cycles.json', {
			flatten: true
		}))
		.pipe(gulp.dest(path.dest));
});

gulp.task('copy-chatwheels', function () {
	return gulp.src(path.chatwheels, {
			base: path.baseExtensions
		})
		.pipe(fileList('chatwheels.json', {
			flatten: true
		}))
		.pipe(gulp.dest(path.dest));
});

gulp.task('copy-layouts', function () {
	return gulp.src(path.layouts, {
			base: path.baseExtensions
		})
		.pipe(fileList('layouts.json', {
			flatten: true
		}))
		.pipe(gulp.dest(path.dest));
});

gulp.task('download', function () {
	return download(urls)
		.pipe(gulp.dest(path.dest));
});
