'use strict'

const _ = require('lodash')
const path = require('path')
const dom = require('./resicaDom')
const { log } = require('../../utils/logger')
const { fileNameIsImage } = require('../../utils/filesystem')

function showInitialScreen() {
    dom.setStyleDisplay(dom.DISPLAY_NONE, dom.INITIAL_STATUS)
}

function showGeneralConfiguration(info) {
    dom.setStyleDisplay(dom.DISPLAY_BLOCK, ['workspace', 'catalog-form'])
        .setStyleDisplay(dom.DISPLAY_NONE, ['catalog-resume', 'notification-area', 'item-form'])
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
