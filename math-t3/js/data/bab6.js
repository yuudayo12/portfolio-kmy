(() => {
  const C0 = [150, 118], R = 88;
  const on = (d) => D.onC(C0[0], C0[1], R, d);
  const circ = (o) => D.scene({ w: 300, h: 236, center: C0, ...o, circles: [{ c: C0, r: R }, ...(o.circles || [])] });
  const oLbl = { O: [-12, 10] };

  BANK.push({
    id: 'b6', no: 6, warna: 6, tajuk: 'Sudut dan Tangen bagi Bulatan',
    ikon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="16" cy="13" r="9"/><path d="M3 22h26"/><path d="M16 13v9" stroke-dasharray="2 3"/></svg>',
    nota: [
      {
        h: 'Sudut di lilitan', li: ['Sudut di lilitan yang dicangkum oleh lengkok (atau perentas) yang sama adalah <b>sama</b>.', 'Sudut di pusat = <b>2 ×</b> sudut di lilitan yang dicangkum oleh lengkok yang sama.', 'Sudut di lilitan yang dicangkum oleh <b>diameter</b> = 90°.', 'Lengkok yang sama panjang mencangkum sudut yang sama besar.'],
        fig: circ({ P: { A: on(220), B: on(320), C: on(75), O: C0 }, lpos: oLbl, segs: [['A', 'C'], ['B', 'C'], ['A', 'O'], ['B', 'O']], dots: ['O'], angs: [['A', 'C', 'B', 'x'], ['A', 'O', 'B', '2x']] }),
      },
      { h: 'Sisi empat kitaran', p: 'Sisi empat yang keempat-empat bucunya terletak pada lilitan bulatan.', f: ['Sudut bertentangan: ∠P + ∠R = 180°  dan  ∠Q + ∠S = 180°', 'Sudut peluaran = sudut pedalaman yang bertentangan'] },
      { h: 'Tangen kepada bulatan', li: ['Tangen menyentuh bulatan pada satu titik sahaja (titik ketangenan).', 'Tangen <b>berserenjang</b> dengan jejari pada titik ketangenan: sudut = 90°.', 'Dua tangen dari titik luar P ke bulatan adalah <b>sama panjang</b>: PA = PB.', 'Garis OP membahagi dua sama ∠APB dan ∠AOB.', 'Teorem Pythagoras sering digunakan: OP^{2} = OA^{2} + PA^{2}.'] },
      { h: 'Sudut dalam tembereng selang-seli', p: 'Sudut di antara tangen dan perentas = sudut di lilitan dalam tembereng yang bertentangan (selang-seli).',
        fig: circ({ P: { A: on(270), B: on(38), C: on(150), T: [262, 206] }, segs: [[[38, 206], 'T'], ['A', 'B'], ['A', 'C'], ['B', 'C']], angs: [['T', 'A', 'B', 'x'], ['A', 'C', 'B', 'x']] }) },
      { h: 'Tip menjawab', li: ['Cari segi tiga sama kaki: dua jejari (OA = OB) bermaksud dua sudut tapak sama.', 'Hasil tambah sudut dalam segi tiga = 180°; sudut pada garis lurus = 180°.'] },
    ],
    soalan: [
      {
        l: 1, q: 'Dalam rajah, A, B, C dan D terletak pada lilitan bulatan. Diberi ∠ACB = 35°. Cari nilai x.',
        fig: circ({ P: { A: on(235), B: on(305), C: on(60), D: on(130) }, segs: [['A', 'C'], ['B', 'C'], ['A', 'D'], ['B', 'D']], angs: [['A', 'C', 'B', '35°', 22], ['A', 'D', 'B', 'x', 22]] }),
        o: ['17.5°', '35°', '70°', '145°'], a: 1,
        f: 'Sudut di lilitan yang dicangkum oleh lengkok yang sama adalah sama',
        s: ['∠ACB dan ∠ADB kedua-duanya dicangkum oleh lengkok AB yang sama.', 'C dan D berada dalam tembereng yang sama.', 'Maka x = ∠ACB = 35°.'],
      },
      {
        l: 1, q: 'Dalam rajah, O ialah pusat bulatan dan ∠AOB = 110°. Cari nilai x.',
        fig: circ({ P: { A: on(215), B: on(325), C: on(90), O: C0 }, lpos: oLbl, segs: [['O', 'A'], ['O', 'B'], ['C', 'A'], ['C', 'B']], dots: ['O'], angs: [['A', 'O', 'B', '110°', 18], ['A', 'C', 'B', 'x', 22]] }),
        o: ['55°', '70°', '110°', '220°'], a: 0,
        f: 'Sudut di pusat = 2 × sudut di lilitan',
        s: ['∠AOB (di pusat) dan ∠ACB (di lilitan) dicangkum oleh lengkok AB yang sama.', '∠AOB = 2 × ∠ACB → 110° = 2x', 'x = 110° ÷ 2 = 55°'],
        tip: 'Sudut di pusat lebih besar (dua kali). Jangan darab 110° dengan 2.',
      },
      {
        l: 1, q: 'Dalam rajah, AB ialah diameter bulatan berpusat O. Diberi ∠CAB = 28°. Cari ∠ABC.',
        fig: circ({ P: { A: on(180), B: on(0), C: on(56), O: C0 }, lpos: { O: [0, 13] }, segs: [['A', 'B'], ['A', 'C'], ['B', 'C']], dots: ['O'], angs: [['C', 'A', 'B', '28°', 30], ['A', 'B', 'C', 'x', 18]] }),
        o: ['28°', '56°', '62°', '90°'], a: 2,
        f: 'Sudut di lilitan yang dicangkum oleh diameter = 90°',
        s: ['AB ialah diameter, jadi ∠ACB = 90°.', 'Dalam segi tiga ABC: ∠CAB + ∠ABC + ∠ACB = 180°.', '28° + x + 90° = 180°', 'x = 180° − 118° = 62°'],
      },
      {
        l: 1, q: 'PQRS ialah sisi empat kitaran. Diberi ∠PQR = 102°. Cari ∠PSR.',
        fig: circ({ P: { P: on(168), Q: on(90), R: on(12), S: on(270) }, polys: [['P', 'Q', 'R', 'S']], angs: [['P', 'Q', 'R', '102°', 18], ['P', 'S', 'R', 'y', 22]] }),
        o: ['51°', '78°', '102°', '258°'], a: 1,
        f: 'Sudut bertentangan dalam sisi empat kitaran: jumlah 180°',
        s: ['Q dan S ialah bucu yang bertentangan.', '∠PQR + ∠PSR = 180°', '102° + y = 180°', 'y = 78°'],
      },
      {
        l: 2, q: 'ABCD ialah sisi empat kitaran. Sisi DC dipanjangkan ke E. Diberi ∠BCE = 85°. Cari ∠BAD.',
        fig: circ({ P: { A: on(140), B: on(45), C: on(320), D: on(235), E: D.ext(on(235), on(320), 1.45) }, polys: [['A', 'B', 'C', 'D']], segs: [['C', 'E']], angs: [['B', 'C', 'E', '85°', 18], ['B', 'A', 'D', 'x', 22]] }),
        o: ['42.5°', '85°', '95°', '170°'], a: 1,
        f: 'Sudut peluaran sisi empat kitaran = sudut pedalaman yang bertentangan',
        s: ['∠BCE ialah sudut peluaran di bucu C.', 'Sudut pedalaman yang bertentangan dengan C ialah sudut di A, iaitu ∠BAD.', 'Maka ∠BAD = ∠BCE = 85°.', 'Semakan: ∠BCD = 180° − 85° = 95°, dan ∠BAD + ∠BCD = 85° + 95° = 180° ✓'],
      },
      {
        l: 1, q: 'Dalam rajah, PT ialah tangen kepada bulatan berpusat O pada titik T. Berapakah ∠OTP?',
        fig: circ({ P: { O: C0, T: on(270), P: [262, 206] }, lpos: oLbl, segs: [[[38, 206], 'P'], ['O', 'T']], dots: ['O'], angs: [['O', 'T', 'P', '?', 16]] }),
        o: ['45°', '60°', '90°', '180°'], a: 2,
        f: 'Tangen berserenjang dengan jejari pada titik ketangenan',
        s: ['OT ialah jejari yang bertemu tangen PT di titik ketangenan T.', 'Tangen sentiasa berserenjang dengan jejari pada titik itu.', '∠OTP = 90°'],
      },
      {
        l: 2, q: 'PA dan PB ialah tangen kepada bulatan berpusat O. Diberi ∠APB = 50°. Cari ∠AOB.',
        fig: (() => {
          const O = [110, 118], r = 60, A = D.onC(110, 118, r, 65), B = D.onC(110, 118, r, -65), P = [252, 118];
          return D.scene({ w: 290, h: 236, center: [170, 118], P: { O, A, B, P }, lpos: oLbl, circles: [{ c: O, r }], segs: [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B']], dots: ['O'], rights: [['O', 'A', 'P'], ['O', 'B', 'P']], angs: [['A', 'P', 'B', '50°', 24], ['A', 'O', 'B', 'x', 16]] });
        })(),
        o: ['50°', '65°', '100°', '130°'], a: 3,
        f: 'Tangen ⟂ jejari; hasil tambah sudut sisi empat = 360°',
        s: ['OAPB ialah sisi empat dengan ∠OAP = 90° dan ∠OBP = 90° (tangen ⟂ jejari).', 'Hasil tambah sudut dalam sisi empat = 360°.', 'x + 90° + 50° + 90° = 360°', 'x = 360° − 230° = 130°'],
      },
      {
        l: 2, q: 'Dalam rajah, PA ialah tangen kepada bulatan berpusat O. Diberi OA = 5 cm dan PA = 12 cm. Hitung panjang OP.',
        fig: (() => {
          const O = [80, 118], A = D.onC(80, 118, 50, 67.38), P = [210, 118];
          return D.scene({ w: 260, h: 200, center: [130, 100], P: { O, A, P }, lpos: oLbl, circles: [{ c: O, r: 50 }], segs: [['O', 'A'], ['A', 'P'], ['O', 'P']], dots: ['O'], rights: [['O', 'A', 'P']], sides: [['O', 'A', '5 cm'], ['A', 'P', '12 cm'], ['O', 'P', '?']] });
        })(),
        o: ['7 cm', '11 cm', '13 cm', '17 cm'], a: 2,
        f: 'Tangen ⟂ jejari → guna teorem Pythagoras: OP^{2} = OA^{2} + PA^{2}',
        s: ['∠OAP = 90° kerana tangen berserenjang dengan jejari.', 'OP ialah hipotenus segi tiga OAP.', 'OP^{2} = 5^{2} + 12^{2} = 25 + 144 = 169', 'OP = ~r{169} = 13 cm'],
      },
      {
        l: 2, q: 'Dalam rajah, ST ialah tangen kepada bulatan pada titik A. Diberi ∠TAB = 64°. Cari ∠ACB.',
        fig: circ({ P: { A: on(270), B: on(38), C: on(150), S: [38, 206], T: [262, 206] }, segs: [['S', 'T'], ['A', 'B'], ['A', 'C'], ['B', 'C']], angs: [['T', 'A', 'B', '64°', 24], ['A', 'C', 'B', 'x', 22]] }),
        o: ['26°', '32°', '64°', '116°'], a: 2,
        f: 'Sudut dalam tembereng selang-seli: sudut antara tangen dan perentas = sudut di lilitan dalam tembereng bertentangan',
        s: ['∠TAB ialah sudut di antara tangen ST dan perentas AB.', 'C berada dalam tembereng yang bertentangan (selang-seli) dengan sudut itu.', 'Maka ∠ACB = ∠TAB = 64°.'],
      },
      {
        l: 2, q: 'Dalam rajah, O ialah pusat bulatan dan ∠OAB = 25°. Cari ∠ACB.',
        fig: circ({ P: { A: on(205), B: on(335), C: on(90), O: C0 }, lpos: { O: [0, -13] }, segs: [['O', 'A'], ['O', 'B'], ['A', 'B'], ['C', 'A'], ['C', 'B']], dots: ['O'], angs: [['O', 'A', 'B', '25°', 30], ['A', 'C', 'B', 'x', 22]] }),
        o: ['25°', '50°', '65°', '130°'], a: 2,
        f: 'OA = OB (jejari) → segi tiga sama kaki; sudut di pusat = 2 × sudut di lilitan',
        s: ['OA = OB kerana kedua-duanya jejari, jadi segi tiga OAB sama kaki: ∠OBA = ∠OAB = 25°.', '∠AOB = 180° − 25° − 25° = 130°.', '∠ACB = ~f{1}{2} × ∠AOB = ~f{1}{2} × 130° = 65°.'],
        tip: 'Langkah pertama yang selalu dilupakan: dua jejari membentuk segi tiga sama kaki.',
      },
      {
        l: 3, q: 'Dalam sisi empat kitaran PQRS, ∠QPS = (2x + 10)° dan ∠QRS = (3x − 5)°. Cari nilai x.',
        o: ['15', '17', '35', '36'], a: 2,
        f: 'Sudut bertentangan dalam sisi empat kitaran: jumlah 180°',
        s: ['∠QPS (di P) dan ∠QRS (di R) ialah sudut bertentangan.', '(2x + 10) + (3x − 5) = 180', '5x + 5 = 180', '5x = 175 → x = 35', 'Semakan: ∠P = 80°, ∠R = 100°, jumlah = 180° ✓'],
        tip: 'x = 15 terhasil jika kedua-dua sudut disamakan. Sudut bertentangan bukan sama, tetapi berjumlah 180°.',
      },
      {
        l: 3, q: 'PA dan PB ialah tangen kepada bulatan pada A dan B. C terletak pada lilitan. Diberi ∠APB = 40°. Cari ∠ACB.',
        fig: (() => {
          const O = [105, 118], r = 55, A = D.onC(105, 118, r, 70), B = D.onC(105, 118, r, -70), Cc = D.onC(105, 118, r, 180), P = [266, 118];
          return D.scene({ w: 300, h: 236, center: [150, 118], P: { A, B, C: Cc, P }, circles: [{ c: O, r }], segs: [['P', 'A'], ['P', 'B'], ['A', 'B'], ['C', 'A'], ['C', 'B']], angs: [['A', 'P', 'B', '40°', 26], ['A', 'C', 'B', 'x', 18]] });
        })(),
        o: ['40°', '70°', '110°', '140°'], a: 1,
        f: 'PA = PB (tangen dari titik luar); sudut dalam tembereng selang-seli',
        s: ['PA = PB, jadi segi tiga PAB sama kaki.', '∠PAB = ∠PBA = (180° − 40°) ÷ 2 = 70°.', '∠PAB ialah sudut di antara tangen PA dan perentas AB.', 'Ikut sudut dalam tembereng selang-seli: ∠ACB = ∠PAB = 70°.'],
      },
      {
        l: 3, q: 'Dalam rajah, AC ialah diameter bulatan berpusat O. Diberi ∠BAC = 35°. Cari ∠ADB.',
        fig: circ({ P: { A: on(180), C: on(0), B: on(70), D: on(250), O: C0 }, lpos: { O: [6, -12] }, segs: [['A', 'C'], ['A', 'B'], ['B', 'C'], ['A', 'D'], ['D', 'B']], dots: ['O'], angs: [['B', 'A', 'C', '35°', 34], ['A', 'D', 'B', 'x', 22]] }),
        o: ['35°', '55°', '90°', '145°'], a: 1,
        f: 'Sudut dicangkum diameter = 90°; sudut dalam tembereng sama adalah sama',
        s: ['AC diameter, jadi ∠ABC = 90°.', 'Dalam segi tiga ABC: ∠ACB = 180° − 90° − 35° = 55°.', '∠ADB dan ∠ACB dicangkum oleh lengkok AB yang sama.', 'Maka ∠ADB = ∠ACB = 55°.'],
      },
    ],
  });
})();
