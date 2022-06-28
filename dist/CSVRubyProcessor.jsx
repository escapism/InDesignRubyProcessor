/*
 * CSVRubyProcessor
 * Version 1.0
 *
 * (c) 2022 uco
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

//DESCRIPTION:CSVファイルでルビを一括設定

#target indesign

var NAME = 'CSVRubyProcessor';

function loadconfig(name, def) {
  var scriptFile = function () {
    try {
      return app.activeScript;
    } catch (err) {
      return File(err.fileName);
    }
  }();

  var configFile = new File(scriptFile.parent + '/RUBY_PROCESSOR.conf');

  if (configFile.exists) {
    $.evalFile(configFile);
  }

  if (typeof CONFIG !== 'undefined' && CONFIG[name]) {
    var obj = {};

    for (var i in def) {
      obj[i] = i in CONFIG[name] ? CONFIG[name][i] : def[i];
    }

    return obj;
  }

  return def;
}

function parseCSV(csv) {
  var arr = [[]];
  var i = line = 0;
  var quotFlag = false;
  var item = '';

  while (csv[i]) {
    var c = csv[i];

    switch (c) {
      case '"':
        if (csv[i + 1] === '"') {
          item += '"';
          i++;
        } else {
          quotFlag = !quotFlag;
        }

        break;

      case ',':
        if (quotFlag) {
          item += c;
        } else {
          arr[line].push(item);
          item = '';
        }

        break;

      case '\r':
        if (quotFlag) {
          item += c;
        }

        break;

      case '\n':
        if (quotFlag) {
          item += c;
        } else if (arr[line].length) {
          arr[line].push(item);
          item = '';
          line++;
          arr.push([]);
        }

        break;

      default:
        item += c;
    }

    i++;
  }

  arr[line].push(item);
  return arr;
}

function convertInt(text, def, abs) {
  if (def === void 0) {
    def = 0;
  }

  if (abs === void 0) {
    abs = true;
  }

  text = full2half(text);
  var num = parseInt(text, 10);

  if (isNaN(num)) {
    num = def;
  } else if (abs) {
    num = Math.abs(num);
  }

  return num;
}

function full2half(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[０-９]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
}

function kanaUpper(text) {
  return text.replace(/[ぁぃぅぇぉゕゖっゃゅょゎァィゥェォヵヶッャュョヮ]/g, function (match) {
    var code = match.charCodeAt();

    if (match === 'ゕ' || match === 'ヵ') {
      code -= 74;
    } else if (match === 'ゖ' || match === 'ヶ') {
      code -= 69;
    } else {
      code++;
    }

    return String.fromCharCode(code);
  });
}

(function () {
  if (String.prototype.trim) return;

  String.prototype.trim = function () {
    return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
  };
})();

var NameValueList = function () {
  function NameValueList(parent, nameValue, label, def) {
    if (label === void 0) {
      label = '';
    }

    if (def === void 0) {
      def = 0;
    }

    this.parent = parent;
    this.group = this.parent.add('group');
    this.label;

    if (label) {
      this.label = this.group.add('statictext', undefined, label);
      this.label.justify = 'right';
    }

    this.names = [];
    this.values = [];

    for (var i in nameValue) {
      this.names.push(i);
      this.values.push(nameValue[i]);
    }

    def = Math.min(def, this.values.length - 1);
    this.list = this.group.add('dropdownlist', undefined, this.names);
    this.list.selection = def;
    this.value = this.values[def];

    this.list.onChange = function (_this) {
      return function () {
        _this.changeValue();
      };
    }(this);
  }

  var _proto = NameValueList.prototype;

  _proto.changeValue = function changeValue() {
    this.value = this.values[this.list.selection.index];
  };

  return NameValueList;
}();

function applyRuby(chars, ruby, group, option) {
  if (group) {
    chars.rubyType = RubyTypes.GROUP_RUBY;
  } else {
    chars.rubyType = RubyTypes.PER_CHARACTER_RUBY;
  }

  chars.rubyFlag = true;
  chars.rubyString = ruby;
  chars.rubyAlignment = option.alignments;
  chars.rubyPosition = option.position;
  chars.rubyParentOverhangAmount = option.overhang;
  chars.rubyParentSpacing = option.parentspacing;
  chars.rubyXOffset = option.xOffset;
  chars.rubyYOffset = option.yOffset;
}

var RubySetting = function () {
  function RubySetting(parent, def, skipmode) {
    if (def === void 0) {
      def = {};
    }

    if (skipmode === void 0) {
      skipmode = false;
    }

    this.parent = parent;
    this.alignList = new NameValueList(this.parent, {
      '肩付き': RubyAlignments.RUBY_LEFT,
      '中付き': RubyAlignments.RUBY_CENTER,
      '右 / 下揃え': RubyAlignments.RUBY_RIGHT,
      '両端揃え': RubyAlignments.RUBY_FULL_JUSTIFY,
      '1-2-1 (JIS) ルール': RubyAlignments.RUBY_JIS,
      '均等アキ': RubyAlignments.RUBY_EQUAL_AKI,
      '1ルビ文字アキ': RubyAlignments.RUBY_1_AKI
    }, '揃え', convertInt(def.alignments, 4));
    this.positionList = new NameValueList(this.parent, {
      '上 / 右': RubyKentenPosition.ABOVE_RIGHT,
      '下 / 左': RubyKentenPosition.BELOW_LEFT
    }, '位置', convertInt(def.position, 0));
    this.positionList.list.preferredSize.width = 141;
    this.overhangList = new NameValueList(this.parent, {
      'なし': RubyOverhang.NONE,
      'ルビ1文字分': RubyOverhang.RUBY_OVERHANG_ONE_RUBY,
      'ルビ半文字分': RubyOverhang.RUBY_OVERHANG_HALF_RUBY,
      '親1字分': RubyOverhang.RUBY_OVERHANG_ONE_CHAR,
      '親半分字分': RubyOverhang.RUBY_OVERHANG_HALF_CHAR,
      '無制限': RubyOverhang.RUBY_OVERHANG_NO_LIMIT
    }, '文字かけ処理', convertInt(def.overhang, 1));
    this.overhangList.label.preferredSize.width = 91;
    this.parentSpacingList = new NameValueList(this.parent, {
      '調整しない': RubyParentSpacing.RUBY_PARENT_NO_ADJUSTMENT,
      '両サイド': RubyParentSpacing.RUBY_PARENT_BOTH_SIDES,
      '1-2-1 アキ': RubyParentSpacing.RUBY_PARENT_121_AKI,
      '均等アキ': RubyParentSpacing.RUBY_PARENT_EQUAL_AKI,
      '両端揃え': RubyParentSpacing.RUBY_PARENT_FULL_JUSTIFY
    }, '親文字間の調整', convertInt(def.parentspacing, 2));
    this.parentSpacingList.group.preferredSize.width = 210;
    this.xOffset = convertInt(def.xOffset);
    this.yOffset = convertInt(def.yOffset);

    if (skipmode) {
      this.inputSkipmode = this.parent.add('checkbox', undefined, '重複スキップ');
      this.inputSkipmode.value = def.skipmode;
    } else {
      this.inputSkipmode = {
        value: false
      };
    }
  }

  var _proto = RubySetting.prototype;

  _proto.getValues = function getValues() {
    return {
      alignments: this.alignList.value,
      position: this.positionList.value,
      overhang: this.overhangList.value,
      parentspacing: this.parentSpacingList.value,
      xOffset: this.xOffset,
      yOffset: this.yOffset
    };
  };

  _proto.isSkip = function isSkip() {
    return this.inputSkipmode.value;
  };

  return RubySetting;
}();

var ActionButtons = function () {
  function ActionButtons(parent, size, okText, cancelText) {
    if (size === void 0) {
      size = {
        width: 120,
        height: 24
      };
    }

    if (okText === void 0) {
      okText = 'OK';
    }

    if (cancelText === void 0) {
      cancelText = 'キャンセル';
    }

    this.parent = parent;
    this.group = parent.add('group');
    this.group.orientation = "row";

    if (/^windows/i.test($.os)) {
      this.addOK(okText);
      this.addCancel(cancelText);
    } else {
      this.addCancel(cancelText);
      this.addOK(okText);
    }

    this.ok.preferredSize = size;
    this.cancel.preferredSize = size;
    this.ok.active = true;
  }

  var _proto = ActionButtons.prototype;

  _proto.addOK = function addOK(okText) {
    this.ok = this.group.add('button', undefined, okText, {
      name: 'ok'
    });
  };

  _proto.addCancel = function addCancel(cancelText) {
    this.cancel = this.group.add('button', undefined, cancelText, {
      name: 'cancel'
    });
  };

  return ActionButtons;
}();

var DEFAULT = loadconfig(NAME, {
  alignments: 4,
  position: 0,
  overhang: 1,
  parentspacing: 2,
  xOffset: 0,
  yOffset: 0,
  skipmode: false
});
app.doScript(main, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT);

function main() {
  var dialog = new Window('dialog', 'ルビ設定');
  var rubySettings = new RubySetting(dialog, DEFAULT, true);
  new ActionButtons(dialog, {
    width: 96,
    height: 24
  });
  var ret = dialog.show();

  if (ret != 1) {
    return;
  }

  var rubyOption = rubySettings.getValues();
  var skipmode = rubySettings.isSkip();
  var fileObj = File.openDialog('', function () {
    if (/^windows/i.test($.os)) {
      return '*.csv';
    } else {
      return function (F) {
        return F instanceof Folder || /\.csv$/i.test(F.fsName);
      };
    }
  }());
  if (!fileObj) return;
  var open = fileObj.open('r');

  if (!open) {
    alert('ファイルが開けません。');
    return;
  }

  var frames = null;

  if (app.activeDocument.selection.length) {
    frames = app.activeDocument.selection;
  } else {
    var pages = app.activeDocument.pages;
    frames = [];

    for (var m = 0; m < pages.length; m++) {
      var frameInPage = pages[m].textFrames;

      if (frameInPage.length) {
        frameInPage = Array.prototype.slice.call(frameInPage);
        frames = frames.concat(frameInPage);
      }
    }
  }

  var csv = fileObj.read();
  var parsed = parseCSV(csv);
  var rubyData = [];

  for (var i = 0; i < parsed.length; i++) {
    var line = parsed[i];
    if (line.length < 2) continue;
    rubyData.push({
      base: line[0],
      ruby: kanaUpper(line[1].trim()).split('　'),
      context: line[2] ? line[2].trim() : '',
      flag: convertInt(line[3], 0)
    });
    if (rubyData.flag > 2) rubyData.flag = 0;
  }

  app.findTextPreferences = NothingEnum.nothing;
  app.findChangeTextOptions.caseSensitive = true;
  app.findChangeTextOptions.kanaSensitive = true;
  app.findChangeTextOptions.widthSensitive = true;
  app.findChangeTextOptions.includeFootnotes = false;
  app.findChangeTextOptions.includeHiddenLayers = false;
  app.findChangeTextOptions.includeLockedLayersForFind = false;
  app.findChangeTextOptions.includeLockedStoriesForFind = false;
  app.findChangeTextOptions.includeMasterPages = false;
  app.findGrepPreferences = NothingEnum.nothing;
  app.findChangeGrepOptions.kanaSensitive = true;
  app.findChangeGrepOptions.widthSensitive = true;
  app.findChangeGrepOptions.includeFootnotes = false;
  app.findChangeGrepOptions.includeHiddenLayers = false;
  app.findChangeGrepOptions.includeLockedLayersForFind = false;
  app.findChangeGrepOptions.includeLockedStoriesForFind = false;
  app.findChangeGrepOptions.includeMasterPages = false;
  var doc = app.activeDocument;
  var lastPage;

  for (var _i = 0; _i < rubyData.length; _i++) {
    var data = rubyData[_i];
    var method = data.context ? 'Grep' : 'Text';
    app["find" + method + "Preferences"].findWhat = data.context || data.base;
    var foundItems = doc["find" + method]();
    lastPage = null;

    for (var j = 0; j < foundItems.length; j++) {
      var item = foundItems[j];

      if (data.flag === 2) {
        var pageName = item.parentTextFrames[item.parentTextFrames.length - 1].parentPage.name;

        if (lastPage === pageName) {
          continue;
        }

        lastPage = pageName;
      }

      var target = void 0;

      if (data.context) {
        var start = item.contents.indexOf(data.base);

        if (start === -1) {
          target = false;
        } else {
          target = item.characters.itemByRange(start, start + data.base.length - 1);
        }
      } else {
        target = item;
      }

      if (!target) break;
      var rubyFlag = false;

      if (skipmode) {
        for (var k = 0; k < target.characters.length; k++) {
          rubyFlag = target.characters[k].rubyFlag;

          if (rubyFlag instanceof Array) {
            rubyFlag = rubyFlag[0];
          }

          if (rubyFlag) break;
        }
      }

      if (!rubyFlag) {
        if (data.ruby.length > 1) {
          for (var _k = 0; _k < data.ruby.length; _k++) {
            if (!data.ruby[_k]) continue;
            if (_k === target.length) break;
            applyRuby(target.characters[_k], data.ruby[_k], false, rubyOption);
          }
        } else {
          applyRuby(target, data.ruby[0], target.length > 1, rubyOption);
        }
      }

      if (data.flag === 1) {
        break;
      }
    }
  }

  app.findTextPreferences = NothingEnum.nothing;
  app.findGrepPreferences = NothingEnum.nothing;
  fileObj.close();
}
