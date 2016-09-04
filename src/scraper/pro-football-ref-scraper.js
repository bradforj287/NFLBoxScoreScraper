var exports = module.exports = {};

var request = require('request');
var cheerio = require('cheerio');
var async = require("async");

var HtmlEntities = require('html-entities').AllHtmlEntities;
var entities = new HtmlEntities();


var nflUtils = require('../utils/nfl-utils.js');


exports.scrapeGameSummaries = function(nflYear, finishedFunc) {
    var url = 'http://www.pro-football-reference.com/years/' + nflYear + '/games.htm';

    request(url, function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var retVal = [];
            $("#games tbody tr").each(function(index) {

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
        } else {
            finishedFunc(null, false);
        }
    });
};

exports.scrapeBoxScore = function(summary, finishedFunc) {
    var url = 'http://www.pro-football-reference.com' + summary.boxScoreLink;

    console.log('scraping box score for: ' + summary.boxScoreLink + " -> " + nflUtils.getGameTitleForSummary(summary));
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var playerStatsList = [];
            var hasTargetCol = $("#skill_stats thead th[data-stat=targets]").length > 0;
            $("#player_offense tbody tr").each(function (index) {

                var row = $(this);
                if (row.hasClass("thead")) {
                    return
                }

                function getColSelector(col) {
                    return "td:nth-child(" + col + ")";
                }

                // in 2015 they added targets. so shift columns over
                var receivingBase = 13;
                if (hasTargetCol) {
                    receivingBase++;
                }
                var playerStats = {
                    playerLink: row.find('td:nth-child(1) a').attr("href"),
                    playerName: entities.decode(row.find('td:nth-child(1) a').html()).toLowerCase(),
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
                };
                playerStats.receiving.targets = row.find(getColSelector(13)).html();
                playerStatsList.push(playerStats);
            });

            var boxScore = {
                boxScoreLink: summary.boxScoreLink,
                playerStatsList: playerStatsList

            };
            finishedFunc(boxScore, true);
        } else {
            finishedFunc(null, false);
        }
    });
};


exports.scrapePlayerInfo = function(playerLink, finishedFunc) {
    var url = 'http://www.pro-football-reference.com' + playerLink;
    request(url, function (error, response, html) {
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