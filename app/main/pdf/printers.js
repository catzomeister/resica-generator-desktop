'use strict'

const dirTree = require('directory-tree')
const PDFDocument = require('pdfkit')
const {
    isInfo,
    isImage,
    isSpecificImage,
    isActive,
    isDescriptor,
    isDirectory,
    isSubtypeCategory,
    getCoverPage,
    enhanceCompanyTree
} = require('../../utils/companyTree')
const { loadInfo, loadDescriptor, createPdfStream } = require('../../utils/filesystem')
const { fontConfig } = require('../../utils/defaultInfo')

function getTextPrinter(pdfDoc) {
    return (textDef, x, y) => {
        const { font, color, size, text, align, continued, width, height, lineGap } = textDef
        pdfDoc.font(font).fillColor(color).fontSize(size)
        x && y ? pdfDoc.text(text, x, y) : pdfDoc.text(text, { align, continued, width, height, lineGap })
    }
}

function getCoverPagePrinter(doc, coverPage) {
    return () => {
        const printText = getTextPrinter(doc)
        const printBlankPage = getBlankPagePrinter(doc)
        // Title
        printText(coverPage.title)
        doc.moveDown(0.25)
        // Company Name
        printText(coverPage.company)
        doc.moveUp(0.2)
        // Version
        printText(coverPage.version)
        // Logo
        doc.image(coverPage.company.imagePath, doc.page.width / 2 - 150, 265, {
            fit: [300, 300],
            align: 'center',
            valign: 'center'
        })
        doc.moveDown(22)
        printText(coverPage.copyright)
        // Whatsapp
        doc.image(coverPage.whatsapp.imagePath, doc.page.width / 2 + 60, 655, {
            fit: [32, 32],
            align: 'center',
            valign: 'center'
        })
        printText(coverPage.whatsapp, doc.page.width / 2 + 96, 665)
        // Instagram
        doc.image(coverPage.instagram.imagePath, doc.page.width / 2 + 60, 705, {
            fit: [32, 32],
            align: 'center',
            valign: 'center'
        })
        printText(coverPage.instagram, doc.page.width / 2 + 96, 715)
        printBlankPage()
    }
}

function getCategoryPagePrinter(pdfDoc) {
    const printText = getTextPrinter(pdfDoc)
    return name => {
        pdfDoc.fontSize(10)
        pdfDoc.moveDown(10)
        printText({
            text: name,
            font: fontConfig.MAIN_FONT_BOLD,
            color: 'black',
            size: fontConfig.CATEGORY_FONT_SIZE,
            align: 'center'
        })
    }
}

function getCatalogPagePrinter(pdfDoc, info) {
    return item => {
        const printText = getTextPrinter(pdfDoc)
        if (info.fields.showCode) {
            printText({
                text: 'C??digo: ',
                font: fontConfig.MAIN_FONT_BOLD,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: true,
                height: 20
            })
            printText({
                text: item.code,
                font: fontConfig.MAIN_FONT,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: false,
                lineGap: 2
            })
        }
        if (info.fields.showName) {
            printText({
                text: 'Nombre: ',
                font: fontConfig.MAIN_FONT_BOLD,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: true,
                height: 20
            })
            printText({
                text: item.name,
                font: fontConfig.MAIN_FONT,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: false,
                lineGap: 2
            })
        }
        if (info.fields.showDescription) {
            printText({
                text: 'Descripci??n: ',
                font: fontConfig.MAIN_FONT_BOLD,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: true,
                height: 80
            })
            printText({
                text: item.description,
                font: fontConfig.MAIN_FONT,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: false,
                lineGap: 2
            })
        }
        if (info.fields.showPrices) {
            printText({
                text: 'Precios: ',
                font: fontConfig.MAIN_FONT_BOLD,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: true,
                height: 60
            })
            printText({
                text: item.prices.reduce(
                    (acc, cur, curIndex, arr) => {
                        acc.pricesText = acc.pricesText.concat(
                            cur.size,
                            ': ',
                            cur.price,
                            curIndex < arr.length - 1 ? ', ' : ''
                        )
                        return acc
                    },
                    { pricesText: '' }
                ).pricesText,
                font: fontConfig.MAIN_FONT,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: false,
                lineGap: 2
            })
        }
        if (info.fields.showObservations) {
            printText({
                text: 'Observaciones: ',
                font: fontConfig.MAIN_FONT_BOLD,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: true,
                height: 20
            })
            printText({
                text: item.observations,
                font: fontConfig.MAIN_FONT,
                color: 'black',
                size: fontConfig.DESCRIPTION_FONT_SIZE,
                continued: false,
                lineGap: 2
            })
        }
        pdfDoc.image(item.imagePath, pdfDoc.page.width / 2 - 235, 60, {
            fit: [470, 800],
            align: 'center',
            valign: 'center'
        })
    }
}

function getBlankPagePrinter(pdfDoc) {
    return () => {
        pdfDoc.addPage()
    }
}

function getEofPrinter(pdfDoc) {
    return () => {
        pdfDoc.end()
    }
}

function getCatalogBodyPrinter(doc, catalogTree, info) {
    return () => {
        printCatalog(
            doc,
            catalogTree.children.find(c => !!c.selectedVersion),
            info
        )
    }
}

function printCatalog(doc, catalogTree, info) {
    const printCategoryPage = getCategoryPagePrinter(doc)
    const printCatalogPage = getCatalogPagePrinter(doc, info)
    const printBlankPage = getBlankPagePrinter(doc)
    const imagesMeta = catalogTree.children.filter(isImage)
    const descriptorMeta = catalogTree.children.find(isDescriptor)
    const directoriesMeta = catalogTree.children.filter(isDirectory)
    const descriptor = loadDescriptor(descriptorMeta)

    // print images
    descriptor.filter(isActive).forEach(item => {
        const imageMeta = imagesMeta.find(meta => isSpecificImage(meta, item.code))
        if (imageMeta) {
            item.imagePath = imageMeta.path
            printCatalogPage(item)
            printBlankPage()
        }
    })

    // print categories
    directoriesMeta.forEach(directory => {
        if (isSubtypeCategory(directory)) {
            printCategoryPage(directory.verboseName || directory.name)
            printBlankPage()
        }
        printCatalog(doc, directory, info)
    })
}

function createDocumentComponents(catalogDirectory, selectedVersion) {
    const companyTree = dirTree(catalogDirectory)
    enhanceCompanyTree(companyTree, selectedVersion)
    const infoMeta = companyTree.children.find(isInfo)
    const info = loadInfo(infoMeta)
    const coverPage = getCoverPage(companyTree, selectedVersion, info)
    const doc = new PDFDocument({ size: 'A4' })
    doc.pipe(
        createPdfStream(catalogDirectory, `${coverPage.title.text} ${coverPage.company.text} ${coverPage.version.text}`)
    )
    const printCoverPage = getCoverPagePrinter(doc, coverPage)
    const printText = getTextPrinter(doc)
    const printCatalogBody = getCatalogBodyPrinter(doc, companyTree, info)
    const printCatalogPage = getCatalogPagePrinter(doc)
    const printBlankPage = getBlankPagePrinter(doc)
    const printEof = getEofPrinter(doc)

    return {
        printCoverPage,
        printText,
        printCatalogBody,
        printCatalogPage,
        printBlankPage,
        printEof,
        companyTree,
        doc
    }
}

module.exports = {
    getTextPrinter,
    createDocumentComponents
}
