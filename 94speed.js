/*
 * @Author: clboy
 * @Date: 2023-09-06 17:30:48
 * @LastEditors: clboy
 * @LastEditTime: 2023-09-07 09:50:16
 * @Description: see http://www.94speed.com/
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */
const fs = require('fs');
const _path = require('path');
const axios = require('axios');
const prompts = require('prompts');

const axiosInstance = axios.create({
    baseURL: 'https://www.94speed.com/api.php',
    headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Origin': 'https://www.94speed.com',
        'Referer': 'https://www.94speed.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
    }
});

(async function () {
    const share = await prompts([{
        type: 'text',
        name: 'slug',
        message: '分享链接: ',
        validate: value => !!extractParam(value),
        format: extractParam,
    }, {
        type: 'text',
        name: 'pwd',
        message: '分享密码: ',
    }]);

    retryRun(async () => await downloadDirectoryFile('', share)).then(() => console.log('all done'));
})()

function extractParam(url) {
    var regex = /s\/([a-zA-Z0-9_-]+)/;
    var match = url.match(regex);
    if (match) {
        return match[1];
    } else {
        regex = /surl=([a-zA-Z0-9_-]+)/;
        match = url.match(regex);
        if (match) {
            return '1' + match[1] + '';
        }
    }
    return false;
}

async function retryRun(fn) {
    try {
        await fn();
    } catch (err) {
        console.log('Error. Try again in three seconds: ' + err.message);
        await sleep(3000);
        await retryRun(fn);
    }
}

async function sleep(second) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(true), second);
    });
}

async function downloadDirectoryFile(path, share) {
    let listRes = await axiosInstance.post('/', {
        type: 'get_list',
        shorturl: share.slug,
        dir: path,
        root: 0,
        pwd: share.pwd,
        page: 1,
        num: 1000,
        order: 'time',
    });

    await retryRun(async function () {
        if (path === '') {
            await retryRun(async function () {
                //get sign
                let signRes = await axiosInstance.post('', {
                    type: 'get_sign',
                    shareid: listRes.data.data.shareid,
                    uk: listRes.data.data.uk
                })
                share.sign = signRes.data.data.data.sign;
                share.time = signRes.data.data.data.timestamp;
            });
        }
    })

    for (let item of listRes.data.list) {
        if (item.isdir == "1") {
            await retryRun(async () => await downloadDirectoryFile(item.path, share));
            continue;
        }

        await retryRun(async () => {
            let downRes = await axiosInstance.post("/", {
                type: 'down_file',
                fs_id: item.fs_id,
                time: share.time,
                uk: listRes.data.data.uk,
                sign: share.sign,
                randsk: listRes.data.data.randsk,
                share_id: listRes.data.data.shareid,
            })

            axios.post('http://localhost:16800/jsonrpc', {
                id: downRes.data.data.md5,
                jsonrpc: '2.0',
                method: "aria2.addUri",
                params: [
                    [downRes.data.data.dlink],
                    {
                        dir: _path.join(__dirname, 'downloads', _path.dirname(item.path)),
                        out: item.server_filename,
                        header: [`User-Agent:${downRes.data.data.user_agent}`]
                    }
                ]
            });
        })
    }
}