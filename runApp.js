/*
 * @Author: clboy
 * @Date: 2023-02-02 11:06:31
 * @LastEditors: clboy
 * @LastEditTime: 2023-02-02 12:28:23
 * @Description: 
 * 
 * Copyright (c) 2023 by clboy email: syl@clboy.cn, All Rights Reserved.
 */
const fs = require('fs');
const path = require('path');
const process = require('process');
const find_process = require('find-process');
const child_process = require('child_process');


async function runApp(execPath, param, ensureSingle, findPidNameList) {
    if (path.isAbsolute(execPath)) {
        execPath = getRealPath(execPath);
    }

    if (Array.isArray(findPidNameList)) {
        findPidNameList.push(execPath);
    } else {
        findPidNameList = [execPath];
    }
    if (ensureSingle) {
        for (let name of findPidNameList) {
            let pidMatchList = await find_process('name', name);
            for (const pidItem of pidMatchList) {
                process.kill(pidItem.pid);
            }
        }
    }
    child_process.exec(execPath + (param ? " " + param : ""));
}

function getRealPath(path) {
    let stats = fs.lstatSync(path);
    if (stats.isSymbolicLink()) {
        return fs.readlinkSync(path);
    }
    return path;
}

module.exports = runApp;
