var NflScraper = require('./scraper/nfl-scraper.js');

const nflScraper = new NflScraper();

(async function() {
    //var summaries = await nflScraper.scrapeGameSummaries(2015);
    //console.log(JSON.stringify(summaries));

    var playerInfo = await nflScraper.scrapePlayerInfo('/players/R/RoetBe00.htm');
    console.log(JSON.stringify(playerInfo));
})();


