/*
 * @Author: clboy
 * @Date: 2023-02-01 10:33:27
 * @LastEditors: clboy
 * @LastEditTime: 2023-02-03 12:08:52
 * @Description: 配合油猴脚本实现百度网盘文件夹自动化解析下载，需自己安装好油猴脚本
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */
const fs = require('fs');
const url = require("url");
const path = require('path');
const aria2 = require('./aria2');
const runApp = require('./runApp');
const config = require('./config.json');
const extension = require('./extension');
const querystring = require("querystring");
//const open_browser = require('./open-connect-browser');
const open_browser = require('./open-embedded-browser');


const targetPathText = fs.readFileSync(path.join(__dirname, 'link.txt'), { encoding: 'utf-8' })
const targetPathList = targetPathText.split('\r\n').filter(item => item.trim().length > 0).map(item => {
    item = decodeURIComponent(item);
    if (item.startsWith('http') || item.startsWith('https')) {
        var arg = url.parse(item.replace('#', '')).query;
        item = decodeURIComponent(querystring.parse(arg).path);
    }
    return item;
});
console.log(targetPathList);
if (targetPathList.length < 1) {
    console.log("网盘地址配置不正确！！！请在 link.txt 文件中添加网盘路径链接，一行一条");
    return;
}

//目前只支持单个链接
const targetPath = targetPathList[0];

const downComplete = [];

(async function () {
    console.log('ps:启动过程中如果报错，可退出后重新运行多尝试几次');
    console.log('ps:重复运行程序时只要保存文件目录和网盘目录结构没有改变，不会重复下载已完成文件');
    const browser = await open_browser.open(config);
    await aria2.startRpcServer(config, browser);
    var page = await browser.newPage();
    await page.bringToFront();
    page.on('dialog', async dialog => {
        console.log(dialog.message());
        await dialog.dismiss();
    })
    page = await open_browser.createPageAfter(browser, page, config);
    await ensureLogined(page);
    await run(browser, page);
})();


/**
 * @description: 执行文件下载
 * @param {any} page 标签页
 * @param {object} fileItem 文件对象
 * @param {string} folder 相对文件夹路径
 * @return {boolean} 是否触发了脚本
 */
async function actionDownloadFile(page, fileItem, folder) {

    //判断文件是否已经下载
    let fileDiskAbsolutePath = path.join(config.saveDiskPath, folder, fileItem.server_filename);
    if (fs.existsSync(fileDiskAbsolutePath)) {
        //判断是否已经下载完成
        if (!fs.existsSync(fileDiskAbsolutePath + '.aria2')) {
            console.log(`==============================>> ${fileDiskAbsolutePath} 已经存在`);
            return false;
        }
        console.log(`==============================>> ${fileDiskAbsolutePath} 续传`);
    }
    console.log(`==============================>> 开始下载文件：${fileItem.path}`);
    //选中文件
    let fileCheckboxSelector = `.wp-s-pan-table__body-table tr[data-id="${fileItem.fs_id}"] td:first-child`;
    await page.waitForSelector(fileCheckboxSelector, { timeout: 10000 });
    await page.click(fileCheckboxSelector);
    await page.waitForTimeout(1000);
    await extension.selectFileAfter(page, config, path.join(config.saveDiskPath, folder));
    downComplete.push(fileItem.path);
    await aria2.eachAfter();
    await page.bringToFront();
    return true;
}


/**
 * @description: 处理文件夹
 * @param {any} page 标签页
 * @param {string} panPath 网盘路径
 * @return {void}
 */
async function processFolder(page, panPath) {
    if (downComplete.includes(panPath)) {
        return;
    }
    let folders = [];
    let listData = await toFolder(page, panPath);
    await page.waitForTimeout(1500);
    console.log('文件列表：');
    for (const fileItem of listData.list) {
        console.log('\t--' + fileItem.server_filename);
    }

    for (const fileItem of listData.list) {
        let fileId = fileItem.fs_id;
        if (1 == fileItem.isdir) {
            folders.push(fileItem.path);
        } else if (0 == fileItem.isdir && !downComplete.includes(fileItem.path)) {
            let saveFolder = path.dirname(fileItem.path.substring(targetPath.length));
            let needRefresh = await actionDownloadFile(page, fileItem, saveFolder);
            downComplete.push(fileItem.path);
            if (needRefresh) {
                await page.reload();
            }
        }
    }

    for (const folder of folders) {
        await processFolder(page, folder);
        downComplete.push(folder);
    }
}

/**
 * @description: 获取文件夹下文件列表数据
 * @param {any} page 标签页
 * @param {string} panPath 网盘路径
 * @return {void}
 */
async function toFolder(page, panPath) {
    return new Promise((resolve, reject) => {
        page.waitForResponse(res => res.url().startsWith('https://pan.baidu.com/api/list')).then(res => {
            if (res.ok()) {
                res.json().then(json => resolve(json));
                return;
            }
            toFolder(page, panPath);
        }).catch(err => {
            console.log(err);
            toFolder(page, panPath);
        });
        page.goto('https://pan.baidu.com/disk/main#/index?category=all&path=' + encodeURIComponent(panPath));
        console.log('进入目录：' + panPath);
    })
}

/**
 * @description: 确保已经登录
 * @return {void}
 */
async function ensureLogined(page) {
    let cookies = await page.cookies('https://.baidu.com');
    let stoken = cookies.find(item => item.name.toLocaleUpperCase() == 'BDUSS_BFESS');
    if (!stoken) {
        await page.goto('https://pan.baidu.com');
        console.log("======================= 您还未登录网盘，程序将会等待你登录后继续执行 ========================");
        await page.waitForTimeout(5000);
        while (!stoken) {
            cookies = await page.cookies('https://.baidu.com');
            stoken = cookies.find(item => item.name.toLocaleUpperCase() == 'BDUSS_BFESS');
        }
        await page.reload();
        console.log("======================= 登录完成 ========================");
    }
}

async function run(browser, page) {
    try {
        let parentFolder = path.posix.resolve(targetPath, '../');
        let listData = await toFolder(page, parentFolder);
        // 遍历父文件下的文件列表，从中找到目标文件
        for (const fileItem of listData.list) {
            if (fileItem.path === targetPath) {
                // 是否为目录，0：否，1：是
                if (1 == fileItem.isdir) {
                    await processFolder(page, fileItem.path);
                } else {
                    // 单个文件直接下载
                    await page.goto('https://pan.baidu.com/disk/main#/index?category=all&path=' + encodeURIComponent(parentFolder));
                    await actionDownloadFile(page, fileItem, '');
                }
                console.log("============================= 所有文件已添加到下载队列，请等待下载完成再退出 =============================");
                console.log("============================= 退出：ctrl+c =============================");
                open_browser.close();
                return;
            }
        }
        console.log("\n\n============================= 网盘文件不存在，退出：ctrl+c =============================");
        open_browser.close();
    } catch (error) {
        // 重头开始重试
        console.error(error);
        console.error('!!!出错了重试，当前已下载文件数：' + downComplete.length);
        await page.waitForTimeout(5000);
        await page.reload();
        await run(browser, page);
    }
}