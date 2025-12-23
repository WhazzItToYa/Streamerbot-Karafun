// ==UserScript==
// @name         Scrape Karafun Remote Song Info
// @namespace    http://tampermonkey.net/
// @version      2025-12-22
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
    function initSBot(host, port, path)
    {
        if (sbot != null)
        {
            sbot.disconnect();
            sbot = null;
        }
        try {
            GM_setValue("sbotHost", host);
            GM_setValue("sbotPort", port);
            GM_setValue("sbotPath", path);
            
            console.log("Before sbot");
            sbot = new StreamerbotClient({
                host: host,
                port: port,
                endpoint: path,
                
                onConnect: () => {connected = true;},
                onDisconnect: () => {connected = false;}
            });

            sbot.on('General.Custom', handleControlEvent);
            
            console.log("After sbot");
        } catch (e) {
            console.log(e);
        }
    }

    let initialHost = GM_getValue("sbotHost", "127.0.0.1");
    let initialPort = GM_getValue("sbotPort", 8080);
    let initialPath = GM_getValue("sbotPath", "/");
    initSBot(initialHost, initialPort, initialPath);
    
    let latestSong = "";
    let latestArtist = "";

    let prevScraped = false;
    
    function scrapeSongInfo()
    {
        // Look for the element that has the current song info.
        let songInfoElt = document.querySelector('button.touch-manipulation.transition-all');
        if (songInfoElt == null) {
            console.log("Didn't find current song element");
            updateStatus(connected, false);
            prevScraped = false;
            // Do something to indicate that the script can't find what it's looking for.
            return;
        }
        if (!prevScraped) {
            // If we're finding the song info element after not having found it the previous time,
            // for example, the remote control page times out and the user rejoins the session,
            // then the cached control buttons have probably become invalid.
            findButtons();
        }
        prevScraped = true;
        
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
            // When the song changes, the control buttons can change too.
            findButtons();

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
         min-width: 5em;
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
             <div><label for="sbPort">endpoint:</label><input id="sbPath" type="text" value="/"></div>
             <div><input type="button" id="sbotConfigOK" value="OK"></div>
          </div>
    </div>
`;
            document.body.appendChild(statusElt);

            // Open/close/process streamer.bot websocket config dialog
            document.getElementById("sbServer").value = initialHost;
            document.getElementById("sbPort").value = initialPort;
            document.getElementById("sbPath").value = initialPath;

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
                    let path = document.getElementById("sbPath").value;
                    initSBot(addr, port, path);
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

    let keyResetButton = null;
    let keyDownButton = null;
    let keyUpButton = null;
    let tempoResetButton = null;
    let tempoDownButton = null;
    let tempoUpButton = null;

    // Finds all the buttons that control key & tempo.
    function findButtons() {
        // The structure is simple & straightforward, but there are very few specific
        // attributes or elements to search for. Since the text labels are localized,
        // can't even look for the text.
        //
        // <div> = controlDiv
        //   <div> = keyDiv
        //     <button>Tonart</button> = keyResetButton
        //     <div>
        //       <button type="button"> = keyDownButton
        //         <svg>
        //           <use href="#icon-minus" />
        //         </svg>
        //       </button>
        //       <p>0</p>
        //       <button type="button"> = keyUpButton
        //         <svg>
        //           <use href="#icon-plus">
        //           </use>
        //         </svg>
        //       </button>
        //     </div>
        //   </div>
        //   <div> = tempoDiv
        //     <button>Tempo</button> = tempoResetButton
        //     <div>
        //       <button type="button"> = tempoDownButton
        //         <svg>
        //           <use href="#icon-minus">
        //           </use>
        //         </svg>
        //       </button>
        //       <p> 0% </p>
        //       <button type="button"> = tempoUpButton
        //         <svg>
        //           <use href="#icon-plus" />
        //         </svg>
        //       </button>
        //     </div>
        //   </div>
        // </div>

        try {
            console.log("Trying to find control buttons");
            // Look for a div(div(button, div(button+, button-)))
            let controlDiv = document.querySelector("div:has(> div > div > button > svg > use[href='#icon-minus']):has(> div > div > button > svg > use[href='#icon-plus']):has(> div > button)");
            let keyGroup = controlDiv.querySelector(":scope > div:nth-of-type(1)");
            let tempoGroup = controlDiv.querySelector(":scope > div:nth-of-type(2)");

            keyResetButton = keyGroup.querySelector(":scope > button");
            console.log(`Found key reset button: ${keyResetButton}`);
            tempoResetButton = tempoGroup.querySelector(":scope > button");
            console.log(`Found tempo reset button: ${tempoResetButton}`);

            keyDownButton = keyGroup.querySelector("button:has(svg > use[href='#icon-minus'])");
            console.log(`Found key down button: ${keyDownButton}`);
            keyUpButton = keyGroup.querySelector("button:has(svg > use[href='#icon-plus'])");
            console.log(`Found key up button: ${keyUpButton}`);
            tempoDownButton = tempoGroup.querySelector("button:has(svg > use[href='#icon-minus'])");
            console.log(`Found tempo down button: ${tempoDownButton}`);
            tempoUpButton = tempoGroup.querySelector("button:has(svg > use[href='#icon-plus'])");
            console.log(`Found tempo up button: ${tempoUpButton}`);
        } catch (e) {
            console.log("Could not complete finding the control buttons", e);
        }
    }

    function handleControlEvent({data}) {
        console.log("Got event", data);
        if (data.event !== "WhazzKarafun") return;
        let button = null;
        switch (data.command)
        {
            case "KeyReset"   : button = keyResetButton;   break;
            case "KeyDown"    : button = keyDownButton;    break;
            case "KeyUp"      : button = keyUpButton;      break;
            case "TempoReset" : button = tempoResetButton; break;
            case "TempoDown"  : button = tempoDownButton;  break;
            case "TempoUp"    : button = tempoUpButton;    break;
            default: return;
        }
        button.click();
    }
    
})();
