'use strict'

const path = require('path')

const fontConfig = {
    MAIN_FONT: 'Helvetica',
    MAIN_FONT_BOLD: 'Helvetica-Bold',
    CATEGORY_FONT_SIZE: 55,
    DESCRIPTION_FONT_SIZE: 15
}

const defaultInfo = {
    coverPage: {
        title: {
            font: fontConfig.MAIN_FONT_BOLD,
            color: 'blue',
            size: 40,
            text: 'CATÁLOGO',
            align: 'center'
        },
        company: {
            imagePath: '../../resources/company-logo.png',
            font: fontConfig.MAIN_FONT_BOLD,
            color: 'black',
            size: 60,
            text: 'Acme Labs',
            align: 'center'
        },
        version: {
            font: fontConfig.MAIN_FONT,
            color: 'gray',
            size: 15,
            text: '2021-07-24',
            align: 'center'
        },
        copyright: {
            font: fontConfig.MAIN_FONT,
            color: 'gray',
            size: 15,
            text: `© Acme Labs ${new Date().getFullYear()}`,
            align: 'center'
        },
        whatsapp: {
            font: fontConfig.MAIN_FONT_BOLD,
            imagePath: path.resolve(__dirname, '../../resources/whatsapp-64.png'),
            color: 'gray',
            size: 15,
            text: '0986605577',
            align: 'center'
        },
        instagram: {
            font: fontConfig.MAIN_FONT_BOLD,
            imagePath: path.resolve(__dirname, '../../resources/instagram-64.png'),
            color: 'gray',
            size: 15,
            text: 'acme.labs.ec',
            align: 'center'
        }
    }
}

const fileConstans = {
    TYPE_FILE: 'file',
    TYPE_DIRECTORY: 'directory',
    SUBTYPE_CATALOG: 'catalog',
    SUBTYPE_CATEGORY: 'category',
    SUBTYPE_VERSION: 'version',
    DESCRIPTOR_FILENAME: 'descriptor.json',
    INFO_FILENAME: 'info.json',
    COMPANY_LOGO_FILENAME: 'company-logo.png',
    STATUS_ACTIVE: 'ACT'
}

module.exports = {
    fontConfig,
    defaultInfo,
    fileConstans
}
