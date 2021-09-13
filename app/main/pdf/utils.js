'use strict'

const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const { defaultInfo, fileConstans } = require('./defaultInfo')

function isInfo(item) {
    return item.type === fileConstans.TYPE_FILE && item.name === fileConstans.INFO_FILENAME
}

function isLogo(item) {
    return item.type === fileConstans.TYPE_FILE && item.name === fileConstans.COMPANY_LOGO_FILENAME
}

function isImage(item) {
    return item.type === fileConstans.TYPE_FILE && (item.extension === '.png' || item.extension === '.jpg')
}

function isSpecificImage(meta, name) {
    return (
        meta.type === fileConstans.TYPE_FILE &&
        (meta.extension === '.png' || meta.extension === '.jpg') &&
        path.parse(meta.name).name === name
    )
}

function isDescriptor(item) {
    return item.type === fileConstans.TYPE_FILE && item.name === fileConstans.DESCRIPTOR_FILENAME
}

function isSubtypeCategory(item) {
    return item.subtype === fileConstans.SUBTYPE_CATEGORY
}

function isDirectory(item) {
    return item.type === fileConstans.TYPE_DIRECTORY
}

function isSubtypeVersion(item) {
    return item.subtype === fileConstans.SUBTYPE_VERSION
}

function isActive(item) {
    return item.status === fileConstans.STATUS_ACTIVE
}

function enhanceCompanyTree(companyTree, selectedVersion) {
    if (companyTree && companyTree.children.find(isInfo)) {
        companyTree.subtype = fileConstans.SUBTYPE_CATALOG
        companyTree.children.filter(isDirectory).forEach(item => {
            item.subtype = fileConstans.SUBTYPE_VERSION
        })
    }
    const workingVersion = companyTree.children.find(item => isSubtypeVersion(item) && item.name === selectedVersion)
    if (workingVersion) {
        enhanceCategories(workingVersion.children)
    }
}

function enhanceCategories(children, prefix) {
    children.forEach(item => {
        if (isDirectory(item) && item.subtype !== fileConstans.SUBTYPE_CATALOG && item.subtype !== fileConstans.SUBTYPE_VERSION) {
            item.subtype = fileConstans.SUBTYPE_CATEGORY
        }
        if (isDirectory(item) && prefix) {
            item.verboseName = `${prefix} / ${item.name}`
        }
        if (isDirectory(item) && item.children.length) {
            enhanceCategories(item.children, item.verboseName || item.name)
        }
    })
}

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

function getCoverPage(companyTree, selectedVersion, info) {
    const logoItem = companyTree.children.find(isLogo)

    return _.merge({}, defaultInfo.coverPage, {
        title: {
            text: info.title
        },
        company: {
            text: info.company,
            imagePath: logoItem.path
        },
        version: {
            text: selectedVersion
        },
        whatsapp: {
            text: info.whatsapp
        },
        instagram: {
            text: info.instagram
        },
        copyright: {
            text: `© ${info.company} ${new Date().getFullYear()}`
        }
    })
}

module.exports = {
    isInfo,
    isLogo,
    isImage,
    isSpecificImage,
    isActive,
    isDescriptor,
    isDirectory,
    isSubtypeCategory,
    loadInfo,
    loadDescriptor,
    getCoverPage,
    enhanceCompanyTree
}
