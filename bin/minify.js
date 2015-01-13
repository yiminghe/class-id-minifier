#!/usr/bin/env node

var argv = require('optimist')
    .demand('f')
    .describe('f', 'html file')
    .demand('cf')
    .describe('cf', 'css file')
    .demand('o')
    .describe('o', 'minified html file')
    .describe('he', 'html file encoding')
    .describe('ce', 'css file encoding')
    .describe('je', 'javascript file encoding')
    .demand('c')
    .describe('c', 'css file')
    .demand('j')
    .describe('j', 'js file')
    .usage('minify html by shorter class and idm then generate scss and js variable map.\n' +
        'usage: $0 --he [html encoding] -f [html file] -s [scss file] -j [js file]').argv;

var fs = require('fs');
var zlib = require('zlib');
var classIdMinify = require('../lib/main');
var minify = classIdMinify.minify;
var he = argv.he || 'utf-8';
var ce = argv.ce || 'utf-8';
var je = argv.je || 'utf-8';
var cssFile=argv.cf;
var htmlFile = argv.f;
var cssOutFile = argv.c;
var outFile = argv.o;
var jsFile = argv.j;
var htmlContent;
var iconv = require('iconv-lite');

function getFileContent(htmlFile, encoding) {
    var content;
    var buffer;

    if (encoding == 'utf-8') {
        content = fs.readFileSync(htmlFile, encoding);
        buffer = new Buffer(content);
    } else {
        content = iconv.decode(buffer = fs.readFileSync(htmlFile), encoding);
    }
    zlib.gzip(buffer, function (b) {
        fs.writeFileSync(htmlFile + '.gz', arguments[1]);
    });
    return content;
}

function saveFileContent(outFile, content, encoding) {
    var buffer;
    if (encoding == 'utf-8') {
        fs.writeFileSync(outFile, content, encoding);
        buffer = new Buffer(content);
    } else {
        fs.writeFileSync(outFile, buffer = iconv.encode(content, encoding));
    }
    zlib.gzip(buffer, function (b) {
        fs.writeFileSync(outFile + '.gz', arguments[1]);
    });
}

htmlContent = getFileContent(htmlFile, he);

var ret = minify(htmlContent);

saveFileContent(outFile, ret.html, he);

console.info('generate html file: ' + outFile + ' at ' + (new Date().toLocaleString()));

var css = classIdMinify.getCssCode(ret.classIdMap,getFileContent(cssFile,ce));

saveFileContent(cssOutFile, css, ce);
console.info('generate css file: ' + cssOutFile + ' at ' + (new Date().toLocaleString()));

var js = classIdMinify.getJsCode(ret.classIdMap);

saveFileContent(jsFile, js, je);
saveFileContent(jsFile + '.dev.js', classIdMinify.getDevJsCode(ret.classIdMap), je);
console.info('generate js file: ' + jsFile + ' at ' + (new Date().toLocaleString()));
