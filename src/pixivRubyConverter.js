import { loadconfig } from './modules/utils'
import { applyRuby, RubySetting } from './modules/rubyUtils'
import ActionButtons from './modules/actionButtons'

/** デフォルト設定 */
const DEFAULT = loadconfig(NAME, {
	alignments: 4,
	position: 0,
	overhang: 1,
	parentspacing: 2,
	xOffset: 0,
	yOffset: 0,
})

app.doScript(main, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT);

function main() {
	const dialog = new Window('dialog', 'ルビ設定')

	const rubySettings = new RubySetting(dialog, DEFAULT)

	new ActionButtons(dialog, {
		width: 96,
		height: 24
	})

	const ret = dialog.show()

	// キャンセル
	if (ret != 1) {
		return
	}

	const rubyOption = rubySettings.getValues()

	const PATTERN = '\\[\\[rb: *(.+?) *> *(.+?) *\\]\\]'

	app.findGrepPreferences = NothingEnum.nothing;
	app.findChangeGrepOptions.kanaSensitive = true;
	app.findChangeGrepOptions.widthSensitive = true;
	app.findChangeGrepOptions.includeFootnotes = false;
	app.findChangeGrepOptions.includeHiddenLayers = false;
	app.findChangeGrepOptions.includeLockedLayersForFind = false;
	app.findChangeGrepOptions.includeLockedStoriesForFind = false;
	app.findChangeGrepOptions.includeMasterPages = false;

	app.findGrepPreferences.findWhat = PATTERN

	const found = app.activeDocument.findGrep()

	for (let i = 0; i < found.length; i++) {
		const chars = found[i]

		const matched = RegExp(PATTERN).exec(chars.contents),
			base = matched[1],
			ruby = matched[2]

		chars.contents = base

		applyRuby(chars, ruby, true, rubyOption)
	}
	
	app.findGrepPreferences = NothingEnum.nothing;
}