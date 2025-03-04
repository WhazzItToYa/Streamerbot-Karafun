**Installation**
1. In your browser, install the Tampermonkey extension. Greasemonkey or other user script extensions *might* work, but it's only been tested with Tampermonkey (tested in Firefox).
2. Install the WhazzKarafun.user.js script into it by going to the extension's settings > Utilities > Import from file
3. Import the WhazzKarafun.sb file into Streamer.bot as normal

**Usage**
1. Make sure you have the streamerbot websocket server enabled under Servers/Clients > Websocket Server, on port 8080
2. Bring up the Karafun remote control site.  The user.js script will detect changes in the song and send them to streamer.bot.
3. In Streamer.bot, create an action, and add the Song Update trigger to it. The action will be invoked when a new song starts, with the following arguments:
  * `song` : The name of the song.
  * `artist` : The artist of the song.
4. If the queue runs out of songs, then the "Song Stopped" trigger will fire.

**Configuration**
By default, the script will communicate with the streamer.bot websocket server on port 8080.  If you need to change this, update the following line in the user.js script:
```javascript
    const STREAMERBOT_PORT = 8080;
```

**Notes**
If the Karafun remote site disconnects from the Karafun app, or loses its connection to Streamer.bot, then the triggers won't occur until the site reconnects.

The technique of scraping the artist & song data off of the site using a userscript is inherently fragile, and changes to the site could break it.  I'm unlikely to notice, since I probably am not using it, so bug me via the streamer.bot Discord for fixes.
