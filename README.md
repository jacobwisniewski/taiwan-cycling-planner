# Taiwan Circuit

An editable, camping-first Taiwan bicycle itinerary. The starter route goes clockwise down the east coast and returns north through the central mountains.

## Run it

```bash
pnpm install
pnpm dev
```

## Deployment

The production site is a Cloudflare Worker with static assets at
[`taiwan.jacobwisniewski.dev`](https://taiwan.jacobwisniewski.dev).

```bash
pnpm run deploy
```

GitHub Actions verifies every pull request and deploys the latest `main` commit.
The repository needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` Actions
secrets.

## What works

- Editable day-by-day itinerary with distances, climbing, camp and onsen notes
- Road-by-road bicycle routing over OpenStreetMap with BRouter's trekking profile
- Draggable Taipei start and overnight stops that automatically rebuild each stage
- Toggleable campground, hot-spring, supply and road-check markers
- Registered, ask-first and community-reported wild-camp leads with confidence labels
- Google Maps links and visible provenance for every mapped lead
- A credited source library explaining how each official guide or rider report informed the plan
- Automatic local saving
- Full road-geometry GPX track export, with overnight waypoints
- Mobile itinerary drawer

## Important

The route follows bicycle-suitable OpenStreetMap roads and paths selected by
BRouter. It is still planning guidance rather than guaranteed turn-by-turn
navigation: map data, access and closures can change. Community camping reports
are scouting leads rather than proof of legality, access or present-day
conditions. Inspect sites in daylight, ask when possible, keep a paid fallback,
and leave no trace.

Confirm road access, tunnel rules, campsite registration, weather and mountain conditions immediately before travel.

Useful official references:

- [Taiwan Cycling Route No. 1](https://eng.taiwan.net.tw/m1.aspx?sNo=0029976)
- [Taiwan legal campground search](https://camp.tad.gov.tw/)
- [East Coast cycling routes](https://www.eastcoast-nsa.gov.tw/en/travel/bike-themes/)
- [Taiwan highway conditions](https://168.thb.gov.tw/)

The complete official and community source list appears inside the planner under **Sources & field notes**.
