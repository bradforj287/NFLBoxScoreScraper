var exports = module.exports = {};

const teamNameToShortHand = {
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
    "Los Angeles Rams": "LAR",
    "Buffalo Bills": "BUF",
    "Chicago Bears": "CHI",
    "Arizona Cardinals": "ARI",
    "San Diego Chargers": "SDG",
    "Los Angeles Chargers": "LAC",
    "Detroit Lions": "DET",
    "New York Giants": "NYG"
};


exports.getGameTitleForSummary = function(summary) {
    var spacing = " ";
    if (summary.isWinningTeamHome) {
        spacing = " @ ";
    }
    return summary.winningTeam + spacing + summary.losingTeam;
};

exports.getTeamShortName = function(fullName) {
    return teamNameToShortHand[fullName];
};