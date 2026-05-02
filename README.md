# ◆ Precursor (_name subject to change_)



A Guild Wars 2 legendary crafting tracker. Connect your GW2 API key to see live inventory counts against every material in your legendary's recipe tree, track owned legendaries from the Legendary Armory, and manage your daily/weekly to-do list.


## Features

Completed:
- **Legendary tracker** — Armor (Raid/Envoy, Obsidian, Mistforged) and Gen 1 weapons, with full nested material trees
- **Live inventory counts** — pulls bank, materials, and shared inventory via the GW2 API
- **Legendary Armory** — items already in your armory show a ◆ badge; others show a progress ring
- **Collapsible material cards** — sticky section headers at every depth level, Expand/Collapse All controls
- **To-Do list** — daily/weekly auto-reset tasks, drag-to-reorder, waypoint codes with clipboard copy
- **Reset timers** — daily, weekly, and season countdowns in the header
- **BlishHUD import** — script to convert BlishHUD `.todo.json` files into the app's import format

Upcoming:
- setting priorities/statuses to legendaries (track, active, etc).
- integrated todo's with legendary tracking
   - linking specific events and vendors to components (ie. meta events for map currencies, weekly mystic clover vendors)
   - provisioner's tokens vendors,
- pace estimations (the fastest vs. avg amount of time to get a legendary set/weapon, based on the events/frequencies/playtime)
- theme/layout overhaul (gw2 watercolor style)
   - expac color themes
   - displaying item icons
   - wiki links
- gw2 trading post integration
- better mat source/vendor information
- refresh wallet/bank/storage
- currency display
- mastery point tracker
- cheatsheets
	- stat cheatsheet
	- class cheatsheet - rotation
- legendary runes
- legendary accessories (amulet, rings, etc)


## Screenshots

![To-Do list with daily/weekly tasks and waypoint codes](demo/0%20(1).png)

![Weapon tracker showing Gen 1 legendary recipe tree](demo/0%20(2).png)

![Armor tracker with live inventory counts and nested material cards](demo/0%20(3).png)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your GW2 API key (needs `account`, `inventories`, `characters`, `wallet` permissions).

## Importing BlishHUD todos

If you use [BlishHUD](https://blishhud.com/), convert your existing todos:

```bash
npm run import:blishhud
```

Then in the app: **To-Do → Import** and select `precursor-todos-import.json` from the project root.

## Tech

React · TypeScript · Vite · GW2 official API · gw2efficiency recipe API
