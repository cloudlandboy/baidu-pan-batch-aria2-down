/**
 * @description: 安装https://greasyfork.org网站的油猴插件
 * @param {*} browser 浏览器
 * @param {*} greasyforkUrl 脚本地址
 * @return {*}
 */
async function install(browser, greasyforkUrl) {
    const page = await browser.newPage();
    await page.goto(greasyforkUrl);
    await page.click('.install-link');
    let installBtn = await page.waitForSelector('#script-content>#preinstall-modal .modal__btn-primary');
    await page.bringToFront();
    await installBtn.click();
    return new Promise((resolve, reject) => {
        let waitForFinished = false;
        let waitForId = setInterval(async () => {
            let targets = await browser.targets();
            let confirmTarget = await targets.find(item => /chrome-extension:\/\/.*\/ask.html/.test(item.url()));
            if (waitForFinished || !confirmTarget) {
                console.log("如等待时间过长，请关闭程序重新运行");
                return;
            }
            waitForFinished = true;
            clearInterval(waitForId);
            let confirmPage = await confirmTarget.page();
            let confirmBtn = await confirmPage.waitForSelector('.ask_action_buttons input:nth-child(1)', { timeout: 5000 });
            await confirmBtn.click();
            console.log("============================= 安装脚本完成 =============================");
            page.close();
            resolve();
        }, 2000);
    })
}

module.exports = { install }