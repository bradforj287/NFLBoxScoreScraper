var exports = module.exports = {};

var nflUtils = require('../utils/nfl-utils.js');
var cheerio = require('cheerio');
var async = require("async");
var Horseman = require("node-horseman");
var HtmlEntities = require('html-entities').AllHtmlEntities;
var entities = new HtmlEntities();

const TIME_TO_WAIT_FOR_LOAD = 1000;

function fetchHtmlPhantomJs(url, selector, cb, fb) {
    var horseman = new Horseman();

    horseman
        .viewport(1920, 1080)
        .open(url)
        .wait(TIME_TO_WAIT_FOR_LOAD)
        .html(selector)
        .close()
        .then((html) => {
            cb(html);
        });
}

exports.scrapeGameSummaries = function(nflYear, finishedFunc) {
    var url = 'http://www.pro-football-reference.com/years/' + nflYear + '/games.htm';

    fetchHtmlPhantomJs(url, '#games', function(html) {
        var $ = cheerio.load(html);
        var retVal = [];
        $("tbody tr").each(function(index) {

            var row = $(this);
            if (row.hasClass("thead")) {
                return
            }
            if (row.find('td:nth-child(3) strong').html() == "Playoffs") {
                return;
            }
            var thePoints = row.find('td:nth-child(8) strong').html();
            if (!thePoints) {
                thePoints = row.find('td:nth-child(8)').html();
            }
            var gameSummary = {
                seasonYear: nflYear,
                week: row.find('th:nth-child(1)').html(),
                day: row.find('td:nth-child(2)').html(),
                date: row.find('td:nth-child(3)').attr("csk"),
                boxScoreLink: row.find('td:nth-child(7) a').attr("href"),
                winningTeam: row.find('td:nth-child(4) a').html(),
                isWinningTeamHome: row.find('td:nth-child(5)').html() !== "@",
                losingTeam: row.find('td:nth-child(6) a').html(),
                wtPoints: thePoints,
                ltPoints: row.find('td:nth-child(9)').html(),
                wtYards: row.find('td:nth-child(10)').html(),
                wtTurnovers: row.find('td:nth-child(11)').html(),
                ltYards: row.find('td:nth-child(12)').html(),
                ltTurnovers: row.find('td:nth-child(13)').html()
            };
            retVal.push(gameSummary);
        });
        finishedFunc(retVal, true);
    });
};

function parseBoxScoreCsv(csv) {
    console.log(csv);
    return null;
}

exports.scrapeBoxScore = function(summary, cb) {
    var url = 'http://www.pro-football-reference.com' + summary.boxScoreLink;
    console.log('scraping box score for: ' + summary.boxScoreLink + " -> " + nflUtils.getGameTitleForSummary(summary));

    var horseman = new Horseman();
    horseman
        .viewport(1920,1080)
        .open(url)
        .wait(TIME_TO_WAIT_FOR_LOAD)
        .click('#all_player_offense .section_heading_text .hasmore li:nth-child(3) button')
        .wait(1000)
        .text('#csv_player_offense')
        .close()
        .then((text) => {
            var boxScore = parseBoxScoreCsv(text);
            cb(boxScore);
        });

    /*var playerStats = {
        playerLink: row.find('th:nth-child(1) a').attr("href"),
        playerName: entities.decode(row.find('th:nth-child(1) a').html()).toLowerCase(),
        team: row.find('td:nth-child(2)').html(),
        passing: {
            completions: row.find('td:nth-child(3)').html(),
            attempts: row.find('td:nth-child(4)').html(),
            yards: row.find('td:nth-child(5)').html(),
            td: row.find('td:nth-child(6)').html(),
            int: row.find('td:nth-child(7)').html(),
            longest: row.find('td:nth-child(8)').html()
        },
        rushing: {
            attempts: row.find('td:nth-child(9)').html(),
            yards: row.find('td:nth-child(10)').html(),
            td: row.find('td:nth-child(11)').html(),
            longest: row.find('td:nth-child(12)').html()
        },
        receiving: {
            receptions: row.find(getColSelector(receivingBase)).html(),
            yards: row.find(getColSelector(receivingBase + 1)).html(),
            td: row.find(getColSelector(receivingBase + 2)).html(),
            longest: row.find(getColSelector(receivingBase + 3)).html()
        }
    };*/
};

exports.scrapePlayerInfo = function(playerLink, finishedFunc) {
    var url = 'http://www.pro-football-reference.com' + playerLink;
    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var playerInfo = {
                playerLink: playerLink,
                position: $("#div_fantasy tbody tr").last().find('td:nth-child(4)').html(),
                birthday: $("#necro-birth").attr("data-birth"),
                name: entities.decode($("#info_box > div.float_left > h1").html()).toLowerCase()
            };

            finishedFunc(playerInfo, true);
        } else {
            finishedFunc(null, false);
        }
    });
}