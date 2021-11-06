'use strict'

const fs = require('fs')

function loadDescriptor(descriptorMeta) {
    if (descriptorMeta) {
        const descriptorRaw = fs.readFileSync(descriptorMeta.path)
        return JSON.parse(descriptorRaw)
    }
    return []
}

function loadInfo(infoMeta) {
    if (infoMeta) {
        const infoRaw = fs.readFileSync(infoMeta.path)
        return JSON.parse(infoRaw)
    }
    return {}
}

function createPdfStream(directoryName, fileName) {
    return fs.createWriteStream(`${directoryName}/${fileName}.pdf`)
}

module.exports = {
    loadInfo,
    loadDescriptor,
    createPdfStream
}
