using System;
using System.Collections.Generic;

public class CPHInline
{
    public void Init()
    {
        CPH.RegisterCustomTrigger("Song Update", "karafun_song_update", new string[]{"Karafun"});
        CPH.RegisterCustomTrigger("Song Stopped", "karafun_song_stopped", new string[]{"Karafun"});
    }
	
    public bool Execute()
    {

        return true;
    }

    public bool KeyUp()
    {
        return SendCommand("KeyUp");
    }
    public bool KeyDown()
    {
        return SendCommand("KeyDown");
    }
    public bool KeyReset()
    {
        return SendCommand("KeyReset");
    }

    public bool TempoUp()
    {
        return SendCommand("TempoUp");
    }
    public bool TempoDown()
    {
        return SendCommand("TempoDown");
    }
    public bool TempoReset()
    {
        return SendCommand("TempoReset");
    }

    private bool SendCommand(string command)
    {
        CPH.WebsocketBroadcastJson($$"""{"event": "WhazzKarafun", "command": "{{command}}"}""");
        return true;
    }
}
