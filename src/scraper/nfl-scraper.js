var exports = module.exports = {};
var cheerio = require('cheerio');
const puppeteer = require('puppeteer');
var parse = require('csv-parse');
var _ = require('lodash');

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

    function parseBoxScoreCsv(csv) {
        return new Promise(
            (resolve, reject) => {
                var csvinput = _.trim(csv, '\n');
                parse(csvinput, {comment: '#'}, function(err, rows) {
                    var statList = [];

                    for (var i = 2; i < rows.length; i++) { // first 2 rows are headers
                        var cols = rows[i];
                        var namePair = cols[0];
                        var name = namePair.split("\\")[0];
                        var id = namePair.split("\\")[1];
                        var firstLetter = id.charAt(0);
                        var playerPath = `/players/${firstLetter}/${id}.htm`;
                        var team = cols[1];

                        var playerStats = {
                            playerLink: playerPath,
                            playerName: name,
                            team: team
                        };

                        for (var j = 2; j < cols.length; j++) {
                            var statVal = cols[j].trim();
                            var statCat = rows[0][j].toLowerCase();
                            var statSubCat = rows[1][j].toLowerCase();
                            //validateCats(statCat, statSubCat); TODO validate to check for updates necessary
                            if (!playerStats[statCat]) {
                                playerStats[statCat] = {};
                            }
                            if (!playerStats[statCat][statSubCat]) {
                                playerStats[statCat][statSubCat] = statVal;
                            }
                        }
                        statList.push(playerStats);
                    }

                    resolve(statList);
                });
            });
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
                gameTime: row.find(ds('gametime')).html(),
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

    this.scrapeBoxScore = async function(boxScoreLink) {
        const url = 'http://www.pro-football-reference.com' + boxScoreLink;
        const browser = await puppeteer.launch();
        try {
            const page = await browser.newPage();
            await page.goto(url);

            const csvButtonSelector = '#all_player_offense .section_heading_text .hasmore li:nth-child(4) button';
            await page.waitForSelector(csvButtonSelector);

            const clickEvaluation = `document.querySelector('${csvButtonSelector}').click()`;
            await page.evaluate(clickEvaluation); // for some reason the native click() calls aren't working but this is...

            const extractTableCommand = `document.querySelector('#csv_player_offense').textContent`;
            const csv = await page.evaluate(extractTableCommand);

            return {
                boxScoreLink: boxScoreLink,
                playerStatsList: await parseBoxScoreCsv(csv)
            };
        } finally {
            browser.close();
        }
    };
}

module.exports = NflScraper;
