# Worldstate Emitter

Suuuper simple emitter for worldstate events.

Very opinionated decisions on what events and event names, as well as.... everything else

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![npm](https://img.shields.io/npm/v/worldstate-emitter.svg)](https://www.npmjs.com/package/worldstate-emitter)
[![npm downloads](https://img.shields.io/npm/dm/worldstate-emitter.svg)](https://www.npmjs.com/package/worldstate-emitter)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Discord](https://img.shields.io/discord/256087517353213954.svg?logo=discord)](https://discord.gg/jGZxH9f)

## Installation

```bash
npm install worldstate-emitter
```

This package requires Node.js 20.10.0 or higher and is an ES Module.

### Peer Dependencies

You'll also need to install the following peer dependencies:

```bash
npm install warframe-worldstate-parser@^5 warframe-worldstate-data@^3
```

### Optional Dependencies

For better logging support:

```bash
npm install winston@^3
```

## Usage

### Basic Example

```typescript
import WorldstateEmitter from "worldstate-emitter";

// Create emitter instance
const emitter = await WorldstateEmitter.make({
  locale: "en",
  features: ["worldstate", "rss", "twitter"],
});

// Listen for worldstate events
emitter.on("ws:update:event", (event) => {
  console.log("New worldstate event:", event.id);
});

// Listen for RSS posts
emitter.on("rss", (post) => {
  console.log("New forum post:", post.title);
});

// Listen for tweets
emitter.on("tweet", (tweet) => {
  console.log("New tweet:", tweet.text);
});

// Get current worldstate
const worldstate = emitter.getWorldstate("en");
console.log("Current worldstate:", worldstate);
```

### TypeScript Support

This package is written in TypeScript and includes full type definitions. All types are automatically available when using TypeScript:

```typescript
import WorldstateEmitter from "worldstate-emitter";
import type WorldState from "warframe-worldstate-parser";

const emitter = await WorldstateEmitter.make({ locale: "en" });

// TypeScript will infer the correct types
const ws: WorldState | undefined = emitter.getWorldstate("en");
```

### Configuration Options

```typescript
interface WorldstateEmitterOptions {
  locale?: string; // Language to filter events (e.g., 'en', 'es', 'de')
  features?: string[]; // Features to enable: 'worldstate', 'rss', 'twitter'
}

const emitter = await WorldstateEmitter.make({
  locale: "en", // Optional: filter to English only
  features: ["worldstate", "rss"], // Optional: only enable these features
});
```

### Environment Variables

Configure the emitter with environment variables:

- `LOG_LEVEL` - Logging level (default: `error`)
- `WORLDSTATE_URL` - Custom worldstate API URL
- `KUVA_URL` - Custom Kuva/Arbitration data URL
- `SENTIENT_URL` - Custom Sentient Anomaly data URL
- `WORLDSTATE_CRON` - Cron pattern for worldstate updates (default: `25 */5 * * * *`)
- `WS_EXTERNAL_CRON` - Cron pattern for external data (default: `0 */10 * * * *`)
- `WS_EMITTER_FEATURES` - Comma-separated list of features to enable
- `TWITTER_KEY` - Twitter API consumer key
- `TWITTER_SECRET` - Twitter API consumer secret
- `TWITTER_BEARER_TOKEN` - Twitter API bearer token
- `TWITTER_TIMEOUT` - Twitter update interval in ms (default: `60000`)

## Emitter Events

### Main Events

| Emitter Event     | Emit key           | Description                                 |
| :---------------- | ------------------ | ------------------------------------------- |
| RSS               | `rss`              | New forum post from DE                      |
| Raw Worldstate    | `ws:update:raw`    | Raw worldstate data updated                 |
| Parsed Worldstate | `ws:update:parsed` | Parsed worldstate data available            |
| Worldstate Event  | `ws:update:event`  | Individual worldstate event                 |
| Tweet             | `tweet`            | New tweet from one of the selected accounts |

### API Methods

| Method            | Parameters          | Returns                   | Description                   |
| :---------------- | :------------------ | :------------------------ | :---------------------------- |
| `getRss()`        | -                   | `RssFeedItem[]`           | Get current RSS feed items    |
| `getWorldstate()` | `language?: string` | `WorldState \| undefined` | Get worldstate for a language |
| `getTwitter()`    | -                   | `Promise<any>`            | Get Twitter data              |
| `debug`           | -                   | `DebugInfo`               | Get debug information         |

**Parameters:**

- `language` - Defaults to `en`. Any locale from [`warframe-worldstate-data`](https://github.com/WFCD/warframe-worldstate-data)

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

<br />
<details> <summary>Twitter Events</summary>

- `tweet`
- `retweet`
- `reply`
- `quote`
</details>

<br />
<details><summary>RSS Feeds</summary>

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

 <details><summary>Staff Replies</summary>

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

## Development

### Building

This project is written in TypeScript and uses `tsdown` for building:

```bash
npm run build
```

This generates:

- `dist/index.mjs` - Compiled JavaScript module
- `dist/index.d.mts` - TypeScript type definitions

### Testing

```bash
npm test
```

Tests use Mocha with `tsx` for TypeScript support.

### Linting

This project uses Biome for linting and formatting:

```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

### Documentation

Generate TypeDoc documentation:

```bash
npm run build:docs
```

## Project Structure

```haskell
worldstate-emitter/
├── handlers/          # Event handlers
│   ├── events/       # Event processors
│   ├── RSS.ts        # RSS feed handler
│   ├── Twitter.ts    # Twitter API handler
│   └── Worldstate.ts # Worldstate handler
├── utilities/        # Utility classes and functions
│   ├── Cache.ts      # Cron-based cache
│   ├── WSCache.ts    # Worldstate cache wrapper
│   ├── env.ts        # Environment configuration
│   └── index.ts      # Shared utilities
├── resources/        # Configuration files
│   ├── config.ts     # URL and cron patterns
│   ├── rssFeeds.json # RSS feed definitions
│   └── tweeters.json # Twitter accounts to watch
├── types/            # TypeScript type definitions
├── test/             # Test files
└── dist/             # Build output (generated)
```

## Contributing

This project uses:

- **TypeScript** with strict mode
- **Biome** for linting and formatting
- **Conventional Commits** for commit messages
- **Semantic Release** for automated versioning

Before submitting a PR:

1. Run `npm run lint:fix` to format code
2. Run `npm test` to ensure tests pass
3. Run `npm run build` to verify the build
4. Use conventional commit messages

## License

Apache-2.0

## Help & Contact

[![Discord](https://img.shields.io/discord/256087517353213954.svg?logo=discord)](https://discord.gg/jGZxH9f)
