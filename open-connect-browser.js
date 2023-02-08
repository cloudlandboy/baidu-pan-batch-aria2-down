/*
 * @Author: clboy
 * @Date: 2023-02-02 17:33:14
 * @LastEditors: clboy
 * @LastEditTime: 2023-02-03 09:06:06
 * @Description: 
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */
const axios = require('axios');
const runApp = require('./runApp');
const extension = require('./extension');
const puppeteer = require('puppeteer-core');

async function open(config) {
    console.log("============================= 运行改脚本的必须条件：=============================");
    console.log();
    console.log("                             1.已正确填写配置文件");
    console.log("                             2.已正确安装油猴扩展和插件");
    console.log("                             3.已在浏览器中登录百度网盘");
    console.log("                             4.没有正在运行的chrome浏览器(强制关闭)");
    console.log("                             5.系统已安装Motrix程序并启动(自动运行)");
    console.log();
    console.log("================================================================================");
    await runApp(config.chromeExecPath, '--remote-debugging-port=9222', true, ['/opt/google/chrome']);
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            axios.get('http://127.0.01:9222/json/version').then(async res => {
                browser = await puppeteer.connect({
                    browserWSEndpoint: res.data.webSocketDebuggerUrl,
                    defaultViewport: null
                })
                resolve(browser);
            })
        }, 2000)
    })
}

async function close(browser) {
    return false;
}

async function createPageAfter(browser, page, config) {
    await extension.envCheck(browser, page, config);
    return page;
}

module.exports = { open, close, createPageAfter }