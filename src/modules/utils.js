// 設定読み込み
function loadconfig(name, def) {
	const scriptFile = (() => {
		try {
			return app.activeScript;
		}
		catch (err) {
			return File(err.fileName);
		}
	})()
	const configFile = new File(scriptFile.parent + '/RUBY_PROCESSOR.conf')

	if (configFile.exists) {
		$.evalFile(configFile)
	}

	if (typeof CONFIG !== 'undefined' && CONFIG[name]) {
		const obj = {}

		for (let i in def) {
			obj[i] = i in CONFIG[name] ? CONFIG[name][i] : def[i]
		}
		return obj
	}
	return def
}

// CSVパーサ
function parseCSV(csv) {
	const arr = [[]]
	let i = line = 0
	let quotFlag = false
	let item = ''

	while (csv[i]) {
		const c = csv[i]

		switch (c) {
			case '"':
				if (csv[i + 1] === '"') {
					item += '"'
					i++
				} else {
					quotFlag = !quotFlag
				}
				break
			case ',':
				if (quotFlag) {
					item += c
				} else {
					arr[line].push(item)
					item = ''
				}
				break
			case '\r':
				if (quotFlag) {
					item += c
				}
				break
			case '\n':
				if (quotFlag) {
					item += c
				} else if (arr[line].length) {
					arr[line].push(item)
					item = ''

					line++
					arr.push([])
				}
				break
			default:
				item += c
		}
		i++
	}
	arr[line].push(item)

	return arr
}

// string to int
function convertInt(text, def = 0, abs = true) {
	text = full2half(text)
	let num = parseInt(text, 10)

	if (isNaN(num)) {
		num = def
	} else if (abs) {
		num = Math.abs(num)
	}
	return num
}

// 全角数字を半角数字に変換
function full2half(str) {
	if (typeof str !== 'string') return str
	return str.replace(/[０-９]/g, s =>String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
}

// 捨て仮名を変換
function kanaUpper(text) {
	return text.replace(/[ぁぃぅぇぉゕゖっゃゅょゎァィゥェォヵヶッャュョヮ]/g, match => {
		let code = match.charCodeAt()

		if (match === 'ゕ' || match === 'ヵ') {
			code -= 74
		} else if (match === 'ゖ' || match === 'ヶ') {
			code -= 69
		} else {
			code++
		}

		return String.fromCharCode(code)
	})
}

// polyfill
const pfStringTrim = (() => {
	if (String.prototype.trim) return

	String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
	}
})()

export { loadconfig, parseCSV, convertInt, kanaUpper, pfStringTrim }