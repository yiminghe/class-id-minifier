var ID_REG = /\s+id\s*=\s*"([^"]+)"/ig;
var CLASS_REG = /\s+class\s*=\s*"([^"]+)"/ig;

var js_beautify = require('js-beautify').js_beautify;

function my_js_beautify(str) {
    var opts = {"indent_size": "4", "indent_char": " ",
        "preserve_newlines": true, "brace_style": "collapse",
        "keep_array_indentation": false, "space_after_anon_function": true};
    return js_beautify(str, opts);
}

function minify(html) {

    var idMap = {},
        classMap = {},
        idIndex = 0,
        base = 97, // a-1
        max = 122, // z
        interval = max - base + 1,
        classIndex = 0;

    function getShortString(index) {
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
        return ' id="' + (idMap[v] = idMap[v] || getShortString(idIndex++)) + '"';
    });

    html = html.replace(CLASS_REG, function (m, v) {
        v = v.trim().split(/\s+/);
        var ret = '';
        v.forEach(function (a) {
            ret += ' ' + (classMap[a] = classMap[a] || getShortString(classIndex++));
        });
        return ' class="' + ret.trim() + '"';
    });

    var jsCode = 'CLASS_ID_MAP=' + JSON.stringify(idMap) + ';';

    var scssCode = '';

    for (var p in classMap) {
        if (classMap.hasOwnProperty(p)) {
            scssCode += '$' + p + ': ' + classMap[p] + '\n';
        }
    }

    return {
        html: html,
        js: my_js_beautify(jsCode),
        scss: scssCode
    };
}

exports.minify = minify;

