const { chromium } = require('playwright-core');
const EXE = process.env.CHROME_PATH || undefined; // set CHROME_PATH, or run `npx playwright-core install chromium-headless-shell`
const OUT = require('path').join(__dirname, '..', '.tmp'); require('fs').mkdirSync(OUT, { recursive: true });
const U = process.argv[2] || 'http://127.0.0.1:8765/';
(async () => {
  const b = await chromium.launch(EXE ? { executablePath: EXE } : {});
  const errs = [];
  const mk = async (opts) => { const c = await b.newContext(opts); const p = await c.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|favicon/.test(m.text())) errs.push('console ' + m.text()); }); return p; };
  const p = await mk({ viewport: { width: 1360, height: 900 } });
  const log = (...a) => console.log(...a);
  await p.goto(U + '#home', { waitUntil: 'networkidle' });
  log('home areas:', await p.locator('.area').count(), '| contents:', await p.locator('.contents li').count(), '| katex in hero:', await p.locator('.hero-eq .katex-display').count());
  // every lecture: count figures, render all solutions
  let qFigs = 0, solFigs = 0, cards = 0, failed = 0;
  const data = await p.evaluate(() => DATA.LECTURES.map(L => ({ n: L.n, ex: L.ex.map(e => ({ id: e.id, type: e.type, a: e.a })) })));
  const card = id => p.locator(`.qcard[data-id="${id}"]`);
  const bad = [];
  for (const L of data) {
    await p.goto(U + '#l' + L.n);
    cards += await p.locator('.qcard').count();
    qFigs += await p.locator('.qfig .fig').count();
    for (const e of L.ex) {
      const c = card(e.id);
      if (e.type === 'num') { await c.locator('.qans input[type=text]').fill(String(e.a)); await c.locator('[data-act="check"]').click(); if (!(await c.locator('.feedback').first().textContent()).startsWith('Correct')) bad.push(e.id); }
      else if (e.type === 'mcq') { await c.locator(`.opt[data-i="${e.a}"]`).click(); await c.locator('[data-act="check"]').click(); if (!(await c.locator('.feedback').first().textContent()).startsWith('Correct')) bad.push(e.id); }
      else if (e.type === 'order') await c.locator('[data-act="reveal"]').click();
      else await c.locator('[data-act="reveal-open"]').click();
    }
    solFigs += await p.locator('.sol .fig').count();
    failed += await p.locator('.fig-body', { hasText: 'Figure failed to render' }).count();
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) log('desktop overflow L' + L.n, ov);
  }
  log(`cards ${cards} · question figures ${qFigs} · solution figures ${solFigs} · failed renders ${failed} · grading failures ${bad.length ? bad : 'none'}`);
  // equation size on desktop
  await p.goto(U + '#l1');
  log('display eq font-size (1.5):', await p.evaluate(() => getComputedStyle(document.querySelector('.qcard[data-id="1.5"] .qeq .katex-display')).fontSize), '| inline katex in text:', await p.evaluate(() => getComputedStyle(document.querySelector('.qcard[data-id="1.5"] .qtext .katex')).fontSize), '| mathml present:', await p.locator('.qcard[data-id="1.5"] .katex-mathml').count() > 0);
  log('aside layout for 1.2:', await p.evaluate(() => document.querySelector('.qcard[data-id="1.2"] .qbody').classList.contains('has-aside')));
  // causal stepper (1.9): step through and keyboard
  const s19 = card('1.9').locator('.qfig');
  log('1.9 step 1 caption:', (await s19.locator('.stp-cap').textContent()).slice(0, 40));
  await s19.locator('[data-s="next"]').click(); log('1.9 masked cells after step 2:', await s19.locator('.mx-c.masked').count());
  await s19.locator('[data-s="next"]').focus(); await p.keyboard.press('Enter'); log('1.9 keyboard -> step 3, row-sum notes:', await s19.locator('.mx-note').count(), '| masked show 0:', await s19.locator('.mx-c.masked').first().textContent());
  await s19.locator('[data-s="reset"]').click(); log('1.9 reset ->', (await s19.locator('.stp-cap').textContent()).slice(0, 22));
  // multi-head head switch
  const mh = card('1.7').locator('.qfig'); await mh.locator('[data-s="next"]').click(); await mh.locator('[data-s="next"]').click();
  await mh.locator('.mh-h[data-h="0"]').click(); log('1.7 head 1 selected:', await mh.locator('.mh-h[aria-checked="true"]').textContent(), '| heatmap cells:', await mh.locator('.mx-c.heat').count());
  // decoding interactive in 2.11 solution
  await p.goto(U + '#l2');
  const d = card('2.11').locator('.sol .fig');
  log('2.11 kept @0.75:', await d.locator('.hb-row:not(.excluded)').count());
  await d.locator('input[type=range]').first().fill('0.3'); log('2.11 kept @0.3:', await d.locator('.hb-row:not(.excluded)').count());
  await d.locator('.ix-reset').click(); log('2.11 after reset:', await d.locator('.hb-row:not(.excluded)').count());
  // segmented radio with keyboard (5.3)
  await p.goto(U + '#l5'); const z = card('5.3').locator('.sol .fig');
  await z.locator('.segb[data-v="2"]').focus(); await p.keyboard.press('ArrowRight'); log('5.3 ZeRO-3 via keyboard:', (await z.locator('.readout').textContent()).trim());
  // playgrounds
  for (const k of ['attention', 'multihead', 'decoding', 'passk', 'diffusion']) { await p.goto(U + '#play-' + k); log('play', k, '| eq:', await p.locator('.pg-eq .katex').count() > 0, '| reset:', await p.locator('.pg-reset').count()); }
  await p.goto(U + '#play-attention'); log('attention out:', (await p.textContent('#pa-out')).trim());
  await p.locator('#pa-q input').first().fill('3'); log('after edit:', (await p.textContent('#pa-out')).trim()); await p.click('.pg-reset'); log('after reset:', (await p.textContent('#pa-out')).trim());
  await p.goto(U + '#play-diffusion'); await p.click('#pf-step'); await p.click('#pf-step'); log('diffusion:', await p.textContent('#pf-rinfo'));
  await p.goto(U + '#play-passk'); log('passk:', (await p.textContent('#pk-out')).replace(/\s+/g, ' '));
  // labs
  await p.goto(U + '#labs'); log('labs listed:', await p.locator('.lab-list li').count());
  await p.goto(U + '#lab5'); log('lab5 sections:', await p.locator('.lab-sec').count(), '| toc:', await p.locator('#lab-toc button').count(), '| highlighted kw:', await p.locator('pre.code .kw').count() > 0);
  await p.click('[data-file="solution"]'); log('lab5 solution shown:', (await p.textContent('#lab-code')).includes('m_new = max'));
  // review + notes still work
  await p.evaluate(() => localStorage.clear()); await p.goto('about:blank'); await p.goto(U + '#l1');
  await card('1.2').locator('input[type=text]').fill('5'); await card('1.2').locator('[data-act="check"]').click();
  await card('1.2').locator('[data-act="note"]').click(); await card('1.2').locator('.note-box textarea').fill('Check'); await p.waitForTimeout(300);
  log('review count:', await p.textContent('#review-count'), '| notes count:', await p.textContent('#notes-count'));
  await p.goto(U + '#review'); log('review cards:', await p.locator('.qcard').count());
  await p.goto(U + '#notes'); log('email has note:', (await p.textContent('#email')).includes('[1.2]'));
  await p.goto(U + '#l1'); await p.screenshot({ path: OUT + '/r-l1.png' });
  await card('1.5').locator('[data-act="reveal"]').click(); await card('1.5').scrollIntoViewIfNeeded(); await p.screenshot({ path: OUT + '/r-15.png' });
  // reduced motion: steppers default to all steps
  const rm = await mk({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto(U + '#l1'); log('reduced motion: show-all checked:', await rm.locator('.qcard[data-id="1.9"] [data-s="all"]').isChecked(), '| frames:', await rm.locator('.qcard[data-id="1.9"] .stp-frame').count());
  // phone, dark
  const ph = await mk({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  for (const h of ['#home', '#questions', ...data.map(L => '#l' + L.n), '#playgrounds', '#play-attention', '#play-multihead', '#play-decoding', '#play-passk', '#play-diffusion', '#labs', '#lab1', '#lab4', '#review', '#notes']) {
    await ph.goto(U + h); const ov = await ph.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 0) log('PHONE OVERFLOW', h, ov);
  }
  await ph.goto(U + '#l2'); await ph.locator('.qcard[data-id="2.11"] [data-act="reveal"]').click();
  const ov2 = await ph.evaluate(() => document.documentElement.scrollWidth - innerWidth); log('phone overflow after reveals on L2:', ov2);
  await ph.goto(U + '#l1'); await ph.screenshot({ path: OUT + '/r-phone.png' });
  await ph.goto(U + '#home'); await ph.screenshot({ path: OUT + '/r-phone-home.png' });
  log('errors:', errs.length ? errs.slice(0, 10) : 'none');
  await b.close();
})();
