// ==UserScript==
// @name         Scrape Karafun Remote Song Info
// @namespace    http://tampermonkey.net/
// @version      2025-05-05
// @updateURL    https://github.com/WhazzItToYa/StreamerbotKarafun/raw/refs/heads/main/WhazzKarafun.user.js
// @downloadURL  https://github.com/WhazzItToYa/StreamerbotKarafun/raw/refs/heads/main/WhazzKarafun.user.js
// @supportURL   https://github.com/WhazzItToYa/StreamerbotKarafun/issues
// @description  Scrapes Currently playing song info from the Karafun Remote to trigger Streamer.bot
// @author       WhazzItToYa
// @include        /^https?:\/\/www.karafun\..*\/[0-9]+\/.*/
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://unpkg.com/@streamerbot/client/dist/streamerbot-client.js
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    let connected = false;

    console.log("STARTING");

    let sbot;
    function initSBot(host, port)
    {
        if (sbot != null)
        {
            sbot.disconnect();
            sbot = null;
        }
        try {
            GM_setValue("sbotHost", host);
            GM_setValue("sbotPort", port);
            
            console.log("Before sbot");
            sbot = new StreamerbotClient({
                host: host,
                port: port,
                onConnect: () => {connected = true;},
                onDisconnect: () => {connected = false;}
            });
            console.log("After sbot");
        } catch (e) {
            console.log(e);
        }
    }

    let initialHost = GM_getValue("sbotHost", "127.0.0.1");
    let initialPort = GM_getValue("sbotPort", 8080);
    initSBot(initialHost, initialPort);
    
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
      #sbotStatusIcon {
          cursor: pointer;
      }
      .dialog {
         position: absolute;
         bottom: 2em;
         right: 2em;
         padding: 0.5em;
         background-color: purple;
         border: solid black 2px;
         white-space: nowrap;
      }
      .dialog label {
         display: inline-block;
         text-align: right;
         min-width: 4em;
      }
      .dialog [type="button"] {
         border: solid black 1px;
         float: right;
      }
    </style>
    <div class="sbotStatusBox" >
      <div class="imgGroup">
        <img title="Song info located" src="https://upload.wikimedia.org/wikipedia/commons/3/35/Simple_Music.svg">
        <img title="Song info not found! Script may need an update." src="https://upload.wikimedia.org/wikipedia/commons/7/70/Prohibited-icon.svg" class="prohibited scrapingBroken" >
      </div>
      <img src="https://upload.wikimedia.org/wikipedia/commons/7/72/Arrow_slim_right.svg">
      <div class="imgGroup" id="sbotStatusIcon">
        <img title="Connected to Streamer.bot" src="https://streamer.bot/logo.svg">
        <img title="Not connected to Streamer.bot" src="https://upload.wikimedia.org/wikipedia/commons/7/70/Prohibited-icon.svg" class="prohibited disconnected" >
      </div>
          <div class="dialog" id="sbotConfig" style="display:none;">
             <h2>Streamer.bot websocket</h2>
             <div><label for="sbServer">address:</label><input id="sbServer" type="text" value="127.0.0.1"></div>
             <div><label for="sbPort">port:</label><input id="sbPort" type="number" min="1" max="65535" step="1" value="8080"></div>
             <div><input type="button" id="sbotConfigOK" value="OK"></div>
          </div>
    </div>
`
            document.body.appendChild(statusElt);

            // Open/close/process streamer.bot websocket config dialog
            document.getElementById("sbServer").value = initialHost;
            document.getElementById("sbPort").value = initialPort;

            let sbotStatusIcon = document.getElementById("sbotStatusIcon");
            let sbotConfig = document.getElementById("sbotConfig");
            let toggle = function () {
                console.log("Clicked");
                if (sbotConfig.style.display === "block") {
                    sbotConfig.style.display = "none";
                    console.log("vis: none");

                    // Process the new values
                    let addr = document.getElementById("sbServer").value;
                    let port = document.getElementById("sbPort").value;
                    initSBot(addr, port);
                } else {
                    sbotConfig.style.display = "block";
                    console.log("vis: block");
                }
            }
            sbotStatusIcon.onclick = toggle;
            document.getElementById("sbotConfigOK").onclick = toggle;
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
