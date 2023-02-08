# 百度网盘配合油猴自动化解析下载



## 说明

使用内置浏览器和aria2请下载Releases中完整压缩包

使用指定浏览器和需要自己去安装好油猴脚本

## 配置

```json
{
    "verifyCode": "1234",
    "rpcToken": "",
    "rpcPort": "16800",
    "saveDiskPath": "C:\\Users\\clboy\\Desktop\\aa",
    "chromeExecPath": "/usr/bin/google-chrome-stable",
    "motrixExecPath": "/opt/Motrix/motrix",
    "useMotrix": false
}
```

- `verifyCode` ：油猴脚本作者公众号获取

- `rpcToken` ：未设置默认即可

- `rpcPort` ：未设置默认即可

- `saveDiskPath` ：下载的文件存放路径

- `chromeExecPath` ：谷歌浏览器执行程序路径，默认使用内置浏览器，不需要填写。可修改 `main.js` 代码改为自己的浏览器

  ```javascript
  const open_browser = require('./open-connect-browser');
  //const open_browser = require('./open-embedded-browser');
  ```

- `motrixExecPath` ：useMotrix为true时需要指定motrix执行程序所在路径

- `useMotrix` ：使用启动motrix软件



## 运行

1. 安装node环境

2. 进入目录安装依赖

   ```shell
   npm install
   ```

3. 正确填写config.json

4. 将网盘目录页url或文件路径复制到 link.txt 文件中

5. 启动

   ```shell
   npm start
   ```