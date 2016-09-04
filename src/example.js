// Grab links from Google.
var Horseman = require("node-horseman");

/*var horseman = new Horseman();

horseman
    .viewport(1920,1080)
    .open('http://www.pro-football-reference.com/boxscores/201509100nwe.htm')
    .wait(1000)
    .click('#all_player_offense .section_heading_text .hasmore li:nth-child(3) button')
    .wait(1000)
    .text('#csv_player_offense')
    .close()
    .then((text) => {
        console.log(text);
    })
    .then(function() {
        console.log("fuck");
}); */


/*

 .evaluate( function(selector){
 // This code is executed inside the browser.
 // It's sandboxed from Node, and has no access to anything
 // in Node scope, unless you pass it in, like we did with 'selector'.
 //
 // You do have access to jQuery, via $, automatically.
 return $( selector ).html();

 }, '#player_offense')
 */


var parse = require('csv-parse');

var csv = `,,Passing,Passing,Passing,Passing,Passing,Passing,Passing,Passing,Passing,Rushing,Rushing,Rushing,Rushing,Receiving,Receiving,Receiving,Receiving,Receiving,Fumbles,Fumbles
Player,Tm,Cmp,Att,Yds,TD,Int,Sk,Yds,Lng,Rate,Att,Yds,TD,Lng,Tgt,Rec,Yds,TD,Lng,Fmb,FL
Ben Roethlisberger\RoetBe00,PIT,26,38,351,1,1,2,13,43,95.4,0,0,0,0,0,0,0,0,0,0,0
DeAngelo Williams\WillDe02,PIT,0,0,0,0,0,0,0,0,,21,127,0,28,1,1,5,0,5,0,0
Will Johnson\JohnWi00,PIT,0,0,0,0,0,0,0,0,,4,7,1,6,0,0,0,0,0,0,0
Antonio Brown\BrowAn04,PIT,0,0,0,0,0,1,8,0,,0,0,0,0,11,9,133,1,37,0,0
Heath Miller\MillHe00,PIT,0,0,0,0,0,0,0,0,,0,0,0,0,11,8,84,0,18,0,0
Darrius Heyward-Bey\HeywDa00,PIT,0,0,0,0,0,0,0,0,,0,0,0,0,7,4,58,0,43,0,0
Markus Wheaton\WheaMa00,PIT,0,0,0,0,0,0,0,0,,0,0,0,0,7,3,55,0,26,0,0
Tyler Murphy\MurpTy00,PIT,0,0,0,0,0,0,0,0,,0,0,0,0,1,1,16,0,16,0,0
Tom Brady\BradTo00,NWE,25,32,288,4,0,2,7,52,143.7,3,1,0,2,0,0,0,0,0,0,0
Dion Lewis\LewiDi00,NWE,0,0,0,0,0,0,0,0,,15,69,0,13,5,4,51,0,19,1,0
Julian Edelman\EdelJu00,NWE,0,0,0,0,0,0,0,0,,1,9,0,9,12,11,97,0,14,0,0
Brandon Bolden\BoldBr00,NWE,0,0,0,0,0,0,0,0,,5,1,0,3,2,1,12,0,12,0,0
Rob Gronkowski\GronRo00,NWE,0,0,0,0,0,0,0,0,,0,0,0,0,8,5,94,3,52,0,0
Danny Amendola\AmenDa00,NWE,0,0,0,0,0,0,0,0,,0,0,0,0,3,2,24,0,18,0,0
Aaron Dobson\DobsAa00,NWE,0,0,0,0,0,0,0,0,,0,0,0,0,1,1,9,0,9,0,0
Scott Chandler\ChanSc00,NWE,0,0,0,0,0,0,0,0,,0,0,0,0,1,1,1,1,1,0,0
`;

parse(csv, {comment: '#'}, function(err, output){
    console.log(output);
   // cb(output);
});