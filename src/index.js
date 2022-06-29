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
            await page.bringToFront();
            await page.click('button[data-test-selector="DropsCampaignInProgressRewardPresentation-claim-button"]');
        }
    } catch (error){
        // means no more claims haha
        return;
    }
}

async function setStreamPage(page){

    /**
     * const spanList = [...document.querySelectorAll("[data-a-id*='followed-channel-']")];
     * const onlineSmiters = spanList.filter((element) => {return element.childNodes[1].childNodes[0].childNodes[1].innerText === "SMITE"});
     * const streamersPlayingSmite = online.map(element => {return element.childNodes[1].childNodes[0].childNodes[0].innerText});
     */

        await page.goto('https://www.twitch.tv/', {waitUntil: 'load' });

        await delay(10000);

        // check if streamer is live
        const onlineSmiteStreamers =  await page.evaluate(() => {
            const spanList = [...document.querySelectorAll("[data-a-id*='followed-channel-']")];
            const onlineSmiters = spanList.filter((element) => {return element?.childNodes[1]?.childNodes[0]?.childNodes[1]?.innerText === "SMITE"});
            const streamersPlayingSmite = onlineSmiters.map(element => {return element?.childNodes[1]?.childNodes[0]?.childNodes[0]?.innerText});
            return streamersPlayingSmite;});

        console.log(onlineSmiteStreamers);
        
        let streamer;

        // treats with prio (0 element highest prio etc)
        for (let index = 0; index < STREAMERS.streamersToWatchOrdered.length; index++) {
            streamer = STREAMERS.streamersToWatchOrdered[index];
            if (onlineSmiteStreamers.indexOf(streamer) != -1){
                break;
            }
        }

        const url = `https://www.twitch.tv/${streamer}`;

        await page.bringToFront();

        // go to streamers page
        await page.goto(url, {waitUntil: 'load' });
}

(async function(){

    // create browser
    const browser = await p.launch( {executablePath: '/Program Files (x86)/Google/Chrome/Application/Chrome',
    headless:false, 
    defaultViewport:null,
    devtools: true,
    args: ["--window-size=1920,1080", "--window-position=0,0"]});

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