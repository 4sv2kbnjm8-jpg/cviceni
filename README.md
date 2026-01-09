# Cviky — vizualizační jednoduchá webapp

Tento malý statický projekt načítá data z Google Sheets (list `cviky`) a zobrazuje kartu videí s filtrováním a modálním přehrávačem.

Rychlé kroky k zprovoznění lokálně

1. Ujistěte se, že Google Sheets je nastavený jako veřejný pro čtení (nebo alespoň sdílený pro každého s odkazem).
2. Otevřete `index.html` v prohlížeči (dvakrát kliknout) — stránka načte data přímo z Google Sheets.

Nasazení na Vercel (dvě možnosti)

A) Nasazení přes Git (doporučeno — automatické redeploye po push)

- Vytvořte repozitář na GitHub/GitLab/Bitbucket.
- V lokálním adresáři spusťte:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
# nastavte vlastní remote URL níže
git remote add origin git@github.com:USERNAME/REPO.git
git push -u origin main
```

- Přihlašte se do https://vercel.com, klikněte "New Project" → importujte repozitář → Deploy.

B) Nasazení přes Vercel CLI (rychlé jednorázové nasazení)

```bash
npm i -g vercel
vercel login
cd /cesta/k/projektu
vercel    # bude vás provádět kroky a nasadí
```

Po nasazení dostanete veřejné URL (např. `https://your-project.vercel.app`).

Poznámky a tipy

- Pokud nechcete, aby Sheet byl veřejný, museli bychom implementovat serverový proxy nebo použít Google Sheets API s OAuth / API klíčem — to vyžaduje backend a nasazení env proměnných.
- Pokud chcete náhledové obrázky videí, lze použít URL `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg` nebo `hqdefault.jpg`. Přidám to, pokud chcete.

Konfigurace pro Vercel

Soubor `vercel.json` je přiložen v projektu s příkladem jednoduché konfigurace.

---

Chcete, abych:
- vytvořil PR/commit s `vercel.json` a `README.md` (hotovo) a případně `.vercelignore`? 
- přidal náhledové obrázky YouTube do karet?
- pomohl nasadit přes Vercel z vašeho GitHub účtu (můžu poskytnout kroky)?
