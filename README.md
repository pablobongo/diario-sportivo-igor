# Diario Sportivo di Igor

PWA personale per registrare attività sportive, statistiche e log.

## Struttura

```
index.html
manifest.webmanifest
service-worker.js
offline.html
assets/
  css/
    main.css
  js/
    app.js         — bootstrap e router
    db.js          — IndexedDB
    activities.js  — configurazione sport e campi
    home.js        — Home view
    register.js    — form registrazione
    stats.js       — statistiche e grafici
    log.js         — log e modifica attività
    settings.js    — impostazioni, export, import
    utils.js       — utilità
icons/
  icon-192.png
  icon-512.png
  icon-maskable-192.png
  icon-maskable-512.png
```

## Deploy

Carica tutti i file su GitHub Pages nel repository `diario-sportivo-igor`.
La PWA è offline-first: il service worker mette in cache tutti gli asset al primo caricamento.
