var exports = module.exports = {};
var cheerio = require('cheerio');
const puppeteer = require('puppeteer');

function NflScraper() {
    async function openPageTakeHtml(url, selector) {
        const browser = await puppeteer.launch();
        try {
            const page = await browser.newPage();
            await page.goto(url);
            const commandToRunOnPage = `document.querySelector('${selector}').innerHTML`;
            const html = await page.evaluate(commandToRunOnPage);
            return html;
        } finally {
            browser.close();
        }
    }

    this.scrapeGameSummaries = async function(nflYear) {
        const url = `http://www.pro-football-reference.com/years/${nflYear}/games.htm`;
        const summaryHtml = await openPageTakeHtml(url, '#games');
        var $ = cheerio.load(summaryHtml);
        var retVal = [];
        $('tbody tr').each(function(index) {
            var row = $(this);
            if (row.hasClass("thead")) {
                return
            }
            if (row.find('td:nth-child(3) strong').html() === "Playoffs") {
                return;
            }

            function ds(statName) {
                return `[data-stat='${statName}']`;
            }
            var gameSummary = {
                seasonYear: nflYear,
                week: row.find(ds('week_num')).html(),
                day: row.find(ds('game_day_of_week')).html(),
                date: row.find(ds('game_date')).attr("csk"),
                gameTime:row.find(ds('gametime')).html(),
                boxScoreLink: row.find(ds('boxscore_word') + ' a').attr("href"),
                winningTeam: row.find("[data-stat='winner'] a").html(),
                winningTeamLink: row.find("[data-stat='winner'] a").attr("href"),
                losingTeam: row.find("[data-stat='loser'] a").html(),
                losingTeamLink: row.find("[data-stat='loser'] a").attr("href"),
                isWinningTeamHome: row.find(ds('game_location')).html() !== "@",
                wtPoints: row.find("[data-stat='pts_win'] strong").html(),
                ltPoints: row.find("[data-stat='pts_lose']").html(),
                wtYards: row.find(ds('yards_win')).html(),
                wtTurnovers: row.find(ds('to_win')).html(),
                ltYards: row.find(ds('yards_lose')).html(),
                ltTurnovers: row.find(ds('to_lose')).html()
            };
            retVal.push(gameSummary);
        });
        return retVal;
    };
}

module.exports = NflScraper;
