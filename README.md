# SLMO Portal 1.0

Brezplačen statični spletni portal, ki bere podatke iz Google Preglednic.

## Povezava s preglednico
1. V URL-ju Google Preglednice kopiraj del med `/d/` in `/edit`.
2. V `config.js` zamenjaj `VNESI_ID_GOOGLE_PREGLEDNICE` z ID-jem.
3. Preglednico deli kot **Vsi s povezavo – Gledalec**.

Portal pričakuje liste: `Lestvica`, `Tekme`, `Turnirji`, `Ekipe`, `Nastavitve`.

## Brezplačna objava
### GitHub Pages
Naloži vse datoteke v javni GitHub repozitorij in v **Settings → Pages** izberi vejo `main` in mapo `/root`.

### Netlify
V Netlify izberi **Add new site → Deploy manually** in povleci celotno mapo portala.

## Logotipi ekip
Na listu `Ekipe` v stolpec `LOGOTIP / URL` vpiši neposreden javni URL PNG/JPG logotipa.
