## Installation
1. In your browser, install the Tampermonkey extension. Greasemonkey or other user script extensions *might* work, but it's only been tested with Tampermonkey (tested in Firefox).
2. Install the WhazzKarafun.user.js script into it by clicking on the [raw version stored in Github](https://github.com/WhazzItToYa/StreamerbotKarafun/raw/refs/heads/main/WhazzKarafun.user.js). The extension should come up and offer to install it. Click "(Re)Install"
3. Import the [WhazzKarafun.sb](https://raw.githubusercontent.com/WhazzItToYa/StreamerbotKarafun/refs/heads/main/WhazzKarafun.sb) import string into Streamer.bot as normal

## Usage
1. Make sure you have the streamerbot websocket server enabled under Servers/Clients > Websocket Server, on port 8080[*](#Notes)
2. Bring up the Karafun remote control site.  The user.js script will detect changes in the song and send them to streamer.bot.
3. In Streamer.bot, create an action, and add the Song Update trigger to it. The action will be invoked when a new song starts, with the following arguments:
  * `song` : The name of the song.
  * `artist` : The artist of the song.
4. If the queue runs out of songs, then the "Song Stopped" trigger will fire.

### Status Icon
![GoodStatus](assets/goodstatus.png "Good Status indicator")

When the script is active on a page, it will display status icons. The note icon indicates that the script has located where the song info lives on the page, and will be watching it.

The Streamer.bot icon indicates that the script is connected to Streamer.bot's websocket server.

![BadStatus](assets/badstatus.png "Bad Status indicator")

If there's a "no go" indicator across Streamer.bot, it is not connected.

If the "no go" is on the note icon, it means that the script is unable to find the song information in the page.  If you believe that you are on a valid remote control page, then Karafun might have changed their website, and the script will need an update. If the status indicator doesn't show up at all, the script may also need an update. See below for contact information. 


## Configuration
By default, the script will communicate with the streamer.bot websocket server on port 8080.  If you need to change this, update the following line in the user.js script:
```javascript
    const STREAMERBOT_PORT = 8080;
```

## Notes
If the Karafun remote site disconnects from the Karafun app, or loses its connection to Streamer.bot, then the triggers won't occur until the site reconnects.

The technique of scraping the artist & song data off of the site using a userscript is inherently fragile, and changes to the site could break it.  I'm unlikely to notice, since I probably am not using it, so bug me via the streamer.bot Discord for fixes.

## Contact

* For feature requests or bug reports: https://github.com/WhazzItToYa/StreamerbotKarafun/issues 
* Or submit a pull request
* Or if you can't do either of those things, ping me through the Streamer.bot Discord in the [Karafun Song Info post](https://discord.com/channels/834650675224248362/1346360720773615718)

