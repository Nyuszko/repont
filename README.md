# 🍾 REPONT — Palackvisszaváltó Tycoon

> 3D idle tycoon játék böngészőben: üzemeltess visszaváltó automatákat, gyűjts palackokat, teljesíts küldetéseket és építs visszaváltási birodalmat!

**▶️ Játék:** [https://nyuszko.github.io/repont/](https://nyuszko.github.io/repont/)

---

## Játékmenet

Az első automata mögötted áll egy lakótelepi sarokban. A palackok a földön hevernek: kattints rájuk, majd nyomd meg a **Bedobás** gombot (vagy kattints az automatára) — a gép megszámolja és kifizeti őket.

A játék onnan csúszik át idle-be, amikor felbérölöd az első gyűjtőt: ők maguktól szedik össze és hordják be a palackokat, te közben fejlesztesz. A gép sorának van kapacitása — túl sok palacknál megáll, és pirosan villog a kijelzője.

### Főbb rendszerek

- 🌍 **3D low-poly világ** — procedurálisan kódból épített utca, automatával, fákkal, lámpaoszlopokkal; orbit kamera (húzás-forgatás, görgő/pinch-zoom)
- 🍾 **Négy palacktípus** — PET (50 Ft), italos doboz (50 Ft), zsugorított PET (25 Ft), prémium üveg (250 Ft)
- ⚙️ **Automata-fejlesztések** — gépsebesség, sor-kapacitás, árszorzó, nagyobb gyűjtőterület
- 👷 **Gyűjtő NPC-k** — Béla, Gyula és Mari járják a színteret, felveszik és behozják a palackokat; a 10. fő felett már sebességnövekedést adnak
- 📜 **12 küldetés** — láncolt célok Ft- és ingyenes fejlesztés-jutalmakkal, követő a képernyőn
- 📍 **5 helyszín** — lakótelepi sarok → szabadtéri piac → fesztivál tér → stadion előtere → repülőtér; egyre több palack, egyre drágább belépő
- 💎 **Franchise (prestige)** — újraindítás örök +25%-os palackérték-szorzóval minden körben
- 🕐 **Nap/éj ciklus** — 3 perces ciklus, este kigyúlnak a lámpák
- 💤 **Offline jövedelem** — távollétben is termel (8 óra limit, 50%-os hatásfok, csak gyűjtőkkel)
- 💾 **Mentés** — localStorage autosave 10 másodpercenként, verzionált sémával és migrációkkal; export/import a vágólapra
- 🔊 **Procedurális hang** — WebAudio-szintézis, nulla hangfájl
- 📱 **Mobil** — érintéses kamera, csökkentett árnyékok és pixelrázs a gyengébb eszközökön

### Tippek

- Az első küldetés 1 palack — ne hagyd üresen a gépet, a dugulás ugyanis leállítja a bedobást.
- Az ár-szorzó minden palackra hat, tehát érdemes előbb azt fejleszteni, mint a sebességet.
- Ha a sor megtelik, a gyűjtők is megállnak: a kapacitás a legkínosabb szűk keresztmetszet.

---

## Technológia

| Réteg | Eszköz |
|---|---|
| Build | Vite 8, `base: '/repont/'` |
| Nyelv | TypeScript 6 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) |
| 3D | Three.js 0.186 |
| UI | Saját, függőség nélküli komponensek (HUD, 6 panel, toast) |
| Hang | WebAudio (oszcillátor-alapú SFX) |
| Teszt | Vitest — 63 teszt |
| Minőség | ESLint 10 (flat config), Prettier, GitHub Actions CI |

### Projektstruktúra

```
src/
  core/      GameLoop, Store, SaveManager (migrációkkal), format
  game/      Tiszta játéklogika: bottles, economy, progression,
             upgrades, quests, locations, prestige, Game (kábel)
  three/     SceneManager, World, Machine, BottleField, Collector,
             DayNightCycle, ParticleBurst, Effects, Interactions
  ui/        Hud, Panel, UpgradePanel, QuestPanel, LocationPanel,
             SettingsPanel, StatsPanel, Tutorial, Toast
  audio/     SoundEngine
tests/       Vitest: format, economy, save/migráció, progression, quests,
             locations/prestige, időformázás
```

A `game/` réteg három.js-től független és tesztelhető: a gazdasági képletek, küldetés- és haladáslogika tiszta függvények.

---

## Fejlesztés

```bash
npm install      # függőségek telepítése
npm run dev      # fejlesztői szerver (Vite HMR)
npm run build    # tsc --noEmit + production build -> dist/
npm run preview  # a production build előnézete
npm test         # Vitest figyelő módban
npm run test:run # egyszeri tesztfutás
npm run lint     # ESLint
npm run format   # Prettier
```

## CI / CD

| Workflow | Trigger | Feladat |
|---|---|---|
| `.github/workflows/ci.yml` | push / PR | ESLint → Vitest → build |
| `.github/workflows/deploy.yml` | push a `main`-re | build → GitHub Pages deploy |

Minden `main`-re pusholt változás automatikusan felkerül a játékhelyre. Első alkalommál a repóban a **Settings → Pages → Source** értékét **GitHub Actions**-re kell állítani.

## Deployment kézi buildeléssel

```bash
npm run build
```

A `dist/` mappa bárhová statikusan kiszolgálható.

---

## Mérföldkövek

| # | Tartalom | Állapot |
|---|---|---|
| 1 | Scaffold (Vite + TS + Three.js), CI + Pages deploy | ✅ |
| 2 | Alapkör: 3D színtér, automata, palackgyűjtés, bedobás, pénz, mentés | ✅ |
| 3 | Idle: gyűjtő NPC-k, spawner, fejlesztőbolt, dugulás | ✅ |
| 4 | Küldetések, tutorial, toastok, migráció v1 → v2 | ✅ |
| 5 | Polish: nap/éj, részecskék, beállítások, offline jövedelem, mobil | ✅ |
| 6 | Helyszínek, franchise, statisztikák | ✅ |
| 7 | Végleges README, `v1.0` tag | ✅ |

## Licenc

MIT
