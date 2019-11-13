import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import selectors from './settings/selectors.json';
import consoleMessage from './utils/consoleMessage.mjs';

import navigatingLogin from './src/pagesNav/login.mjs'
import navigatingHome from './src/pagesNav/home.mjs'
import navigatingYtviews from './src/pagesNav/ytviews.mjs'

dotenv.config();

(async () => {
  startingAppLogs();

  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  
  try {
    await navigatingLogin(page, selectors.login)
  } catch { navigationFailure('login')}

  try {
    await navigatingHome(page, selectors.home)
  } catch { navigationFailure('home')}
  
  try {
    await navigatingYtviews(page, selectors.ytviews)
  } catch { navigationFailure('ytviews')}

  await videosViewsHandler(page, selectors.ytviews)

})();

function startingAppLogs(){
  consoleMessage('intro', 'KINGDOMLIKES BOT', true)
  consoleMessage('intro', 'Any issue or improvement idea to report?')
  consoleMessage('intro', '--> github.com/gemanepa/nodejs-kingdomlikes-bot')
  consoleMessage('intro', 'Starting...')
}







async function videosViewsHandler(page, selectors) {
  consoleMessage('header', 'VIDEOS VIEWS HANDLER', true)
  const { playvideoBtn } = selectors;
  let videoNumber = 0;
  let noPointsFound = 0;

  let sleepForFiveMins = false;
  setInterval(async function() {
    const rightnow = new Date();
    if(!sleepForFiveMins || (sleepForFiveMins && rightnow > sleepForFiveMins)) {
      const isDisabled = await page.$('button.blue[disabled]') === null;
    
      if(isDisabled) {
        consoleMessage('header', 'Handling new video...')
        videoNumber += 1;
        consoleMessage('info', `Clicking on youtube video number ${videoNumber}`)
  
        const vdName = await getVideoName(page)
        consoleMessage('info', `----> Video Name: ${vdName ? vdName : 'No name'}`)
  
        const vdPoints = await getVideoPoints(page)
        if (vdPoints) {
          noPointsFound = 0;
          consoleMessage('info', `----> Video Points: ${vdPoints}`)
  
          await page.click(playvideoBtn)
          consoleMessage('info', 'Playing video for 1:40 minutes')
        } else { 
          noPointsFound += 1;
          noPointsFoundTolerance(noPointsFound)
          try {
            await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
          } catch { navigationFailure('reloading ytviews')}
  
          try {
            await page.waitForSelector(playvideoBtn)
          } catch { 
            sleepForFiveMins = new Date(rightnow.getTime() + 10*60000);
            consoleMessage(
              'error', 
              'No Like button found after reload due to probably no more videos being available to watch right now. Application will sleep for 10 minutes and then try again'
            )
          }
        }
      }
    }


  }, 20000);
}


async function getVideoPoints(page) {
  try {
    return await page.$eval('.containertitle > h5 > span', el => el.innerHTML);
  } catch { return false }
}

function noPointsFoundTolerance(noPointsFound) {
  if(noPointsFound > 4) {
    consoleMessage('error', 'No points were found in 5 consecutive videos after multiple reloadings and sleeps. Report issue to github user gemanepa');
    terminateApp()
  }
}

async function getVideoName(page) {
  try {
    return await page.$eval('.containertitle > h6', el => el.innerHTML);
  } catch { return false }
}

function navigationFailure(pageName) {
  consoleMessage('error', `Navigation error in ${pageName}`)
  terminateApp()
}

function terminateApp(){
  consoleMessage('info', 'Stopping application')
  process.exit()
}
