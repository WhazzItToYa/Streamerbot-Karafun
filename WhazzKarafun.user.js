// ==UserScript==
// @name         Scrape Karafun Remote Song Info
// @namespace    http://tampermonkey.net/
// @version      2025-03-04
// @updateURL    https://github.com/WhazzItToYa/StreamerbotKarafun/raw/refs/heads/main/WhazzKarafun.user.js
// @downloadURL  https://github.com/WhazzItToYa/StreamerbotKarafun/raw/refs/heads/main/WhazzKarafun.user.js
// @supportURL   https://github.com/WhazzItToYa/StreamerbotKarafun/issues
// @description  Scrapes Currently playing song info from the Karafun Remote to trigger Streamer.bot
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
            statusElt.style.zIndex = 10000;
            statusElt.style.position = "fixed";
            statusElt.style.right = "3.5rem";
            statusElt.style.bottom = "5px";
            statusElt.innerHTML= `
    <style>
      .sbotStatusBox {
          display: block;
          background-color: pink;
          height: 3rem;
          padding: 0.5em;
      }
      .sbotStatusBox img {
          height: 100%;
          width: auto;
      }
      .imgGroup {
          display: inline-block;
          position: relative;
          height: 100%;
      }
      .imgGroup .prohibited {
          position: absolute;
          left: 0px;
          top: 0px;
      }
      .prohibited {
          display: inline;
      }
      .scraped .prohibited.scrapingBroken {
          display: none;
      }
      .connected .prohibited.disconnected {
          display: none;
      }
    </style>
    <div class="sbotStatusBox" >
      <div class="imgGroup">
        <img title="Song info located" src="https://upload.wikimedia.org/wikipedia/commons/3/35/Simple_Music.svg">
        <img title="Song info not found! Script may need an update." src="https://upload.wikimedia.org/wikipedia/commons/7/70/Prohibited-icon.svg" class="prohibited scrapingBroken" >
      </div>
      <img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Arrow_slim_right.svg">
      <div class="imgGroup">
        <img title="Connected to Streamer.bot" src="https://streamer.bot/logo.svg">
        <img title="Not connected to Streamer.bot" src="https://upload.wikimedia.org/wikipedia/commons/7/70/Prohibited-icon.svg" class="prohibited disconnected" >
      </div>
    </div>
`
            document.body.appendChild(statusElt);
        }
        if (connected) {
            statusElt.classList.add("connected");
        } else {
            statusElt.classList.remove("connected");
        }
        if (scraped) {
            statusElt.classList.add("scraped");
        } else {
            statusElt.classList.remove("scraped");
        }
    }

})();
