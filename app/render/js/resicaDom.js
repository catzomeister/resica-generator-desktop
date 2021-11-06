'use strict'
class ResicaDom {
    constructor() {
        this.DISPLAY_NONE = 'none'
        this.DISPLAY_BLOCK = 'block'
        this.DISPLAY_FLEX = 'flex'
        this.INITIAL_STATUS = ['workspace', 'uploaderFileName', 'uploaderCategoryFiles', 'uploaderWallArt']
    }

    getAttribute(attribute, id) {
        return document.getElementById(id)[attribute]
    }

    getValue(id) {
        return document.getElementById(id).value
    }

    getChecked(id) {
        return document.getElementById(id).checked
    }

    setStyleDisplay(value, ids) {
        ids.forEach(id => {
            document.getElementById(id).style.display = value
        })

        return this
    }

    setInnerText(value, ids) {
        ids.forEach(id => {
            document.getElementById(id).innerText = value
        })

        return this
    }

    setScr(value, ids) {
        ids.forEach(id => {
            document.getElementById(id).src = value
        })

        return this
    }

    setValue(value, ids) {
        ids.forEach(id => {
            document.getElementById(id).value = value
        })

        return this
    }

    setChecked(value, ids) {
        ids.forEach(id => {
            document.getElementById(id).checked = value
        })

        return this
    }
}

const resicaDom = new ResicaDom()

module.exports = resicaDom
