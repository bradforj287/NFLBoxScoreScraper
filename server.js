var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();

var REQUEST_DELAY = 10;

var teamNameToShortHand = {
	"Seattle Seahawks" : "SEA",
	"Green Bay Packers" : "GNB",
	"Denver Broncos" : "DEN",
	"Indianapolis Colts" : "IND",
	"Carolina Panthers" : "CAR",
	"Tampa Bay Buccaneers" : "TAM",
	"Pittsburgh Steelers" : "PIT",
	"Cleveland Browns" : "CLE",
	"New York Jets" : "NYJ",
	"Oakland Raiders" : "OAK",
	"Cincinnati Bengals" : "CIN",
	"Baltimore Ravens" : "BAL",
	"Miami Dolphins" : "MIA",
	"New England Patriots" : "NWE",
	"Houston Texans" : "HOU",
	"Washington Redskins" : "WAS",
	"Atlanta Falcons" : "ATL",
	"New Orleans Saints" : "NOR",
	"San Francisco 49ers" : "SFO",
	"Dallas Cowboys" : "DAL",
	"Philadelphia Eagles" : "PHI",
	"Jacksonville Jaguars" : "JAX",
	"Tennessee Titans" : "TEN",
	"Tennessee Oilers" : "TEN",
	"Kansas City Chiefs" : "KAN",
	"Minnesota Vikings" : "MIN",
	"St. Louis Rams" : "STL",
	"Buffalo Bills" : "BUF",
	"Chicago Bears" : "CHI",
	"Arizona Cardinals" : "ARI",
	"San Diego Chargers" : "SDG",
	"Detroit Lions" : "DET",
	"New York Giants" : "NYG"
};

function toJSON(obj) {
	return JSON.stringify(obj, null, 2)
}

function getShortName(fullName) {
	return teamNameToShortHand[fullName];
}

var mkdirSync = function (path) {
	try {
		fs.mkdirSync(path);
	} catch(e) {
		if ( e.code != 'EEXIST' ) throw e;
	}
};

function scrapeGameSummaries(year, finishedFunc) {
	var url = 'http://www.pro-football-reference.com/years/' + year + '/games.htm';

	request(url, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);

			var retVal = [];
			$("#games tbody tr").each(function(index) {

				var row = $(this);
				if (row.hasClass( "thead" )) {
					return
				}
				if (row.find('td:nth-child(3) strong').html() == "Playoffs") {
					return;
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
					wtPoints: row.find('td:nth-child(8) strong').html(),
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

function scrapeBoxScore(summary, finishedFunc) {
	var url = 'http://www.pro-football-reference.com' + summary.boxScoreLink;

	console.log('scraping box score for: ' + summary.boxScoreLink + " -> " + getGameTitleStr(summary));
	request(url, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);

			var playerStatsList = [];
			var hasTargetCol = $("#skill_stats thead th[data-stat=targets]").length > 0;
			$("#skill_stats tbody tr").each(function(index) {

				var row = $(this);
				if (row.hasClass( "thead" )) {
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
					playerName:row.find('td:nth-child(1) a').html(),
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

function scrapeBoxScores(summaries, onFinishFunc) {

	var i = 0;

	var onFinish = function(data) {
		var week = summaries[i].week;
		var wTeam = getShortName(summaries[i].winningTeam);
		var lTeam = getShortName(summaries[i].losingTeam);
		var fileName = "week_" + week + "_" + wTeam + "_" + lTeam + ".json";
		var filePath = "nfl_data/" + summaries[i].seasonYear + "/box_scores/" + fileName;
		fs.writeFile(filePath, toJSON(data), function(err){
			console.log(filePath);
		});
		i++;
		if (i >= summaries.length) {
			onFinishFunc();
			return;
		}
		setTimeout(function() {
			scrapeBoxScore(summaries[i], onFinish);
		}, REQUEST_DELAY);
	};
	scrapeBoxScore(summaries[i], onFinish);
}

function ensureDirs(year) {
	mkdirSync("nfl_data");
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

		setTimeout(function () {
			scrapeBoxScores(data, function () {
				console.log('finished scraping box scores for year ' + year);
				finishedFunc();
			});
		}, REQUEST_DELAY);

	});
}

var firstYear = 2014;
var lastYear = 2015;

function scrapeYears() {

	var cYear = firstYear;

	var onFinish = function() {
		console.log("finished scraping year " + cYear);
		cYear++;
		if (cYear > lastYear) {
			return;
		}

		setTimeout(function() {
			scrapeNflYear(cYear, onFinish);
		}, REQUEST_DELAY);
	};

	scrapeNflYear(cYear, onFinish);
}

scrapeYears();



exports = module.exports = app;