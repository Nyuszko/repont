# 🍾 REPONT — Palackvisszaváltó Tycoon

> 3D idle tycoon játék böngészőben: üzemeltess visszaváltó automatákat, gyűjts palackokat, teljesíts küldetéseket és építs visszaváltási birodalmat!

**▶️ Játék indítása:** [https://nyuszko.github.io/repont/](https://nyuszko.github.io/repont/)

---

## A játékról

A REPONT egy böngészős 3D fejlesztgetős (idle tycoon) játék, amely a magyar visszaváltási rendszer köré épül. Egyetlen automatával indulsz egy lakótelepi sarokban — kattintással gyűjtesz és visszaváltasz, majd a bevételekből fejlesztesz, gyűjtőket bérelsz és új helyszíneket nyitsz, míg a jövedelem magától folyik.

### Főbb funkciók

- 🌍 **3D low-poly világ** — procedurálisan, kódból felépített színtér, orbit kamera
- 🍾 **Palacktípusok** — PET, fémdoboz, zsugorított PET, prémium üveg
- ⚙️ **Automata-fejlesztés** — sebesség, kapacitás, megbízhatóság
- 👷 **Gyűjtők bérlése** — passzív jövedelem, NPC-k akik járják a színteret és hordják a palackokat
- 📜 **Küldetés-lánc** — jutalmazott questek folyamatos célokkal
- 📍 **Helyszínek** — lakótelep → piac → fesztivál → stadion → repülőtér
- 💤 **Offline jövedelem** — távollétben is termel a cég
- 💾 **Automatikus mentés** — localStorage + export/import
- 📱 **Mobil-kompatibilis** — érintéses kamera és UI

*(a teljes funkciólista a fejlesztés előrehaladtával bővül)*

## Technológia

| Réteg | Eszköz |
|---|---|
| Build | Vite 8 |
| Nyelv | TypeScript (strict) |
| 3D | Three.js |
| UI | Saját, függőség nélküli komponensek |
| Hang | WebAudio (procedurális SFX) |
| Teszt | Vitest |
| Minőség | ESLint + Prettier + GitHub Actions CI |

## Fejlesztés

```bash
npm install     # függőségek
npm run dev     # fejlesztői szerver
npm run build   # production build (dist/)
npm run preview # build előnézete
npm test        # tesztek (watch)
npm run lint    # ESLint
```

## Deployment

A `main` ágra pusholt változtatások automatikusan build-elnek és felkerülnek a GitHub Pages-re a `.github/workflows/deploy.yml` workflow-val.

## Licenc

MIT
