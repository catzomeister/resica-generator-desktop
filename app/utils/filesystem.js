'use strict'

const fs = require('fs')
const path = require('path')
const { log } = require('./logger')
const { fileConstants } = require('./defaultInfo')

function loadDescriptor(descriptorRef) {
    try {
        if (descriptorRef) {
            const descriptorRaw = fs.readFileSync(
                descriptorRef.path ||
                    (descriptorRef.endsWith(fileConstants.DESCRIPTOR_FILENAME)
                        ? descriptorRef
                        : path.resolve(descriptorRef, fileConstants.DESCRIPTOR_FILENAME))
            )
            return JSON.parse(descriptorRaw)
        }
        return []
    } catch (error) {
        log.debug('Error on loadDescriptor: ', error)
        return []
    }
}

function loadInfo(infoRef) {
    try {
        if (infoRef) {
            console.log('infoRef: ', infoRef)
            const infoRaw = fs.readFileSync(
                infoRef.path ||
                    (infoRef.endsWith(fileConstants.INFO_FILENAME)
                        ? infoRef
                        : path.resolve(infoRef, fileConstants.INFO_FILENAME))
            )
            return JSON.parse(infoRaw)
        }
        return {}
    } catch (error) {
        log.debug('Error on loadInfo: ', error)
        return {}
    }
}

function createPdfStream(directoryName, fileName) {
    return fs.createWriteStream(`${directoryName}/${fileName}.pdf`)
}

function companyConfFilesExist(files) {
    return files.includes(fileConstants.INFO_FILENAME) && files.includes(fileConstants.COMPANY_LOGO_FILENAME)
}

function fileNameIsImage(fileName) {
    return fileName.endsWith('.jpg') || fileName.endsWith('.png')
}

module.exports = {
    loadInfo,
    loadDescriptor,
    createPdfStream,
    companyConfFilesExist,
    fileNameIsImage
}
