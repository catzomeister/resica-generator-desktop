'use strict'

const path = require('path')
const _ = require('lodash')
const { defaultInfo, fileConstants } = require('./defaultInfo')

function isInfo(item) {
    return item.type === fileConstants.TYPE_FILE && item.name === fileConstants.INFO_FILENAME
}

function isLogo(item) {
    return item.type === fileConstants.TYPE_FILE && item.name === fileConstants.COMPANY_LOGO_FILENAME
}

function isImage(item) {
    return item.type === fileConstants.TYPE_FILE && (item.extension === '.png' || item.extension === '.jpg')
}

function isSpecificImage(meta, name) {
    return (
        meta.type === fileConstants.TYPE_FILE &&
        (meta.extension === '.png' || meta.extension === '.jpg') &&
        path.parse(meta.name).name === name
    )
}

function isDescriptor(item) {
    return item.type === fileConstants.TYPE_FILE && item.name === fileConstants.DESCRIPTOR_FILENAME
}

function isSubtypeCategory(item) {
    return item.subtype === fileConstants.SUBTYPE_CATEGORY
}

function isDirectory(item) {
    return item.type === fileConstants.TYPE_DIRECTORY
}

function isSubtypeVersion(item) {
    return item.subtype === fileConstants.SUBTYPE_VERSION
}

function isActive(item) {
    return item.status === fileConstants.STATUS_ACTIVE
}

function enhanceCompanyTree(companyTree, selectedVersion) {
    if (companyTree && companyTree.children.find(isInfo)) {
        companyTree.subtype = fileConstants.SUBTYPE_CATALOG
        companyTree.children.filter(isDirectory).forEach(item => {
            item.subtype = fileConstants.SUBTYPE_VERSION
        })
    }
    const workingVersion = companyTree.children.find(item => isSubtypeVersion(item) && item.name === selectedVersion)
    if (workingVersion) {
        workingVersion.selectedVersion = true
        enhanceCategories(workingVersion.children)
    }
}

function enhanceCategories(children, prefix) {
    children.forEach(item => {
        if (
            isDirectory(item) &&
            item.subtype !== fileConstants.SUBTYPE_CATALOG &&
            item.subtype !== fileConstants.SUBTYPE_VERSION
        ) {
            item.subtype = fileConstants.SUBTYPE_CATEGORY
        }
        if (isDirectory(item) && prefix) {
            item.verboseName = `${prefix} / ${item.name}`
        }
        if (isDirectory(item) && item.children.length) {
            enhanceCategories(item.children, item.verboseName || item.name)
        }
    })
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
    getCoverPage,
    enhanceCompanyTree
}
