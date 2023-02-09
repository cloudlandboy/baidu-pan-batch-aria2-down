/*
 * @Author: clboy
 * @Date: 2023-02-03 09:50:29
 * @LastEditors: clboy
 * @LastEditTime: 2023-02-03 10:17:19
 * @Description: 
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */
/*
 * @Author: clboy
 * @Date: 2023-02-01 10:33:27
 * @LastEditors: clboy
 * @LastEditTime: 2023-02-03 09:49:38
 * @Description: 配合油猴脚本实现百度网盘文件夹自动化解析下载，使用内嵌浏览器，自动安装脚本
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */


const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer')
const greasyfork = require('./greasyfork');


async function open(config) {
    console.log("============================= 运行改脚本的必须条件：=============================");
    console.log();
    console.log("                             1.已正确填写配置文件");
    console.log();
    console.log("=================================================================================");
    let args = ['--start-maximized', '--no-default-browser-check', '--disable-infobars'];
    let userDataDir = path.join(__dirname, 'browser-data');
    args.push('--load-extension=' + path.join(__dirname, "program/tampermonkey_stable"));
    const browser = await puppeteer.launch({
        args,
        userDataDir,
        headless: false,
        defaultViewport: null,
        ignoreDefaultArgs: ['--disable-extensions', '--enable-automation'],
    })
    return browser;
}

async function close(browser) {
    return browser.close();
}

async function createPageAfter(browser, page, config) {
    await greasyfork.install(browser, 'https://greasyfork.org/scripts/418182');
    // 关闭油猴扩展的提示页
    let tampermonkeyHome = await browser.targets().find(item => item.url().startsWith('https://www.tampermonkey.net'))
    let tampermonkeyHomePage = await tampermonkeyHome.page()
    await tampermonkeyHomePage.close();
    return page;

}

module.exports = { open, close, createPageAfter }