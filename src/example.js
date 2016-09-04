// Grab links from Google.
var Horseman = require("node-horseman");

var horseman = new Horseman();

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
});


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