# 百度网盘配合油猴自动化解析下载



## 说明

**该程序只是一个自动化脚本，直链解析的工作是由油猴脚本完成的**

当前使用的脚本为：*https://greasyfork.org/scripts/418182*

*验证码需要自己去关注油猴脚本的作者公众号获取*

**下载Releases中完整压缩包解压运行**

使用指定浏览器(需要自己去安装好油猴脚本)+motrix 直接clone代码就能跑起来



## 零配置运行

在网盘根目录下创建 *downloading* 文件夹，将要下载的文件复制到该文件夹下，运行程序即可

*由于目前使用的油猴脚本需要验证码，还是要填写 config.json 文件中的 verifyCode*



## 配置

```json
{
    "verifyCode": "6738",
    "rpcToken": "",
    "rpcPort": "16800",
    "useMotrix": false,
    "motrixExecPath": "/opt/Motrix/motrixdsds",
    "saveDiskPath": "",
    "chromeExecPath": "",
    "defaultChromeExecPath": {
        "linux": "/usr/bin/google-chrome-stable",
        "windows": "\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\""
    }
}
```

- `verifyCode` ：油猴脚本作者公众号获取

- `rpcToken` ：未设置默认即可

- `rpcPort` ：未设置默认即可

- `saveDiskPath` ：下载的文件存放路径，未填写则保存至脚本所在目录下的downloads文件夹中


- `useMotrix` ：使用motrix软件

- `motrixExecPath` ：useMotrix为true时需要指定motrix执行程序所在路径

- `chromeExecPath` ：谷歌浏览器执行程序路径

  
  
  无特殊情况不需要填写会根据当前系统取下面 `defaultChromeExecPath` 中的默认值
  
  使用内置浏览器也不需要填写。可修改 `main.js` 代码改为自己的浏览器
  
  ```javascript
  const open_browser = require('./open-connect-browser');
  //const open_browser = require('./open-embedded-browser');
  ```



## 运行

1. 安装node环境

2. 进入目录安装依赖

   ```shell
   # 如果使用自己的浏览器，安装时可添加--production参数避免下载Chromium： cnpm install --production
   # npm install
   cnpm install
   ```

3. 正确填写config.json

4. 将网盘目录页url或文件路径复制到 link.txt 文件中

5. 启动

   ```shell
   npm start
   ```