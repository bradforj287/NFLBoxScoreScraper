NFL Box Score Web Scraper
================

A web scraper that will download box scores from http://www.profootballreference.com into JSON format. It will download all box scores and player data. Please refer to arguments.json to set program parameters. 

Program Usage:
### 
npm start
##

##Program Arguments (set in arguments.json):
* nflDataRoot - this is the directory that the box scores will be downloaded to
* minNflYear - the earliest NFL year to scrape
* maxNflYear - the maximum NFL year to scrape
 
### JSON schema examples
Player
   ```javascript
{
  "playerLink": "/players/A/AbduAm00.htm",
  "position": "RB",
  "birthday": "1993-06-13",
  "name": "ameer abdullah"
}
```
Game Summaries for NFL year
   ```javascript
[
  {
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
  } ...
]
```
Box Score
   ```javascript
{
  "boxScoreLink": "/boxscores/201509130crd.htm",
  "playerStatsList": [
    {
      "playerLink": "/players/B/BreeDr00.htm",
      "playerName": "drew brees",
      "team": "NOR",
      "passing": {
        "completions": "30",
        "attempts": "48",
        "yards": "355",
        "td": "1",
        "int": "1",
        "longest": "63"
      },
      "rushing": {
        "attempts": "1",
        "yards": "3",
        "td": "0",
        "longest": "3"
      },
      "receiving": {
        "receptions": "",
        "yards": "",
        "td": "",
        "longest": "",
        "targets": ""
      }
    }...]
}
```

##
