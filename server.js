var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require("async");
var HtmlEntities = require('html-entities').AllHtmlEntities;
entities = new HtmlEntities();

module.exports = fs.existsSync || function existsSync(filePath) {
        try {
            fs.statSync(filePath);
        } catch (err) {
            if (err.code == 'ENOENT') return false;
        }
        return true;
    };

var NUM_PARALLEL_REQ = 1;

function chunkArray(arr, chunkSize) {
    var array = arr;
    return [].concat.apply([],
        array.map(function (elem, i) {
            return i % chunkSize ? [] : [array.slice(i, i + chunkSize)];
        })
    );
}

var teamNameToShortHand = {
    "Seattle Seahawks": "SEA",
    "Green Bay Packers": "GNB",
    "Denver Broncos": "DEN",
    "Indianapolis Colts": "IND",
    "Carolina Panthers": "CAR",
    "Tampa Bay Buccaneers": "TAM",
    "Pittsburgh Steelers": "PIT",
    "Cleveland Browns": "CLE",
    "New York Jets": "NYJ",
    "Oakland Raiders": "OAK",
    "Cincinnati Bengals": "CIN",
    "Baltimore Ravens": "BAL",
    "Miami Dolphins": "MIA",
    "New England Patriots": "NWE",
    "Houston Texans": "HOU",
    "Washington Redskins": "WAS",
    "Atlanta Falcons": "ATL",
    "New Orleans Saints": "NOR",
    "San Francisco 49ers": "SFO",
    "Dallas Cowboys": "DAL",
    "Philadelphia Eagles": "PHI",
    "Jacksonville Jaguars": "JAX",
    "Tennessee Titans": "TEN",
    "Tennessee Oilers": "TEN",
    "Kansas City Chiefs": "KAN",
    "Minnesota Vikings": "MIN",
    "St. Louis Rams": "STL",
    "Buffalo Bills": "BUF",
    "Chicago Bears": "CHI",
    "Arizona Cardinals": "ARI",
    "San Diego Chargers": "SDG",
    "Detroit Lions": "DET",
    "New York Giants": "NYG"
};

var playerLinksSeen = {};

function recordPlayerLinks(bs) {
    var playerStatsList = bs.playerStatsList;
    playerStatsList.forEach(function (ps) {
        var link = ps.playerLink;
        playerLinksSeen[link] = true;
    });
}

function getAllPlayerLinksSeen() {
    var keys = [];
    for (var key in playerLinksSeen) {
        if (playerLinksSeen.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

function toJSON(obj) {
    return JSON.stringify(obj, null, 2)
}

function getShortName(fullName) {
    return teamNameToShortHand[fullName];
}

var mkdirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
};


function scrapeGameSummaries(year, finishedFunc) {
    var url = 'http://www.pro-football-reference.com/years/' + year + '/games.htm';

    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var retVal = [];
            $("#games tbody tr").each(function (index) {

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
                    seasonYear: year,
                    week: row.find('td:nth-child(1)').html(),
                    day: row.find('td:nth-child(2)').html(),
                    date: row.find('td:nth-child(3)').attr("csk"),
                    boxScoreLink: row.find('td:nth-child(4) a').attr("href"),
                    winningTeam: row.find('td:nth-child(5) a').html(),
                    isWinningTeamHome: row.find('td:nth-child(6)').html() !== "@",
                    losingTeam: row.find('td:nth-child(7) a').html(),
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
}

function getGameTitleStr(summary) {
    var spacing = " ";
    if (summary.isWinningTeamHome) {
        spacing = " @ ";
    }
    return summary.winningTeam + spacing + summary.losingTeam;
}

function scrapePlayerInfo(playerLink, finishedFunc) {
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

function scrapeBoxScore(summary, finishedFunc) {
    var url = 'http://www.pro-football-reference.com' + summary.boxScoreLink;

    console.log('scraping box score for: ' + summary.boxScoreLink + " -> " + getGameTitleStr(summary));
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var playerStatsList = [];
            var hasTargetCol = $("#skill_stats thead th[data-stat=targets]").length > 0;
            $("#skill_stats tbody tr").each(function (index) {

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
}

function scrapeBoxScoreChunk(summaries, onFinishFunc) {
    async.each(summaries,
        function (item, callback) {
            var week = item.week;
            var wTeam = getShortName(item.winningTeam);
            var lTeam = getShortName(item.losingTeam);
            var fileName = "week_" + week + "_" + wTeam + "_" + lTeam + ".json";
            var filePath = "nfl_data/" + item.seasonYear + "/box_scores/" + fileName;
            if (fs.existsSync(filePath)) {
                console.log('NO NEED to scrape box score for: ' + item.boxScoreLink + " -> " + getGameTitleStr(item));
                callback();
            } else {
                scrapeBoxScore(item, function (data) {
                    recordPlayerLinks(data);
                    if (data.playerStatsList.length > 0) {
                        fs.writeFile(filePath, toJSON(data), function (err) {
                            console.log(filePath);
                        });
                    }
                    callback();
                });
            }
        },
        function (err) {
            onFinishFunc();
        }
    );
}

function scrapeBoxScores(summaries, onFinishFunc) {
    var chunkedArray = chunkArray(summaries, NUM_PARALLEL_REQ);

    async.eachSeries(chunkedArray,
        function (item, callback) {
            scrapeBoxScoreChunk(item, callback);
        },
        function (err) {
            onFinishFunc();
        }
    );
}

function ensureDirs(year) {
    mkdirSync("nfl_data");
    mkdirSync("nfl_data/players");
    mkdirSync("nfl_data/" + year);
    mkdirSync("nfl_data/" + year + "/box_scores");
}

function scrapeNflYear(year, finishedFunc) {
    console.log('scraping nfl year ' + year);
    console.log('-----------------------\n');
    ensureDirs(year);
    console.log('scraping game summaries');
    scrapeGameSummaries(year, function (data, isSuccess) {
        if (!isSuccess) {
            console.log("error scraping summaries! exiting");
            return;
        }
        var filePath = "nfl_data/" + year + "/game_summaries.json";
        fs.writeFile(filePath, toJSON(data), function (err) {
            console.log('wrote ' + filePath);
        });

        scrapeBoxScores(data, finishedFunc);
    });
}

function scrapePlayerInfoChunk(list, cb) {
    async.each(list,
        function (item, callback) {
            var fileName = item.replace(/\//g, "-") + ".json";
            var filePath = "nfl_data/players/" + fileName;

            if (fs.existsSync(filePath)) {
                console.log('NOT scraping player_info: ' + item + ' already exists');
                callback();
            } else {
                console.log('scraping player_info: ' + item);
                scrapePlayerInfo(item, function (data) {

                    fs.writeFile(filePath, toJSON(data), function (err) {
                        console.log('wrote ' + filePath);
                    });
                    callback();
                });
            }
        },
        function (err) {
            cb();
        }
    );
}

function scrapeAllPlayerInfo(cb) {
    var scrapeList = getAllPlayerLinksSeen();

    var chunkedArray = chunkArray(scrapeList, NUM_PARALLEL_REQ);
    var chunk = 1;
    async.eachSeries(chunkedArray,
        function (item, callback) {
            console.log("** Scraping chunk " + chunk + "/" + chunkedArray.length);
            scrapePlayerInfoChunk(item, callback);
            chunk++;
        },
        function (err) {
            console.log("Finished scraping player info");
        }
    );
}


var firstYear = 2015;
var lastYear = 2015;

var years = [];

for (var i = firstYear; i <= lastYear; i++) {
    years.push(i);
}


async.eachSeries(years,
    function (item, callback) {
        scrapeNflYear(item, callback);
    },
    function (err) {
        console.log("finished scraping NFL years");
        scrapeAllPlayerInfo();
    }
);
