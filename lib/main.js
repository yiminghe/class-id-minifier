var ID_REG = /\s+id\s*=\s*"([^"]+)"/ig;
var CLASS_REG = /\s+class\s*=\s*"([^"]+)"/ig;
var startIndexName = 'ks-class-id-minifier-' + Date.now();
var idMapIndex = 'ks-class-id-minifier-id-' + Date.now();
var classMapIndex = 'ks-class-id-minifier-class-' + Date.now();

function invalidKey(k) {
  return (k == startIndexName) || (k == idMapIndex) || (k == classMapIndex);
}

function minify(html, classIdMap, minifyFilter) {
  classIdMap = classIdMap || {};
  var idMap = classIdMap[idMapIndex] = classIdMap[idMapIndex] || {};
  var classMap = classIdMap[classMapIndex] = classIdMap[classMapIndex] || {};
  var startIndex = classIdMap[startIndexName] || -1;
  var base = 97; // a-1
  var max = 122; // z
  var interval = max - base + 1;

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
    var original = ' id="' + v + '"';
    if (minifyFilter) {
      if (minifyFilter(v, {
          id: 1
        })) {
        return ' id="' + (classIdMap[v] = classIdMap[v] || (idMap[v] = getShortString())) + '"';
      } else {
        return original;
      }
    }
    return ' id="' + (classIdMap[v] = classIdMap[v] || (idMap[v] = getShortString())) + '"';
  });

  html = html.replace(CLASS_REG, function (m, v) {
    v = v.trim().split(/\s+/);
    var ret = '';
    v.forEach(function (a) {
      if (minifyFilter) {
        if (minifyFilter(a, {
            className: 1
          })) {
          ret += ' ' + (classIdMap[a] = classIdMap[a] || (classMap[a] = getShortString()));
          return;
        } else {
          ret += ' ' + a;
          return;
        }
      }
      ret += ' ' + (classIdMap[a] = classIdMap[a] || (classMap[a] = getShortString()));
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
  var opts = {
    "indent_size": "4",
    "indent_char": " ",
    "preserve_newlines": true,
    "brace_style": "collapse",
    "keep_array_indentation": false,
    "space_after_anon_function": true
  };
  return js_beautify(str, opts);
}

function getTypeFromClassIdMapAndKey(classIdMap, key) {
  var idMap = classIdMap[idMapIndex] || {};
  var classMap = classIdMap[classMapIndex] || {};
  var type = {};
  if (key in idMap) {
    type.id = 1;
  }
  if (key in classMap) {
    type.className = 1;
  }
  return type;
}

exports.getJsCode = function (classIdMap, modName, mapFilter) {
  var code;
  if (mapFilter) {
    code = JSON.stringify(classIdMap, function (k, v) {
      if (!k) {
        return v;
      }
      if (invalidKey(k)) {
        return undefined;
      }
      if (mapFilter(k, getTypeFromClassIdMapAndKey(classIdMap, k))) {
        return v;
      }
      return undefined;
    });
  } else {
    code = JSON.stringify(classIdMap, function (k, v) {
      if (!k) {
        return v;
      }
      if (invalidKey(k)) {
        return undefined;
      }
      return v;
    });
  }
  if (modName !== undefined) {
    return my_js_beautify('module.exports = ( ' + (modName ? ('"' + modName + '"') : '') +
    'function(){ return ' + code + '; });');
  }
  return my_js_beautify('CLASS_ID_MAP=' + code + ';');
};

exports.getDevJsCode = function (classIdMap, modName) {
  var code;
  var map = {};
  for (var k in classIdMap) {
    if (classIdMap.hasOwnProperty(k) && !invalidKey(k)) {
      map[k] = k;
    }
  }
  code = JSON.stringify(map);
  if (modName !== undefined) {
    return my_js_beautify('module.exports = ( ' + (modName ? ('"' + modName + '"') : '') +
    'function(){ return ' + code + '; });');
  }
  return my_js_beautify('CLASS_ID_MAP=' + code + ';');
};

var escapeRegExp = /[\-#$\^*()+\[\]{}|\\,.?\s]/g;

function escapeReg(str) {
  return str.replace(escapeRegExp, '\\$&');
}

exports.getCssCode = function (classIdMap, cssContent) {
  var idMap = classIdMap[idMapIndex];
  var p;
  var classMap = classIdMap[classMapIndex];
  for (p in idMap) {
    if (idMap.hasOwnProperty(p)) {
      reg = new RegExp('#' + escapeReg(p) + '(?=[^\\w-])', 'gm');
      cssContent = cssContent.replace(reg, '#' + idMap[p]);
    }
  }
  for (p in classMap) {
    if (classMap.hasOwnProperty(p)) {
      var reg = new RegExp(escapeReg('.' + p) + '(?=[^\\w-])', 'gm');
      cssContent = cssContent.replace(reg, '.' + classMap[p]);
    }
  }
  return cssContent;
};

exports.minify = minify;

