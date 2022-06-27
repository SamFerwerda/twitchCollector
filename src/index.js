const p = require('puppeteer');
const { URLS, STREAMERS } = require('./constants');
require('dotenv').config({path:'local.env'});

const delay = ms => new Promise(res => setTimeout(res, ms));

async function loginToTwitch(page){
    await page.goto(URLS.inventory, {waitUntil: 'load'});

    await delay(3000);

    // login
    // username id is login-username
    // password id is password-input

    await page.focus('#login-username')
    await page.keyboard.type(process.env.NAME)

    await page.focus('#password-input')
    await page.keyboard.type(process.env.PASSWORD)

    await delay(3000);

    await page.keyboard.press('Enter');

    await delay(10000);

    // accept cookies
    try {
        await page.click('button[data-a-target="consent-banner-accept"]');
    } catch (error){
        console.log(error);
    }
    await delay(5000);
}

async function claimRewards(page){
    try {
        while (true){
            await page.click('button[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]');
        }
    } catch (error){
        // means no more claims haha
        return;
    }
}

(async function(){

    // create browser
    const browser = await p.launch({headless:false});

    // create page
    const page = await browser.newPage();

    await loginToTwitch(page);

    await delay(3000);

    while (true) {
        await claimRewards(page);
        await delay(process.env.INTERVAL);
        await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        await delay(3000);
    }
})();