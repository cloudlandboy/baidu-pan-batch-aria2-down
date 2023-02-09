const os = require('os');
const path = require('path');
const axios = require('axios');
const runApp = require('./runApp');

var page;
async function startRpcServer(config, browser) {
    if (config.useMotrix) {
        return runApp(config.motrixExecPath, '', false);
    }

    let aria2BinPath = '';
    if (os.platform == 'win32') {
        aria2BinPath = path.join(__dirname, 'program/aria2-win/aria2c.exe');
    } else if (os.platform == 'linux') {
        console.log("============================= 运行改脚本的必须条件：=============================");
        console.log();
        console.log("                             你当前为linux操作系统，请确保已经安装了aria2");
        console.log();
        console.log("=================================================================================");
        aria2BinPath = 'aria2c';
    } else {
        console.log(os.platform);
        throw new Error('不支持的操作系统');
    }
    await runApp(aria2BinPath, `--enable-rpc=true --rpc-listen-port=${config.rpcPort}`, true);
    page = await browser.newPage();
    let connectionSuccess = false;
    let retryCont = 1;
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    client.on('Network.webSocketHandshakeResponseReceived', params => {
        connectionSuccess = params.response.requestHeadersText.indexOf('jsonrpc') > 0;
        console.log('✓ 连接rpc服务成功');
    });
    //等待rpc服务启动完成，受电脑性能影响，启动时间可能有所延长
    while (!connectionSuccess) {
        await page.goto("file:///" + path.join(__dirname, 'program/aria2-webui/index.html'))
        console.log("等待连接rpc服务......");
        await page.bringToFront();
        await page.waitForTimeout(3000);
        let settingMenu = await page.waitForSelector('div.navbar-collapse>ul:nth-child(2) a.dropdown-toggle');
        await settingMenu.click()
        await page.click('a[ng-click="changeCSettings()"]');
        let portInput = await page.waitForSelector('input[ng-model="connection.conf.port"]');
        await changeInputValue(page, portInput, '' + config.rpcPort);
        if (config.rpcToken) {
            let tokenInput = await page.$('input[ng-model="connection.conf.auth.token"]')
            await changeInputValue(page, tokenInput, config.rpcToken);
        }
        await page.click('button[ng-click="$close()"]');
        await page.waitForTimeout(4000);
        if (retryCont % 5 === 0) {
            // 可能aria2没启动起来
            await runApp(aria2BinPath, `--enable-rpc=true --rpc-listen-port=${config.rpcPort}`, true);
            console.log(`重试次数：${retryCont}，尝试重启aria2'`);
        }
        retryCont++;
    }
}

async function changeInputValue(page, elHandle, value) {
    await elHandle.focus();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await elHandle.type(value);
}

async function eachAfter() {
    await page.bringToFront();
    await page.waitForTimeout(3000);
}
module.exports = { startRpcServer, eachAfter }