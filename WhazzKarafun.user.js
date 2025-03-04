// ==UserScript==
// @name         Scrape Karafun Remote Song Info
// @namespace    http://tampermonkey.net/
// @version      2025-03-03
// @description  Scrapes Currently playing song info from the Karafun Remote
// @author       WhazzItToYa
// @match        https://www.karafun.com/*/
// @match        https://www.karafun.com/*/playlist*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://unpkg.com/@streamerbot/client/dist/streamerbot-client.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STREAMERBOT_PORT = 8080;

    console.log("STARTING");
    let sbot;
    try {
        console.log("Before sbot");
        sbot = new StreamerbotClient({port: STREAMERBOT_PORT});
        console.log("After sbot");
    } catch (e) {
        console.log(e);
    }
    let songInfoElt = null;

    let latestSong = "";
    let latestArtist = "";

    function scrapeSongInfo()
    {
        // Look for the element that has the current song info.
        songInfoElt = document.querySelector('button.touch-manipulation.transition-all');
        if (songInfoElt == null) return;

        // Found it.  Find the song/artist.
        let song = "";
        let artist = "";

        let songElts = songInfoElt.querySelectorAll('span');
        if (songElts !== null && songElts.length >= 2)
        {
            song = songElts.item(0).textContent;
            artist = songElts.item(1).textContent;
        }

        // Found valid song/artist & thye're different than previous.
        if (song !== null && artist !== null &&
            song !== "" && artist !== "" &&
            (song !== latestSong || artist !== latestArtist))
        {
            latestSong = song;
            latestArtist = artist;
            console.log(`new artist "${artist}", song "${song}"`);
            sbot.executeCodeTrigger("karafun_song_update",
                                    {"song" : latestSong,
                                     "artist" : latestArtist});
        }
        // Didn't find valid song & artist, and there was one before.
        else if ((song == null || song === "" || artist == null || artist === "") &&
                 (latestSong !== "" && latestArtist !== ""))
        {
            latestSong = "";
            latestArtist = "";
            console.log("No current song");
            sbot.executeCodeTrigger("karafun_song_stopped", {});
        }
    }

    setInterval(scrapeSongInfo, 1000);

})();
