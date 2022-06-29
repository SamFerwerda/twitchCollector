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

async function setStreamPage(page){
    for (let index = 0; index < STREAMERS.streamersToWatchOrdered.length; index++) {
        const streamer = STREAMERS.streamersToWatchOrdered[index];
        const url = `https://www.twitch.tv/${streamer}`;

        // go to streamers page
        await page.goto(url, {waitUntil: 'load' });

        await delay(10000);

        // check if streamer is live
        const isLive =  await page.evaluate(() => {
            let elements = document.getElementsByClassName('live-time');
            return elements.length;});

        console.log(isLive);
        if (isLive){
            return;
        }
    }
}

(async function(){

    // create browser
    const browser = await p.launch( {executablePath: '/Program Files (x86)/Google/Chrome/Application/Chrome',
    headless:false, 
    defaultViewport:null,
    devtools: true,
    //args: ['--window-size=1920,1170','--window-position=0,0']
    args: ["--window-size=1920,1080", "--window-position=1921,0"]});

    // create page
    const inventoryPage = await browser.newPage();

    await loginToTwitch(inventoryPage);

    await delay(3000);

    // doesnt work atm because of video not loading
    const streamPage = await browser.newPage();

    while (true) {
        await claimRewards(inventoryPage);
        // Doesnt work atm
        await setStreamPage(streamPage); 
        await delay(process.env.INTERVAL);
        await inventoryPage.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
        await delay(3000);
    }
})();