var fs = require('fs');
var async = require("async");

var nflScraper = require('./scraper/pro-football-ref-scraper.js');
var nflUtils = require('./utils/nfl-utils.js');

var programArgs = JSON.parse(fs.readFileSync('./arguments.json', 'utf8'));
var firstYear = programArgs.minNflYear;
var lastYear = programArgs.maxNflYear;
var nflRootDir = programArgs.nflDataRoot;

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

var mkdirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch (e) {
        if (e.code != 'EEXIST') throw e;
    }
};

function scrapeBoxScoreChunk(summaries, onFinishFunc) {
    async.each(summaries,
        function (item, callback) {
            var week = item.week;
            var wTeam = nflUtils.getTeamShortName(item.winningTeam);
            var lTeam = nflUtils.getTeamShortName(item.losingTeam);
            var fileName = "week_" + week + "_" + wTeam + "_" + lTeam + ".json";
            var filePath = nflRootDir + "/" + item.seasonYear + "/box_scores/" + fileName;
            if (fs.existsSync(filePath)) {
                console.log('NO NEED to scrape box score for: ' + item.boxScoreLink + " -> " + nflUtils.getGameTitleForSummary(item));
                var theData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                recordPlayerLinks(theData);
                callback();
            } else {
                nflScraper.scrapeBoxScore(item, function (data) {
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
    mkdirSync(nflRootDir);
    mkdirSync(nflRootDir + "/players");
    mkdirSync(nflRootDir + "/" + year);
    mkdirSync(nflRootDir + "/" + year + "/box_scores");
}

function scrapeNflYear(year, finishedFunc) {
    console.log('scraping nfl year ' + year);
    console.log('-----------------------\n');
    ensureDirs(year);
    console.log('scraping game summaries');
    nflScraper.scrapeGameSummaries(year, function (data, isSuccess) {
        if (!isSuccess) {
            console.log("error scraping summaries! exiting");
            return;
        }
        var filePath = nflRootDir + "/" + year + "/game_summaries.json";
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
            var filePath = nflRootDir + "/players/" + fileName;

            if (fs.existsSync(filePath)) {
                console.log('NOT scraping player_info: ' + item + ' already exists');
                callback();
            } else {
                console.log('scraping player_info: ' + item);
                nflScraper.scrapePlayerInfo(item, function (data) {

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

var years = [];

for (var i = firstYear; i <= lastYear; i++) {
    years.push(i);
}

/*
async.eachSeries(years,
    function (item, callback) {
        scrapeNflYear(item, callback);
    },
    function (err) {
        console.log("finished scraping NFL years");
        scrapeAllPlayerInfo();
    }
);
*/

var summary = {
    "seasonYear": "2015",
    "week": "1",
    "day": "Thu",
    "date": "2015-09-10",
    "boxScoreLink": "/boxscores/201509100nwe.htm",
    "winningTeam": "New England Patriots",
    "isWinningTeamHome": true,
    "losingTeam": "Pittsburgh Steelers",
    "wtPoints": "28",
    "ltPoints": "21",
    "wtYards": "361",
    "wtTurnovers": "0",
    "ltYards": "464",
    "ltTurnovers": "1"
};

nflScraper.scrapeBoxScore(summary, () => {
    console.log("finished");
});