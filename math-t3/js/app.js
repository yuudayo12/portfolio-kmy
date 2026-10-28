(() => {
  const SETS = window.BANK;
  const byId = Object.fromEntries(SETS.map((s) => [s.id, s]));
  const BAB = SETS.filter((s) => s.no);
  const babByNo = Object.fromEntries(BAB.map((s) => [s.no, s]));
  const TOTAL = SETS.reduce((a, s) => a + s.soalan.length, 0);
  const LETTER = ['A', 'B', 'C', 'D', 'E'];
  const LVL = { 1: ['Asas', 'l1'], 2: ['Aplikasi', 'l2'], 3: ['KBAT', 'l3'] };
  const $app = document.getElementById('app');
  const $nav = document.getElementById('nav');
  const $sheet = document.getElementById('sheet-root');

  /* ---------- Ikon ---------- */
  const I = {
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8.5l1.5 1.5L12 7.5M8 14.5l1.5 1.5 2.5-2.5M14.5 9h2M14.5 15h2"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h7M9 11.5h5"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
    party: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  };

  /* ---------- Simpanan ---------- */
  const KEY = 'cmt3-v1';
  let store = { sets: {} };
  try { store = JSON.parse(localStorage.getItem(KEY)) || store; } catch (e) { /* storan tidak tersedia */ }
  if (!store.sets) store.sets = {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* abaikan */ } };
  const st = (id) => (store.sets[id] ||= { ans: {}, perm: {}, cur: 0, done: false, best: null, tries: 0 });
  const answered = (id) => Object.keys(st(id).ans).length;
  const correctCount = (id) => byId[id].soalan.reduce((a, q, i) => a + (st(id).ans[i] === q.a ? 1 : 0), 0);
  const wrongList = (id) => byId[id].soalan.map((q, i) => i).filter((i) => st(id).ans[i] !== undefined && st(id).ans[i] !== byId[id].soalan[i].a);
  const totalWrong = () => SETS.reduce((a, s) => a + wrongList(s.id).length, 0);

  const shuffle = (n) => {
    const a = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const permFor = (id, qi) => {
    const s = st(id);
    if (!s.perm[qi] || s.perm[qi].length !== byId[id].soalan[qi].o.length) { s.perm[qi] = shuffle(byId[id].soalan[qi].o.length); save(); }
    return s.perm[qi];
  };

  const grade = (p) => {
    if (p >= 85) return ['A', 'Cemerlang'];
    if (p >= 70) return ['B', 'Kepujian'];
    if (p >= 60) return ['C', 'Baik'];
    if (p >= 50) return ['D', 'Memuaskan'];
    if (p >= 40) return ['E', 'Mencapai tahap minimum'];
    return ['F', 'Belum mencapai tahap minimum'];
  };
  const tone = (s) => `--cc:var(--c${s.warna});--tt:var(--t${s.warna})`;
  const plain = (html) => {
    const d = document.createElement('div');
    d.innerHTML = M(html);
    d.querySelectorAll('svg').forEach((n) => n.remove());
    d.querySelectorAll('.fr').forEach((n) => { n.textContent = `${n.children[0].textContent}/${n.children[1].textContent}`; });
    d.querySelectorAll('sup').forEach((n) => { n.textContent = '^' + n.textContent; });
    return d.textContent.replace(/\s+/g, ' ').trim();
  };
  const isSvg = (s) => String(s).trimStart().startsWith('<svg');
  const babOf = (set, q) => babByNo[q.bab || set.no];

  /* ---------- Navigasi ---------- */
  function renderNav(active) {
    const w = totalWrong();
    const items = [
      ['utama', 'Latihan', I.pen],
      ['semakan', 'Semakan', I.review, w ? `<span class="badge">${w}</span>` : ''],
      ['nota', 'Nota', I.book],
    ];
    $nav.innerHTML = items.map(([h, t, ic, b = '']) =>
      `<button type="button" data-go="${h}" ${active === h ? 'aria-current="page"' : ''}>${ic}<span>${t}</span>${b}</button>`).join('');
  }
  $nav.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) location.hash = b.dataset.go; });

  function route() {
    closeSheet();
    const h = (location.hash || '#utama').slice(1);
    document.body.classList.toggle('quiz-mode', h.startsWith('set-'));
    let m;
    if ((m = h.match(/^set-(\w+)$/)) && byId[m[1]]) return viewQuiz(m[1]);
    if ((m = h.match(/^keputusan-(\w+)$/)) && byId[m[1]]) return viewResult(m[1]);
    if ((m = h.match(/^semakan(?:-(\w+))?$/))) return viewReview(m[1] && byId[m[1]] ? m[1] : null);
    if ((m = h.match(/^nota(?:-(\d+))?$/))) return viewNotes(m[1] ? +m[1] : null);
    return viewHome();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

  /* ---------- Utama ---------- */
  function setCard(s) {
    const n = s.soalan.length, a = answered(s.id), S = st(s.id);
    let pill;
    if (S.done) pill = `<span class="pill ok">Markah ${correctCount(s.id)}/${n}</span>`;
    else if (a) pill = `<span class="pill go">Sambung ${a}/${n}</span>`;
    else pill = `<span class="pill new">Belum mula</span>`;
    const best = S.best != null && S.tries > 1 ? ` · terbaik ${S.best}/${n}` : '';
    return `<button type="button" class="set" style="${tone(s)}" data-set="${s.id}">
      <span class="ico" aria-hidden="true"><span>${s.ikon}</span></span>
      <span class="set-t"><small>${s.no ? 'Bab ' + s.no : 'Semua bab'} · ${n} soalan${best}</small><b>${s.tajuk}</b></span>
      <span class="set-m"><span class="bar"><i style="width:${(a / n) * 100}%"></i></span>${pill}</span>
    </button>`;
  }
  function viewHome() {
    renderNav('utama');
    const ans = SETS.reduce((a, s) => a + answered(s.id), 0);
    const cor = SETS.reduce((a, s) => a + correctCount(s.id), 0);
    const done = SETS.filter((s) => st(s.id).done).length;
    const mix = SETS.filter((s) => !s.no);
    $app.innerHTML = `
      <section class="hero">
        <h1>Latihan Matematik <mark>Tingkatan 3</mark></h1>
        <p>Pilih satu bab dan jawab soalan. Jika salah, soalan itu disimpan dalam <b>Semakan</b>, dan di sana kamu boleh lihat cara kira langkah demi langkah.</p>
        <div class="stats">
          <div class="stat"><b>${ans}<small style="font-size:14px;color:var(--muted)">/${TOTAL}</small></b><span>soalan dijawab</span></div>
          <div class="stat"><b>${ans ? Math.round((cor / ans) * 100) : 0}%</b><span>ketepatan</span></div>
          <div class="stat"><b>${done}<small style="font-size:14px;color:var(--muted)">/${SETS.length}</small></b><span>set selesai</span></div>
        </div>
      </section>
      <div class="sec-h"><h2>Latihan ikut bab</h2><span>Silibus KSSM, 9 bab</span></div>
      <div class="sets">${BAB.map(setCard).join('')}</div>
      <div class="sec-h"><h2>Ujian campuran</h2><span>Gaya peperiksaan, semua bab</span></div>
      <div class="sets">${mix.map(setCard).join('')}</div>
      <div class="reset" id="reset">
        <span>Rekod disimpan dalam peranti ini sahaja.</span>
        <button type="button" class="btn ghost sm" id="reset-btn">Padam semua rekod</button>
      </div>`;
    $app.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.set;
      location.hash = st(id).done ? 'keputusan-' + id : 'set-' + id;
    }));
    document.getElementById('reset-btn').addEventListener('click', () => {
      const box = document.getElementById('reset');
      box.innerHTML = `<span>Padam semua markah dan jawapan? Tindakan ini tidak boleh dibatalkan.</span>
        <span class="confirm"><button type="button" class="btn ghost sm" id="rs-no">Batal</button><button type="button" class="btn danger sm" id="rs-yes">Ya, padam</button></span>`;
      document.getElementById('rs-no').addEventListener('click', viewHome);
      document.getElementById('rs-yes').addEventListener('click', () => { store = { sets: {} }; save(); viewHome(); });
    });
  }

  /* ---------- Kuiz ---------- */
  function optHtml(set, qi, mode) {
    const q = set.soalan[qi], S = st(set.id), perm = permFor(set.id, qi), chosen = S.ans[qi];
    const svg = q.o.some(isSvg);
    const btns = perm.map((oi, pos) => {
      let cls = '', tag = '';
      if (chosen !== undefined) {
        if (oi === chosen) { cls = chosen === q.a ? 'pick-ok' : 'pick-bad'; if (mode === 'review') tag = `<span class="tag ${chosen === q.a ? 'c' : 'y'}">Jawapan kamu</span>`; }
        else if (mode === 'review' && oi === q.a) { cls = 'is-ans'; tag = '<span class="tag c">Jawapan betul</span>'; }
      }
      return `<button type="button" class="opt ${cls}" data-o="${oi}" ${chosen !== undefined ? 'disabled' : ''}>
        <span class="k">${LETTER[pos]}</span><span class="v">${M(q.o[oi])}</span>${tag}</button>`;
    }).join('');
    return `<div class="opts${svg ? ' svgopts' : ''}">${btns}</div>`;
  }
  function qBody(set, qi, mode) {
    const q = set.soalan[qi];
    const lv = LVL[q.l || 1];
    const bab = q.bab ? `<span class="chip-bab">Bab ${q.bab}: ${babByNo[q.bab].tajuk}</span>` : '';
    return `<div class="qmeta"><span class="lvl ${lv[1]}">${lv[0]}</span>${bab}</div>
      <div class="qtext">${M(q.q)}</div>
      ${q.fig ? `<div class="figbox">${q.fig}</div>` : ''}
      ${optHtml(set, qi, mode)}`;
  }
  function viewQuiz(id) {
    renderNav('');
    const set = byId[id], S = st(id), n = set.soalan.length;
    if (S.done) { location.hash = 'keputusan-' + id; return; }
    const qi = Math.min(S.cur || 0, n - 1);
    const q = set.soalan[qi], chosen = S.ans[qi];
    const a = answered(id);
    const dots = set.soalan.map((qq, i) => {
      const c = S.ans[i] === undefined ? '' : S.ans[i] === qq.a ? 'ok' : 'bad';
      return `<button type="button" class="dot-b ${c} ${i === qi ? 'cur' : ''}" data-q="${i}" aria-label="Soalan ${i + 1}">${i + 1}</button>`;
    }).join('');
    let fb = '';
    if (chosen !== undefined) {
      fb = chosen === q.a
        ? `<div class="fb ok">${I.check}<div><b>Betul!</b><p>${pick(['Bagus, teruskan.', 'Tepat sekali.', 'Hebat, kamu faham konsep ini.', 'Mantap!'], qi)}</p></div></div>`
        : `<div class="fb bad">${I.cross}<div><b>Salah</b><p>Tak apa. Soalan ini disimpan dalam Semakan. Selepas habis set, buka Semakan untuk lihat cara kira yang betul.</p></div></div>`;
    }
    const unans = set.soalan.map((_, i) => i).filter((i) => S.ans[i] === undefined);
    const last = qi === n - 1;
    let nav = `<button type="button" class="btn ghost" id="prev" ${qi === 0 ? 'disabled' : ''}>Sebelum</button>`;
    if (!unans.length) nav += `<button type="button" class="btn hl" id="finish">Lihat keputusan</button>`;
    else nav += `<button type="button" class="btn" id="next" ${last ? 'disabled' : ''}>${chosen === undefined ? 'Langkau' : 'Seterusnya'}</button>`;
    const note = unans.length && last ? `<p class="note-unans">${unans.length} soalan belum dijawab. <button type="button" data-q="${unans[0]}">Pergi ke soalan ${unans[0] + 1}</button></p>` : '';
    $app.innerHTML = `
      <div class="qhead" style="${tone(set)}">
        <div class="qhead-r">
          <button type="button" class="icon-btn" id="back" aria-label="Kembali ke senarai set">${I.back}</button>
          <h2><small>${set.no ? 'Bab ' + set.no : 'Ujian campuran'} · ${a}/${n} dijawab</small>${set.tajuk}</h2>
          <button type="button" class="btn ghost sm" id="nota-btn">${I.book.replace('<svg', '<svg width="16" height="16"')} Nota</button>
        </div>
        <div class="dots">${dots}</div>
      </div>
      <article class="qcard" aria-live="polite">
        <div class="qmeta" style="font-weight:600;color:var(--ink)">Soalan ${qi + 1} daripada ${n}</div>
        ${qBody(set, qi, 'quiz')}
        ${fb}
      </article>
      <div class="qnav">${nav}</div>${note}`;
    const go = (i) => { S.cur = i; save(); viewQuiz(id); };
    $app.querySelector('.dots .cur')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    $app.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => go(+b.dataset.q)));
    $app.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
      if (S.ans[qi] !== undefined) return;
      S.ans[qi] = +b.dataset.o;
      save();
      viewQuiz(id);
      document.querySelector('.fb')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }));
    document.getElementById('back').addEventListener('click', () => { location.hash = 'utama'; });
    document.getElementById('prev').addEventListener('click', () => go(qi - 1));
    document.getElementById('next')?.addEventListener('click', () => go(qi + 1));
    document.getElementById('finish')?.addEventListener('click', () => {
      const sc = correctCount(id);
      S.done = true; S.tries = (S.tries || 0) + 1; S.last = sc; S.best = Math.max(S.best ?? 0, sc);
      save();
      location.hash = 'keputusan-' + id;
    });
    document.getElementById('nota-btn').addEventListener('click', () => openSheet(babOf(set, q)));
  }
  const pick = (arr, i) => arr[i % arr.length];

  /* ---------- Keputusan ---------- */
  function viewResult(id) {
    renderNav('');
    const set = byId[id], S = st(id), n = set.soalan.length;
    if (!S.done) { location.hash = 'set-' + id; return; }
    const sc = correctCount(id), p = Math.round((sc / n) * 100), [g, gl] = grade(p);
    const wr = wrongList(id).length;
    const by = [1, 2, 3].map((l) => {
      const qs = set.soalan.map((q, i) => [q, i]).filter(([q]) => (q.l || 1) === l);
      return [l, qs.filter(([q, i]) => S.ans[i] === q.a).length, qs.length];
    }).filter(([, , t]) => t);
    const C = 2 * Math.PI * 70;
    const msg = p >= 85 ? 'Cemerlang! Kamu sudah kuasai bab ini.' : p >= 60 ? 'Bagus! Semak soalan yang salah untuk jadi lebih mantap.' : 'Jangan risau. Buka Semakan dan belajar cara kira setiap soalan yang salah, kemudian cuba lagi.';
    $app.innerHTML = `
      <section class="result" style="${tone(set)}">
        <div class="qhead-r" style="width:100%"><button type="button" class="icon-btn" id="back" aria-label="Kembali">${I.back}</button><h2 style="text-align:left"><small>${set.no ? 'Bab ' + set.no : 'Ujian campuran'} · Keputusan</small>${set.tajuk}</h2></div>
        <div class="ring"><svg viewBox="0 0 160 160"><circle class="bg" cx="80" cy="80" r="70"/><circle class="fg" cx="80" cy="80" r="70" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - sc / n)}"/></svg>
          <div><b>${sc}/${n}</b><span>${p}%</span></div></div>
        <div class="grade"><span class="grade-l">Gred ${g}</span>${gl}</div>
        <p>${msg}</p>
        <div class="lvl-break">${by.map(([l, c, t]) => `<div><b>${c}/${t}</b><span>${LVL[l][0]}</span></div>`).join('')}</div>
        <div class="acts">
          ${wr ? `<button type="button" class="btn" id="rv">${I.review.replace('<svg', '<svg width="18" height="18"')} Semak ${wr} soalan salah</button>` : `<button type="button" class="btn" id="rv">Lihat semua jalan kira</button>`}
          <button type="button" class="btn ghost" id="again">Cuba semula set ini</button>
          <button type="button" class="btn ghost" id="home">Kembali ke senarai</button>
        </div>
        ${S.tries > 1 ? `<p style="font-size:13px">Percubaan ke-${S.tries} · markah terbaik ${S.best}/${n}</p>` : ''}
      </section>`;
    document.getElementById('back').addEventListener('click', () => { location.hash = 'utama'; });
    document.getElementById('home').addEventListener('click', () => { location.hash = 'utama'; });
    document.getElementById('rv').addEventListener('click', () => { reviewMode = wr ? 'salah' : 'semua'; location.hash = 'semakan-' + id; });
    document.getElementById('again').addEventListener('click', () => {
      Object.assign(S, { ans: {}, perm: {}, cur: 0, done: false });
      save();
      location.hash = 'set-' + id;
    });
  }

  /* ---------- Semakan ---------- */
  let reviewMode = 'salah';
  function solution(set, qi) {
    const q = set.soalan[qi], perm = permFor(set.id, qi);
    const pos = perm.indexOf(q.a);
    const ansTxt = isSvg(q.o[q.a]) ? `pilihan ${LETTER[pos]}` : `${LETTER[pos]}. ${M(q.o[q.a])}`;
    return `<div class="sol">
      <h4>${I.bulb} Cara pengiraan</h4>
      ${q.f ? `<div class="formula"><small>Formula / konsep</small>${M(q.f)}</div>` : ''}
      <ol class="steps">${q.s.map((x) => `<li><div>${M(x)}</div></li>`).join('')}</ol>
      <div class="final">Jawapan: ${ansTxt}</div>
      ${q.tip ? `<div class="tip"><b>Awas:</b> ${M(q.tip)}</div>` : ''}
    </div>`;
  }
  function viewReview(filter) {
    renderNav('semakan');
    const withAns = SETS.filter((s) => answered(s.id));
    const items = [];
    (filter ? [byId[filter]] : withAns).forEach((s) => {
      s.soalan.forEach((q, i) => {
        const a = st(s.id).ans[i];
        if (a === undefined) return;
        if (reviewMode === 'salah' && a === q.a) return;
        items.push([s, i]);
      });
    });
    const chips = [`<button type="button" class="chip" data-f="" aria-pressed="${!filter}">Semua set</button>`]
      .concat(withAns.map((s) => `<button type="button" class="chip" data-f="${s.id}" aria-pressed="${filter === s.id}">${s.no ? 'Bab ' + s.no : s.tajuk} <span class="n">${wrongList(s.id).length} salah</span></button>`)).join('');
    let list;
    if (!withAns.length) {
      list = `<div class="empty">${I.review}<h3>Belum ada jawapan untuk disemak</h3><p>Jawab mana-mana set dahulu. Soalan yang salah akan muncul di sini bersama cara pengiraan.</p><button type="button" class="btn" data-home>Mula latihan</button></div>`;
    } else if (!items.length) {
      list = `<div class="empty">${I.party}<h3>Tiada soalan salah</h3><p>Semua soalan yang kamu jawab ${filter ? 'dalam set ini ' : ''}betul. Tukar ke "Semua dijawab" untuk ulang kaji jalan kira.</p></div>`;
    } else {
      list = items.map(([s, i]) => {
        const q = s.soalan[i], ok = st(s.id).ans[i] === q.a;
        const open = reviewMode === 'salah' && items.length <= 6;
        return `<details class="rv" ${open ? 'open' : ''} style="${tone(s)}">
          <summary><span class="mark ${ok ? 'ok' : 'bad'}">${ok ? I.check : I.cross}</span>
            <span class="sum-t"><small>${s.no ? 'Bab ' + s.no : s.tajuk} · Soalan ${i + 1}</small><span>${plain(q.q)}</span></span>${I.chev}</summary>
          <div class="rv-body" data-s="${s.id}" data-i="${i}"></div>
        </details>`;
      }).join('');
    }
    $app.innerHTML = `
      <section class="rv-head">
        <h1>Semakan</h1>
        <p>Lihat semula soalan yang salah dan belajar cara kiranya langkah demi langkah. Bila sudah faham, cuba semula set itu.</p>
        ${withAns.length ? `<div class="chips">${chips}</div>
        <div class="rv-tools"><div class="seg" role="group" aria-label="Tapis soalan">
          <button type="button" data-m="salah" aria-pressed="${reviewMode === 'salah'}">Salah sahaja (${filter ? wrongList(filter).length : totalWrong()})</button>
          <button type="button" data-m="semua" aria-pressed="${reviewMode === 'semua'}">Semua dijawab</button></div>
          ${filter && st(filter).done ? `<button type="button" class="btn ghost sm" data-retry="${filter}">Cuba semula set ini</button>` : ''}</div>` : ''}
      </section>
      <div class="rv-list">${list}</div>`;
    const fill = (d) => {
      const b = d.querySelector('.rv-body');
      if (b.childElementCount) return;
      const s = byId[b.dataset.s], i = +b.dataset.i;
      b.innerHTML = `<div class="qtext">${M(s.soalan[i].q)}</div>${s.soalan[i].fig ? `<div class="figbox">${s.soalan[i].fig}</div>` : ''}${optHtml(s, i, 'review')}${solution(s, i)}`;
    };
    $app.querySelectorAll('details.rv').forEach((d) => { if (d.open) fill(d); d.addEventListener('toggle', () => d.open && fill(d)); });
    $app.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { location.hash = b.dataset.f ? 'semakan-' + b.dataset.f : 'semakan'; }));
    $app.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { reviewMode = b.dataset.m; viewReview(filter); }));
    $app.querySelector('[data-home]')?.addEventListener('click', () => { location.hash = 'utama'; });
    $app.querySelector('[data-retry]')?.addEventListener('click', (e) => {
      const S = st(e.currentTarget.dataset.retry);
      Object.assign(S, { ans: {}, perm: {}, cur: 0, done: false });
      save();
      location.hash = 'set-' + e.currentTarget.dataset.retry;
    });
  }

  /* ---------- Nota ---------- */
  function notesHtml(s) {
    return s.nota.map((n) => `<div class="nt-sec">
      <h3>${M(n.h)}</h3>
      ${n.p ? `<p>${M(n.p)}</p>` : ''}
      ${n.li ? `<ul>${n.li.map((x) => `<li>${M(x)}</li>`).join('')}</ul>` : ''}
      ${n.f ? `<div class="fbox">${n.f.map((x) => `<div>${M(x)}</div>`).join('')}</div>` : ''}
      ${n.fig ? `<div class="figbox" style="margin-top:8px">${n.fig}</div>` : ''}
      ${n.ex ? `<div class="ex"><b>Contoh:</b> ${M(n.ex)}</div>` : ''}
    </div>`).join('');
  }
  function viewNotes(open) {
    renderNav('nota');
    $app.innerHTML = `
      <section class="rv-head"><h1>Nota formula</h1><p>Ringkasan konsep dan formula penting bagi setiap bab. Baca dulu sebelum menjawab, atau buka semasa latihan melalui butang Nota.</p></section>
      <div class="nt-list">${BAB.map((s) => `<details class="nt" style="${tone(s)}" ${open === s.no ? 'open' : ''}>
        <summary><span class="ico" aria-hidden="true"><span>${s.ikon}</span></span><b><small style="display:block;font:600 11px/1.4 var(--font-body);color:var(--cc);letter-spacing:.05em;text-transform:uppercase">Bab ${s.no}</small>${s.tajuk}</b>${I.chev}</summary>
        <div class="nt-body">${notesHtml(s)}</div></details>`).join('')}</div>`;
  }
  function openSheet(s) {
    $sheet.innerHTML = `<div class="sheet" id="sheet" style="${tone(s)}"><div class="sheet-in" role="dialog" aria-modal="true" aria-label="Nota ${s.tajuk}">
      <div class="sheet-h"><span class="ico" style="width:40px;height:40px;font-size:14px;grid-row:auto" aria-hidden="true"><span>${s.ikon}</span></span><h3>Nota: ${s.tajuk}</h3>
      <button type="button" class="icon-btn" id="sheet-x" aria-label="Tutup nota">${I.close}</button></div>
      <div class="nt-body" style="padding:0">${notesHtml(s)}</div></div></div>`;
    document.getElementById('sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
    document.getElementById('sheet-x').addEventListener('click', closeSheet);
    document.getElementById('sheet-x').focus();
  }
  function closeSheet() { $sheet.innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  route();
})();
