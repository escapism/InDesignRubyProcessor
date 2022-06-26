class NameValueList {
	constructor(parent, nameValue, label = '', def = 0) {
		this.parent = parent;
		this.group = this.parent.add('group')
		this.label

		if (label) {
			this.label = this.group.add('statictext', undefined, label)
			this.label.justify = 'right'
		}

		this.names = []
		this.values = []

		for (let i in nameValue) {
			this.names.push(i)
			this.values.push(nameValue[i])
		}

		def = Math.min(def, this.values.length - 1)

		this.list = this.group.add('dropdownlist', undefined, this.names)
		this.list.selection = def
		this.value = this.values[def]

		this.list.onChange = (function (_this) {
			return function () {
				_this.changeValue()
			}
		})(this)
	}
	changeValue() {
		this.value = this.values[this.list.selection.index]
	}
}

export default NameValueList