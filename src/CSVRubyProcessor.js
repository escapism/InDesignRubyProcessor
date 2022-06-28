import { loadconfig, parseCSV, convertInt, kanaUpper, pfStringTrim } from './modules/utils'
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
	skipmode: false,
})

app.doScript(main, ScriptLanguage.JAVASCRIPT, [], UndoModes.FAST_ENTIRE_SCRIPT)

function main() {
	const dialog = new Window('dialog', 'ルビ設定')

	const rubySettings = new RubySetting(dialog, DEFAULT, true)

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
	const skipmode = rubySettings.isSkip()

	// ファイルオープン
	const fileObj = File.openDialog('', (() => {
		if (/^windows/i.test($.os)) {
			return '*.csv'
		} else {
			return F => {
				return F instanceof Folder || /\.csv$/i.test(F.fsName);
			}
		}
	})())
	if (!fileObj) return

	const open = fileObj.open('r')

	if (!open) {
		alert('ファイルが開けません。')
		return
	}

	// 何も選択されていない場合、全てのテキストフレームを対象にする
	let frames = null
	if (app.activeDocument.selection.length) {
		frames = app.activeDocument.selection
	} else {
		const pages = app.activeDocument.pages
		frames = []
		for (let m = 0; m < pages.length; m++) {
			let frameInPage = pages[m].textFrames
			if (frameInPage.length) {
				frameInPage = Array.prototype.slice.call(frameInPage)
				frames = frames.concat(frameInPage)
			}
		}
	}

	// CSVパース
	// [対象, ルビ, 文脈, フラグ]
	const csv = fileObj.read()
	const parsed = parseCSV(csv)
	const rubyData = []

	for (let i = 0; i < parsed.length; i++) {
		const line = parsed[i]
		if (line.length < 2) continue

		rubyData.push({
			base: line[0], // ルビを振る文字
			ruby: kanaUpper(line[1].trim()).split('　'), // ルビ : 全角スペースで分割
			context: line[2] ? line[2].trim() : '', // 文脈
			flag: convertInt(line[3], 0) // フラグ 0 1 2
		})

		if (rubyData.flag > 2) rubyData.flag = 0
	}

	// 検索条件セット
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

	const doc = app.activeDocument
	let lastPage

	// データセットのループ
	for (let i = 0; i < rubyData.length; i++) {
		const data = rubyData[i]

		const method = data.context ? 'Grep' : 'Text'

		app[`find${method}Preferences`].findWhat = data.context || data.base

		const foundItems = doc[`find${method}`]()

		lastPage = null

		for (let j = 0; j < foundItems.length; j++) {
			const item = foundItems[j]

			// ページ内で1回きり
			if (data.flag === 2) {
				const pageName = item.parentTextFrames[item.parentTextFrames.length - 1].parentPage.name;
				if (lastPage === pageName) {
					continue
				}
				lastPage = pageName
			}

			let target
			if (data.context) {
				const start = item.contents.indexOf(data.base)
				if (start === -1) {
					target = false
				} else {
					target = item.characters.itemByRange(start, start + data.base.length - 1)
				}
			} else {
				target = item
			}

			if (!target) break

			let rubyFlag = false

			if (skipmode) {
				// ターゲット文字列内にルビが振られた文字が1文字でもあるか
				for (let k = 0; k < target.characters.length; k++) {
					rubyFlag = target.characters[k].rubyFlag

					if (rubyFlag instanceof Array) {
						// itemByRange で取得した character のプロパティは配列
						rubyFlag = rubyFlag[0]
					}

					if (rubyFlag) break
				}
			}

			// すでにルビが振られているなら処理しない
			if (!rubyFlag) {
				if (data.ruby.length > 1) {
					for (let k = 0; k < data.ruby.length; k++) {
						if (!data.ruby[k]) continue
						if (k === target.length) break

						applyRuby(target.characters[k], data.ruby[k], false, rubyOption)
					}
				} else {
					applyRuby(target, data.ruby[0], target.length > 1, rubyOption)
				}
			}

			// ドキュメント内で1回きり
			if (data.flag === 1) {
				break
			}
		}
	}

	app.findTextPreferences = NothingEnum.nothing;
	app.findGrepPreferences = NothingEnum.nothing;
	fileObj.close()
}