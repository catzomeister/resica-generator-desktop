'use strict'

const _ = require('lodash')
const path = require('path')
const dom = require('./resicaDom')
const { log } = require('../../utils/logger')
const { fileNameIsImage } = require('../../utils/filesystem')

function showInitialScreen(labels) {
    dom.setStyleDisplay(dom.DISPLAY_NONE, dom.INITIAL_STATUS)
    if (labels) {
        dom.setInnerText(labels['select.a.product'], ['lblSelectProduct'])
            .setInnerText(labels['print'], ['btnPrintPdf'])
            .setInnerText(labels['general.conf'], ['lblGeneralConf'])
            .setInnerText(labels['general.conf.title'], ['lblTitle'])
            .setInnerText(labels['general.conf.company'], ['lblCompany'])
            .setInnerText(labels['general.conf.whatsapp'], ['lblWhatsapp'])
            .setInnerText(labels['general.conf.instagram'], ['lblInstagram'])
            .setInnerText(labels['general.conf.print.options'], ['lblrintOptions'])
            .setInnerText(labels['general.conf.print.options.show.code'], ['lblShowCode'])
            .setInnerText(labels['general.conf.print.options.show.name'], ['lblShowName'])
            .setInnerText(labels['general.conf.print.options.show.description'], ['lblShowDescription'])
            .setInnerText(labels['general.conf.print.options.show.prices'], ['lblShowPrices'])
            .setInnerText(labels['general.conf.print.options.show.observations'], ['lblShowObservations'])
            .setValue(labels['save'], ['btnSaveConfiguration'])
            .setInnerText(labels['item.data'], ['lblItem'])
            .setInnerText(labels['item.data.code'], ['lblCode'])
            .setInnerText(labels['item.data.name'], ['lblName'])
            .setInnerText(labels['item.data.description'], ['lblDescription'])
            .setInnerText(labels['item.data.prices'], ['lblPrices'])
            .setInnerText(labels['item.data.prices.size'], ['lblSize'])
            .setInnerText(labels['item.data.prices.price'], ['lblPrice'])
            .setValue(labels['add'], ['btnAddPrice'])
            .setInnerText(labels['item.data.prices.table.size'], ['lblTableSize'])
            .setInnerText(labels['item.data.prices.table.price'], ['lblTablePrice'])
            .setInnerText(labels['item.data.prices.table.delete'], ['lblTableRemove'])
            .setInnerText(labels['item.data.observations'], ['lblObservations'])
            .setInnerText(labels['item.data.active'], ['lblActive'])
            .setValue(labels['save'], ['btnSaveProduct'])
            .setInnerText(labels['create.example.company'], ['btnCreateExampleCompany'])
    }
}

function showGeneralConfiguration(info) {
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'catalog-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, [
            'catalog-resume',
            'notification-area',
            'item-form',
            'notification-area',
            'uploaderFileName',
            'uploaderCategoryFiles',
            'uploaderWallArt'
        ])
        .setValue(info.title, ['title'])
        .setValue(info.company, ['company'])
        .setValue(info.whatsapp, ['whatsapp'])
        .setValue(info.instagram, ['instagram'])
        .setChecked(!!info.fields.showCode, ['showCode'])
        .setChecked(!!info.fields.showName, ['showName'])
        .setChecked(!!info.fields.showDescription, ['showDescription'])
        .setChecked(!!info.fields.showPrices, ['showPrices'])
        .setChecked(!!info.fields.showObservations, ['showObservations'])
    log.debug('showPrices: ', document.getElementById('showPrices').value)
}

function showPrintPreviewInfo(info, version) {
    log.debug('$info: ', info)
    dom.setInnerText(info.title, ['title'])
        .setInnerText(info.company, ['company-text'])
        .setInnerText(version, ['version-text'])
        .setScr(info.logoPath, ['logo-img'])
        .setScr(`© ${info.company} ${new Date().getFullYear()}`, ['copyright-text'])
        .setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
        .setStyleDisplay(dom.DISPLAY_FLEX, ['catalog-resume'])
        .setStyleDisplay(dom.DISPLAY_NONE, [
            'notification-area',
            'catalog-form',
            'item-form',
            'uploaderFileName',
            'uploaderCategoryFiles',
            'uploaderWallArt'
        ])
}

function showProductInfo(itemName, itemPath, product, showProductsList) {
    dom.setStyleDisplay(dom.DISPLAY_FLEX, ['uploaderFileName', 'uploaderWallArt'])
        .setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'item-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'notification-area', 'catalog-form'])
        .setInnerText(itemName, ['uploaderFileName'])
        .setScr(itemPath, ['itemImg'])

    showProductsList
        ? dom.setStyleDisplay(dom.DISPLAY_FLEX, ['uploaderCategoryFiles'])
        : dom.setStyleDisplay(dom.DISPLAY_NONE, ['uploaderCategoryFiles'])

    if (product) {
        dom.setValue(product.code, ['code'])
            .setValue(product.name, ['name'])
            .setValue('', ['size'])
            .setValue('', ['price'])
            .setValue(product.description, ['description'])
            .setValue(product.observations, ['observations'])
            .setChecked(product.status === 'ACT' ? true : false, ['active'])

        const pricesTable = document.getElementById('pricesTable')
        log.debug('$pricesTable: ', pricesTable.rows)
        const pricesTableLength = pricesTable.rows.length
        for (let i = 1; i < pricesTableLength; i++) {
            log.debug('index: ', i, pricesTableLength)
            pricesTable.deleteRow(-1)
        }
        log.debug('product.prices: ', JSON.stringify(product.prices, null, 2))
        product?.prices?.forEach(p => {
            window.addPrice({ value: p.size }, { value: p.price })
        })
    }
}

function showImagesList(fileNames) {
    if (!_.isEmpty(fileNames)) {
        log.debug('showImagesList')

        const imageNames = fileNames.filter(fileNameIsImage)
        let images = imageNames.map(imageName => {
            const parsedPath = path.parse(imageName)
            return {
                name: parsedPath.name,
                ext: parsedPath.ext
            }
        })
        images = _.sortBy(
            _.uniqBy(images, img => img.name),
            ['name']
        )
        log.debug('$images: ', images)

        const categoryProductsDataList = document.getElementById('categoryProductsDataList')
        while (categoryProductsDataList.firstChild) {
            categoryProductsDataList.removeChild(categoryProductsDataList.lastChild)
        }

        images.forEach(productImage => {
            const newOptionElement = document.createElement('option')
            newOptionElement.textContent = productImage.name
            newOptionElement.setAttribute('data-file-ext', productImage.ext)
            categoryProductsDataList.appendChild(newOptionElement)
        })

        showCategoryFilesSelector()
    }
}

function showNotification(message, showCreateCatalogDirectoryButton) {
    const notifMsg = document.getElementById('notification-text')
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace'])
        .setStyleDisplay(dom.DISPLAY_NONE, [
            'catalog-resume',
            'catalog-form',
            'item-form',
            'uploaderFileName',
            'uploaderCategoryFiles',
            'uploaderWallArt'
        ])
        .setStyleDisplay(dom.DISPLAY_FLEX, ['notification-area'])

    notifMsg.innerText = message

    if (showCreateCatalogDirectoryButton) {
        dom.setStyleDisplay(dom.DISPLAY_FLEX, ['notification-action'])
    } else {
        dom.setStyleDisplay(dom.DISPLAY_NONE, ['notification-action'])
    }
}

function showCategoryFilesSelector() {
    document.getElementById('selectedProduct').value = ''
    dom.setStyleDisplay(dom.DISPLAY_NONE, ['uploaderFileName', 'uploaderWallArt', 'workspace']).setStyleDisplay(
        dom.DISPLAY_FLEX,
        ['uploaderCategoryFiles']
    )
}

module.exports = {
    showInitialScreen,
    showGeneralConfiguration,
    showPrintPreviewInfo,
    showProductInfo,
    showImagesList,
    showNotification
}
