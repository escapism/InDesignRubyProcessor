import { convertInt } from './utils'
import NameValueList from './nameValueList'

function applyRuby(chars, ruby, group, option) {
	if (group) {
		chars.rubyType = RubyTypes.GROUP_RUBY
	} else {
		chars.rubyType = RubyTypes.PER_CHARACTER_RUBY
	}
	chars.rubyFlag = true
	chars.rubyString = ruby
	chars.rubyAlignment = option.alignments // 揃え
	chars.rubyPosition = option.position // 位置
	chars.rubyParentOverhangAmount = option.overhang // 文字かけ処理
	chars.rubyParentSpacing = option.parentspacing // 親文字間の調整
	chars.rubyXOffset = option.xOffset // 親文字からのオフセットX [pt]
	chars.rubyYOffset = option.yOffset // 親文字からのオフセットY [pt]
}

class RubySetting {
	constructor(parent, def = {}, skipmode = false) {
		this.parent = parent

		this.alignList = new NameValueList(this.parent, {
			'肩付き': RubyAlignments.RUBY_LEFT,
			'中付き': RubyAlignments.RUBY_CENTER,
			'右 / 下揃え': RubyAlignments.RUBY_RIGHT,
			'両端揃え': RubyAlignments.RUBY_FULL_JUSTIFY,
			'1-2-1 (JIS) ルール': RubyAlignments.RUBY_JIS,
			'均等アキ': RubyAlignments.RUBY_EQUAL_AKI,
			'1ルビ文字アキ': RubyAlignments.RUBY_1_AKI,
		}, '揃え', convertInt(def.alignments, 4))

		this.positionList = new NameValueList(this.parent, {
			'上 / 右': RubyKentenPosition.ABOVE_RIGHT,
			'下 / 左': RubyKentenPosition.BELOW_LEFT,
		}, '位置', convertInt(def.position, 0))
		this.positionList.list.preferredSize.width = 141

		this.overhangList = new NameValueList(this.parent, {
			'なし': RubyOverhang.NONE,
			'ルビ1文字分': RubyOverhang.RUBY_OVERHANG_ONE_RUBY,
			'ルビ半文字分': RubyOverhang.RUBY_OVERHANG_HALF_RUBY,
			'親1字分': RubyOverhang.RUBY_OVERHANG_ONE_CHAR,
			'親半分字分': RubyOverhang.RUBY_OVERHANG_HALF_CHAR,
			'無制限': RubyOverhang.RUBY_OVERHANG_NO_LIMIT,
		}, '文字かけ処理', convertInt(def.overhang, 1))
		this.overhangList.label.preferredSize.width = 91

		this.parentSpacingList = new NameValueList(this.parent, {
			'調整しない': RubyParentSpacing.RUBY_PARENT_NO_ADJUSTMENT,
			'両サイド': RubyParentSpacing.RUBY_PARENT_BOTH_SIDES,
			'1-2-1 アキ': RubyParentSpacing.RUBY_PARENT_121_AKI,
			'均等アキ': RubyParentSpacing.RUBY_PARENT_EQUAL_AKI,
			'両端揃え': RubyParentSpacing.RUBY_PARENT_FULL_JUSTIFY,
		}, '親文字間の調整', convertInt(def.parentspacing, 2))
		this.parentSpacingList.group.preferredSize.width = 210

		this.xOffset = convertInt(def.xOffset)
		this.yOffset = convertInt(def.yOffset)

		if (skipmode) {
			this.inputSkipmode = this.parent.add('checkbox', undefined, '重複スキップ')
			this.inputSkipmode.value = def.skipmode
		} else {
			this.inputSkipmode = { value: false }
		}
	}
	getValues() {
		return {
			alignments: this.alignList.value,
			position: this.positionList.value,
			overhang: this.overhangList.value,
			parentspacing: this.parentSpacingList.value,
			xOffset: this.xOffset,
			yOffset: this.yOffset,
		}
	}
	isSkip() {
		return this.inputSkipmode.value
	}
}

export { applyRuby, RubySetting }