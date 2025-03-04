// ==UserScript==
// @name         Scrape Karafun Remote Song Info
// @namespace    http://tampermonkey.net/
// @version      2025-03-03
// @description  Scrapes Currently playing song info from the Karafun Remote
// @author       WhazzItToYa
// @include        /^https?:\/\/www.karafun\..*\/[0-9]+\/.*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://unpkg.com/@streamerbot/client/dist/streamerbot-client.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STREAMERBOT_PORT = 8080;

    let connected = false;

    console.log("STARTING");
    let sbot;
    try {
        console.log("Before sbot");
        sbot = new StreamerbotClient({
            port: STREAMERBOT_PORT,
            onConnect: () => {connected = true;},
            onDisconnect: () => {connected = false;}
        });
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
        if (songInfoElt == null) {
            console.log("Didn't find current song element");
            updateStatus(connected, false);
            // Do something to indicate that the script can't find what it's looking for.
            return;
        }
        updateStatus(connected, true);

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

    function updateStatus(connected, scraped)
    {
        let statusElt = document.getElementById("sbotStatus");
        if (statusElt == null)
        {
            console.log("Making new status elt");
            statusElt = document.createElement("div");
            statusElt.id = "sbotStatus";
            statusElt.style.backgroundColor = "green";
            statusElt.style.color = "red";
            statusElt.style.zIndex = 10000;
            statusElt.style.position = "fixed";
            statusElt.style.left = "0px";
            statusElt.style.bottom = "0px";
            statusElt.innerHTML = '<span id="sbotStatusText">Hello!</span>';
            document.body.appendChild(statusElt);
        }
        let statusText = document.getElementById("sbotStatusText");
        statusText.textContent = scraped ? (connected ? "CONNECTED" : "NOT CONNECTED") : "BROKEN";
    }

})();
