# warframe-events [![Build Status](https://travis-ci.com/WFCD/worldstate-emitter.svg?branch=master)](https://travis-ci.com/WFCD/worldstate-emitter)

Suuuper simple emitter for worldstate events.

Very opinionated decisions on what events and event names, as well as

## Emitter Events

Emitter Event | Emit key | description
:-- | --- | --
RSS | `rss` | New forum post from DE
Worldstate | `ws:update` |  New Worldstate event
Tweet | `tweet` | New tweet from one of the selected accounts


<details>
  <summary>Twitter Accounts</summary>

 - [Warframe](https://twitter.com/playwarframe) (warframe)
 - [Digital Extremes](https://twitter.com/digitalextremes) (digitalextremes)
 - [[DE]Pablo](https://twitter.com/PabloPoon) (pablo)
 - [Cameron Rogers](https://twitter.com/cam_rogers) (cameron)
 - [[DE]Rebecca](https://twitter.com/rebbford) (rebecca)
 - [[DE]Steve](https://twitter.com/sj_sinclair) (steve)
 - [[DE]Danielle](https://twitter.com/soelloo) (danielle)
 - [[DE]Megan](https://twitter.com/moitoi) (megan)
 - [[DE]George](https://twitter.com/GameSoundDesign) (george)
 - [[DE]Maciej](https://twitter.com/msinilo) (maciej)
 - [[DE]Sheldon](https://twitter.com/sheldoncarter) (sheldon)
 - [[DE]Marcus](https://twitter.com/narcbag) (narc)
 - [[DE]Helen](https://twitter.com/helen_heikkila) (helen)
 - [Tobiah (me)](https://twitter.com/tobitenno) (tobiah)
 - [WF Discord](https://twitter.com/wfdiscord) (wfdiscord)
</details>

<details> <summary>Twitter Events</summary>

 - `tweet`
 - `retweet`
 - `reply`
 - `quote`
</details>

<br />
<details> <summary>RSS Feeds</summary>

 - [Players helping Players](https://forums.warframe.com/forum/38-players-helping-players)
 - [PC Updates](https://forums.warframe.com/forum/3-pc-update-notes)
 - [PC Announcements](https://forums.warframe.com/forum/2-pc-announcements)
 - [PS4 Updates](https://forums.warframe.com/forum/152-ps4-update-notes)
 - [PS4 Announcements](https://forums.warframe.com/forum/151-ps4-announcements)
 - [XB1 Updates](https://forums.warframe.com/forum/253-xbox-one-update-notes)
 - [XB1 Announcements](https://forums.warframe.com/forum/252-xbox-one-announcements)
 - [Switch Updates](https://forums.warframe.com/forum/1196-nintendo-switch-update-notes)
 - [Switch Announcements](https://forums.warframe.com/forum/1198-nintendo-switch-announcements)
 - [News](https://forums.warframe.com/forum/170-announcements-events)
 - [Developers Workshop](https://forums.warframe.com/forum/123-developer-workshop-update-notes)
 - <details>
  <summary>Staff Replies</summary>

  - [[DE]Rebecca](https://forums.warframe.com/discover/839)
  - [[DE]Danielle](https://forums.warframe.com/discover/840)
  - [[DE]Drew](https://forums.warframe.com/discover/841)
  - [[DE]Glen](https://forums.warframe.com/discover/842)
  - [[DE]Taylor](https://forums.warframe.com/discover/1171)
  - [[DE]Steve](https://forums.warframe.com/discover/1777)
  - [[DE]Helen](https://forums.warframe.com/discover/1291)
  - [[DE]Saske](https://forums.warframe.com/discover/1294)
  - [[DE]Kaz](https://forums.warframe.com/discover/1295)
  - [[DE]Pablo](https://forums.warframe.com/discover/1299)
  - [[DE]Connor](https://forums.warframe.com/discover/1778)
  - [[DE]Marcus](https://forums.warframe.com/discover/1779)
  - [[DE]George](https://forums.warframe.com/discover/1780)
  - [[DE]Bear](https://forums.warframe.com/discover/1781)
  </details>
</details>

<br />
<details><summary>Other Methods</summary>

Method | Params | Output
:-- | -- | --
`getRss` | -- | Map of RSS feeds with `url` and `items`
`getWorldstate` | `platform`, `locale` | Worldstate objects
-- | `platform` | Defaults to `pc`. One of `pc`, `ps4`, `xb1`, `swi`.
-- | `locale` | Defaults to `en`. Any of the locales included in [`worldstate-data`](https://github.com/WFCD/warframe-worldstate-data)

`*` Denote required

</details>
<br />

Help & Contact
[![Discord](https://img.shields.io/discord/256087517353213954.svg?logo=discord)](https://discord.gg/jGZxH9f)
