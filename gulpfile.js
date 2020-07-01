const { src, dest, watch, series, parallel } = require('gulp');
const babelify = require('babelify');
const htmlmin = require('gulp-html-minifier2');
const browserSync = require('browser-sync').create();
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const clean = require('gulp-clean');
const through = require('through2')

const libs = [];

const paths = {
    src: {
        html: ['./index.html'],
        js: './js/**/*.js',
        libs: './js/libs/**/*.js',
        img: ['./img/**/*.jpg', './img/**/*.png', '!./img/texture_sheet/**/*'],
    },

    dist: {
        html: ['./app/'],
        js: ['./app/js/'],
        libs: './app/js/libs/',
        img: ['./app/img/'],
    }
}

const html = function () {
    return src(paths.src.html)
        .pipe(htmlmin())
        .pipe(dest(paths.dist.html));
}

const browserifyJS = function () {
    return browserify('./js/main.js', { debug: true })
        .external(libs)
        .transform(babelify.configure({
            presets: ["@babel/env"]
        }))
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(dest(paths.dist.js))
}

const copyLibs = function () {
    return src(paths.src.libs)
        .pipe(through.obj((chunk, enc, cb) => {
            libs.push(chunk.path);
            cb(null, chunk)
        }))
        .pipe(dest(paths.dist.libs));
}

const browserSyncInit = function () {
    browserSync.init({
        server: {
            baseDir: "./app/",
            directory: true,
        },
        open: false
    });
}

const reloadBrowsers = function (done) {
    browserSync.reload();

    done();
}

const watchFiles = function () {
    watch(paths.src.js, series(browserifyJS, reloadBrowsers));
    watch(paths.src.html, series(html, reloadBrowsers));
}

const cleanUp = function () {
    return src(paths.dist.html, { allowEmpty: true })
        .pipe(clean({ force: true }))
        .pipe(dest(paths.dist.html));
}

const copyImg = function () {
    return src(paths.src.img)
        .pipe(dest(paths.dist.img));
}

const liveReload = function (done) {
    parallel(watchFiles, browserSyncInit)();
    done();
}

const buildDev = series(cleanUp, html, copyImg, copyLibs, browserifyJS);

exports.start = series(buildDev, liveReload);
exports.default = exports.start;