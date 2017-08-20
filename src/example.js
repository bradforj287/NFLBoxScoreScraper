var NflScraper = require('./scraper/nfl-scraper.js');

const nflScraper = new NflScraper();

(async function() {
    //var summaries = await nflScraper.scrapeGameSummaries(2015);
    //console.log(JSON.stringify(summaries));

    var boxScore = await nflScraper.scrapeBoxScore('/boxscores/201509100nwe.htm');
    console.log(JSON.stringify(boxScore));
})();


