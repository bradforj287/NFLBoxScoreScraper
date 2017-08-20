var NflScraper = require('./scraper/nfl-scraper.js');

const nflScraper = new NflScraper();

nflScraper.scrapeGameSummaries(2015).then((summaries) => {
    console.log(JSON.stringify(summaries));
});