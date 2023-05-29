/*
 * @Author: clboy
 * @Date: 2023-02-01 10:27:54
 * @LastEditors: clboy
 * @LastEditTime: 2023-02-02 13:46:24
 * @Description: 触发油猴插件下载逻辑，插件为百度网盘简易下载助手（直链下载复活版），地址：https://greasyfork.org/scripts/418182
 * 
 * 适配其他插件，更改scriptUrl值为插件地址，重写selectFileAfter方法
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */

// 插件主页地址
//const scriptUrl = 'https://greasyfork.org/scripts/418182';
const scriptUrl = 'https://greasyfork.org/scripts/463171';


const process = require('process');


/**
 * @description: 选中文件之后触发脚本下载逻辑
 * @param {object} config 配置
 * @param {string} saveDiskFolder 保存文件目录
 * @return {void}
 */
async function selectFileAfter(page, config, saveDiskFolder) {
    await page.click('#btnEasyHelper');
    await page.waitForSelector('input#dialogBtnGetUrl', { timeout: 10000 });
    let success = false;
    var restryCount = 0;
    while (!success) {
        try {
            await page.evaluate(() => document.querySelector('input#dialogBtnGetUrl').click());
            await page.evaluate((code) => document.querySelector('input#dialogCode').value = code, config.verifyCode);
            await page.evaluate(() => document.querySelector('input#dialogBtnGetUrl').click());
            await page.evaluate((savePath) => document.querySelector('input#dialogTxtSavePath').value = savePath, saveDiskFolder);
            await page.evaluate((rpc) => document.querySelector('input#dialogAriaRPC').value = rpc, `http://localhost:${config.rpcPort}/jsonrpc`);
            await page.waitForSelector('input#dialogBtnAria', { visible: true, timeout: 15000 });
            await page.evaluate(() => document.querySelector('input#dialogBtnAria').click());
            success = true;
            // 等待几秒，防止频繁请求
            await page.waitForTimeout(5000);
        } catch (error) {
            restryCount++;
            if (restryCount > 10) {
                console.log("重试次数太多，程序终止...");
                process.exit(1);
            }
            console.log("出错了，等待5秒后重试");
            await page.waitForTimeout(5000);
        }
    }
}


/**
 * @description: 插件环境检查
 * @param {any} page 标签页
 * @param {object} config 配置
 * @return {void}
 */
async function envCheck(browser, page, config) {
    //判断油猴插件是否安装
    await page.goto('chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#url=&nav=dashboard')
    try {
        let scriptElement = await page.waitForSelector(`a[href="${scriptUrl}"]`);
        let enablerElement = await scriptElement.$x(`../../../td[3]`);
        let toggleResult = await enablerElement[0].$eval('div', el => {
            if (el.className.indexOf('enabler_enabled') < 0) {
                el.click();
                return true;
            }
            return false;
        });
    } catch (err) {
        console.log(err);
        console.log('未正确安装油猴脚本或未启用！！！');
        console.log('脚本地址：' + scriptUrl);
        browser.close();
        throw new Error(err.message);
    }
}

module.exports = { selectFileAfter, envCheck }