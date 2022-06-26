/*
 * pixivRubyConverter
 * Version 1.0
 *
 * (c) 2022 uco
 *
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 */

//DESCRIPTION:pixivのルビ書式を変換

#target indesign

var NAME = 'pixivRubyConverter';

function loadconfig(name, def) {
  var scriptFile = new File($.fileName);
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
  function RubySetting(parent, def) {
    if (def === void 0) {
      def = {};
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
  yOffset: 0
});
app.doScript(main, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT);

function main() {
  var dialog = new Window('dialog', 'ルビ設定');
  var rubySettings = new RubySetting(dialog, DEFAULT);
  new ActionButtons(dialog, {
    width: 96,
    height: 24
  });
  var ret = dialog.show();

  if (ret != 1) {
    return;
  }

  var rubyOption = rubySettings.getValues();
  var PATTERN = '\\[\\[rb: *(.+?) *> *(.+?) *\\]\\]';
  app.findGrepPreferences = NothingEnum.nothing;
  app.findChangeGrepOptions.kanaSensitive = true;
  app.findChangeGrepOptions.widthSensitive = true;
  app.findChangeGrepOptions.includeFootnotes = false;
  app.findChangeGrepOptions.includeHiddenLayers = false;
  app.findChangeGrepOptions.includeLockedLayersForFind = false;
  app.findChangeGrepOptions.includeLockedStoriesForFind = false;
  app.findChangeGrepOptions.includeMasterPages = false;
  app.findGrepPreferences.findWhat = PATTERN;
  var found = app.activeDocument.findGrep();

  for (var i = 0; i < found.length; i++) {
    var chars = found[i];
    var matched = RegExp(PATTERN).exec(chars.contents),
        base = matched[1],
        ruby = matched[2];
    chars.contents = base;
    applyRuby(chars, ruby, true, rubyOption);
  }

  app.findGrepPreferences = NothingEnum.nothing;
}
