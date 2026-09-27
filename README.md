# Lucciola

Una notte nel bosco. Una piccola luce.

Sei una lucciola in un sottobosco immerso nel buio: la tua luce è sia la tua vista che la tua vita, e si consuma col passare del tempo. Sopravvivi fino all'alba.

- **Polline**: raccoglilo per nutrire la luce (le raccolte in rapida successione salgono di nota e valgono di più).
- **Lucciole smarrite**: lampeggiano nel buio. Raggiungile e si uniranno al tuo sciame: fanno più luce e ti proteggono sacrificandosi al posto tuo. Attento, le Ombre le divorano.
- **Ombre**: nel buio vedi solo i loro occhi. La luce le rallenta e le brucia. Ne esistono tre tipi:
  - *Ombra* (occhi rossi): la più comune;
  - *Falena d'ombra* (occhi viola, da 25 s): piccola e fragile, ma vola a zig-zag e scatta all'improvviso;
  - *Colosso* (occhi arancioni, da 70 s): lento e resistente, non si dissolve all'impatto, resiste al Lampo (viene solo respinto e ferito) e da vicino affievolisce la tua luce.
- **Ondate**: a 45, 95 e 128 secondi un gruppo di Ombre arriva tutto dallo stesso lato.
- **Rugiada lunare**: compare di tanto in tanto per pochi secondi. Raccoglila per lo *Splendore*: per 7 secondi la luce è più ampia, non si consuma e brucia le Ombre molto più in fretta.
- **Lampo** (clic o SPAZIO, pulsante dedicato su touch): un'onda di luce che dissolve le Ombre vicine, ma costa luce.
- **Pausa** (ESC o P): congela la partita. Scatta anche da sola se la finestra perde il focus.
- **Audio** (M): musica ambient generativa che si fa più tesa quando le Ombre si avvicinano, più gli effetti sonori. La preferenza viene ricordata.

Durante la prima partita compaiono dei suggerimenti contestuali; a fine partita un riepilogo mostra le statistiche della notte.

Tutta la grafica e l'audio sono generati via codice: il progetto non ha asset esterni.

## Stack

Scaffold creato dal template ufficiale Phaser `template-react-ts` (lo stesso usato da `npm create @phaserjs/game@latest` → Client Framework → React → TypeScript).

- **Phaser 4** per il gameplay (`src/game`)
- **React 19** per menu, HUD e schermate finali (`src/components`)
- **Vite** + **TypeScript**

React e Phaser comunicano tramite `EventBus` (`src/game/EventBus.ts`); i nomi degli eventi e i payload sono tipizzati in `src/game/events.ts`.

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm install` | Installa le dipendenze |
| `npm run dev` | Avvia il dev server su http://localhost:8080 |
| `npm run build` | Build di produzione in `dist/` |
| `npm run dev-nolog` / `npm run build-nolog` | Come sopra, senza il ping anonimo di statistiche di Phaser (`log.js`) |

## Struttura

```
src/
├── App.tsx               # macchina a stati della UI (menu / gioco / fine)
├── PhaserGame.tsx        # ponte React ↔ Phaser (dal template)
├── components/           # MenuScreen, Hud, Toast, PausePanel, EndPanel, Icons
└── game/
    ├── main.ts           # configurazione Phaser
    ├── constants.ts      # dimensioni, bilanciamento, tipi di Ombra, record
    ├── events.ts         # eventi React ↔ Phaser
    ├── audio.ts          # effetti sonori e musica generativa (WebAudio)
    ├── world.ts          # generatore procedurale del sottobosco
    └── scenes/
        ├── Boot.ts       # genera le texture
        ├── Menu.ts       # sfondo animato del menu
        └── Game.ts       # gameplay
```

Per ritoccare la difficoltà, modifica `TUNING` e `SHADOWS` in `src/game/constants.ts`.
