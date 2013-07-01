var ID_REG = /\s+id\s*=\s*"([^"]+)"/ig;
var CLASS_REG = /\s+class\s*=\s*"([^"]+)"/ig;

var startIndexName = 'ks-class-id-minifier-' + Date.now();

function minify(html, classIdMap, excludeIdReg, excludeClassReg) {

    classIdMap = classIdMap || {};

    var startIndex = classIdMap[startIndexName] || -1,
        base = 97, // a-1
        max = 122, // z
        interval = max - base + 1;

    function getShortString() {
        startIndex++;
        var index = startIndex;
        var ret = '';
        do {
            ret = String.fromCharCode(base + index % interval) + ret;
            // 00 = 10*1+0
            index = Math.floor(index / interval) - 1;
        } while (index >= 0);
        return ret;
    }

    html = html.replace(ID_REG, function (m, v) {
        v = v.trim();
        if (excludeIdReg && excludeIdReg.test(v)) {
            return ' id="' + v + '"';
        }
        return ' id="' + (classIdMap[v] = classIdMap[v] || getShortString()) + '"';
    });

    html = html.replace(CLASS_REG, function (m, v) {
        v = v.trim().split(/\s+/);
        var ret = '';
        v.forEach(function (a) {
            if (excludeClassReg && excludeClassReg.test(a)) {
                ret += ' ' + a;
                return;
            }
            ret += ' ' + (classIdMap[a] = classIdMap[a] || getShortString());
        });
        return ' class="' + ret.trim() + '"';
    });

    classIdMap[startIndexName] = startIndex;

    return {
        html: html,
        classIdMap: classIdMap
    };
}

var js_beautify = require('js-beautify').js_beautify;
function my_js_beautify(str) {
    var opts = {"indent_size": "4", "indent_char": " ",
        "preserve_newlines": true, "brace_style": "collapse",
        "keep_array_indentation": false, "space_after_anon_function": true};
    return js_beautify(str, opts);
}

exports.getJsCode = function (classIdMap, modName) {
    delete classIdMap[startIndexName];
    var code = JSON.stringify(classIdMap);
    if (modName !== undefined) {
        return my_js_beautify('KISSY.add( ' + (modName ? ('"' + modName + '"') : '') +
            'function(){ return ' + code + '; });');
    }

    return my_js_beautify('CLASS_ID_MAP=' + code + ';');
};

exports.getScssCode = function (classIdMap) {
    delete classIdMap[startIndexName];

    var scss = '';

    for (var p in classIdMap) {
        if (classIdMap.hasOwnProperty(p)) {
            scss += '$' + p + ': ' + classIdMap[p] + '\n';
        }
    }
    return scss;
};

exports.minify = minify;

