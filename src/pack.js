var fs = require('fs');
var nflUtils = require('./utils/nfl-utils.js');

var programArgs = JSON.parse(fs.readFileSync('./arguments.json', 'utf8'));
var firstYear = programArgs.minNflYear;
var lastYear = programArgs.maxNflYear;
var nflRootDir = programArgs.nflDataRoot;


var boxScores = [];

for (var year=firstYear; year <= lastYear; year++) {
    var path = `${nflRootDir}/${year}/game_summaries.json`;
    var summaries = JSON.parse(fs.readFileSync(path, 'utf8'));
    summaries.forEach(s => {
        var week = s.week;
        var wTeam = nflUtils.getTeamShortName(s.winningTeam);
        var lTeam = nflUtils.getTeamShortName(s.losingTeam);
        var fileName = "week_" + week + "_" + wTeam + "_" + lTeam + ".json";
        var filePath = `${nflRootDir}/${year}/box_scores/${fileName}`;

        var bs = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        s.boxScoreLink = undefined;
        s.playerStatsList = bs.playerStatsList;
        boxScores.push(s);
    });
}

var playerLinkSet = new Set();
boxScores.forEach(bs => {
   bs.playerStatsList.forEach(ps => {
      playerLinkSet.add(ps.playerLink);
   });
});

var players = [];
playerLinkSet.forEach(pl => {
    var fileName = pl.replace(/\//g, "-") + ".json";
    var filePath = `${nflRootDir}/players/${fileName}`;
    var p = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    players.push(p);
    var bs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
});

var packedObj = {
    minYear: firstYear,
    maxYear: lastYear,
    players: players,
    boxScores: boxScores
};

const outputFileName = 'packedNflData.json';

function toJSON(obj) {
    return JSON.stringify(obj, null, 2)
}

var outputPath = `./${outputFileName}`;
fs.writeFile(outputPath, toJSON(packedObj), function (err) {
    console.log('wrote ' + outputPath);
});


