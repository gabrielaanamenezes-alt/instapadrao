// Exporta cada template de /templates para PNG em /exports.
// Uso: node scripts/exportar.js            (todos)
//      node scripts/exportar.js 01-capa    (só um)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const pastaTemplates = path.join(raiz, 'templates');
const pastaSaida = path.join(raiz, 'exports');
const filtro = process.argv[2];

(async () => {
  fs.mkdirSync(pastaSaida, { recursive: true });
  const arquivos = fs.readdirSync(pastaTemplates)
    .filter(f => f.endsWith('.html') && (!filtro || f.startsWith(filtro))).sort();

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const gerados = [];
  for (const arq of arquivos) {
    await page.goto('file://' + path.join(pastaTemplates, arq));
    await page.evaluate(() => document.fonts.ready);
    const saida = path.join(pastaSaida, arq.replace('.html', '.png'));
    await page.locator('.post').screenshot({ path: saida });
    gerados.push(saida);
    console.log('✓', path.relative(raiz, saida));
  }

  // Grade de pré-visualização (posts de feed, sem o story)
  if (!filtro) {
    const feed = gerados.filter(g => !g.includes('story'));
    const html = `<body style="margin:0;background:#fff;display:grid;grid-template-columns:repeat(3,360px);gap:6px;padding:6px;width:max-content;height:max-content;align-content:start">${
      feed.map(g => `<img src="file://${g}" style="width:360px;height:450px;display:block">`).join('')}</body>`;
    const tmp = path.join(pastaSaida, '.grade.html');
    fs.writeFileSync(tmp, html);
    await page.goto('file://' + tmp);
    await page.waitForLoadState('load');
    await page.locator('body').screenshot({ path: path.join(pastaSaida, '00-grade-preview.png') });
    fs.unlinkSync(tmp);
    console.log('✓ exports/00-grade-preview.png');
  }
  await browser.close();
})();
