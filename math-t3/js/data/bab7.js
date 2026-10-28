(() => {
  const S1 = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [0, 0, 1]];
  const S2 = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 1, 0]];
  const S3 = [[0, 0, 0], [0, 1, 0], [0, 2, 0], [1, 0, 0], [1, 0, 1], [0, 2, 1]];
  const S4 = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [0, 1, 0], [1, 1, 0], [2, 1, 0], [0, 1, 1], [2, 1, 1], [2, 0, 1]];
  const view = (c, w) => D.view(D.viewCells(c, w));

  /* Lakaran ringkas untuk pilihan berbentuk rajah */
  const sk = (inner, w = 120, h = 90) => D.svg(w, h, inner, 'view');
  const pyrPlan = [
    sk('<rect class="vf" x="20" y="10" width="70" height="70"/><path class="ve" d="M20 10h70v70H20zM20 10l70 70M90 10L20 80"/>', 110),
    sk('<path class="ve" d="M55 10L90 80H20z" fill="none"/>', 110),
    sk('<rect class="vf" x="20" y="10" width="70" height="70"/><path class="ve" d="M20 10h70v70H20z"/>', 110),
    sk('<rect class="vf" x="20" y="10" width="70" height="70"/><path class="ve" d="M20 10h70v70H20zM55 10v70M20 45h70"/>', 110),
  ];
  const prismIso = (() => {
    const s = 40, c = s * Math.cos(Math.PI / 6), h = s / 2;
    const pr = (x, y, z) => [(x + y) * c + 50, (x - y) * h - z * s + 105];
    const pts = (...a) => a.map((p) => pr(...p).map((v) => v.toFixed(1)).join(',')).join(' ');
    const F = [[0, 0, 0], [2, 0, 0], [1, 0, 1.5]], B = F.map(([x, , z]) => [x, 2.5, z]);
    const a0 = pr(1, -1.7, 0.5), a1 = pr(1, -0.35, 0.5);
    return D.svg(250, 170, `<polygon class="cs" points="${pts(F[1], B[1], B[2], F[2])}"/><polygon class="cf" points="${pts(...F)}"/>`
      + `<line class="arw" x1="${a0[0]}" y1="${a0[1]}" x2="${a1[0]}" y2="${a1[1]}"/><circle class="arwh" cx="${a1[0]}" cy="${a1[1]}" r="4"/><text class="al" x="${a0[0]}" y="${a0[1] + 13}">Depan</text>`, 'iso');
  })();
  const prismOpts = [
    sk('<rect class="vf" x="20" y="10" width="70" height="70"/><path class="ve" d="M20 10h70v70H20zM55 10v70"/>', 110),
    sk('<path class="ve" d="M55 10L90 80H20z" fill="none"/>', 110),
    sk('<rect class="vf" x="20" y="10" width="70" height="70"/><path class="ve" d="M20 10h70v70H20z"/>', 110),
    sk('<rect class="vf" x="20" y="10" width="70" height="70"/><path class="ve" d="M20 10h70v70H20zM20 45h70"/>', 110),
  ];

  BANK.push({
    id: 'b7', no: 7, warna: 7, tajuk: 'Pelan dan Dongakan',
    ikon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M16 4l11 6v12l-11 6-11-6V10z"/><path d="M5 10l11 6 11-6M16 16v12"/></svg>',
    nota: [
      { h: 'Unjuran ortogon', p: 'Imej dua dimensi bagi objek tiga dimensi apabila garis unjuran <b>berserenjang</b> dengan satah. Ukuran pada unjuran ortogon sama dengan ukuran sebenar objek (skala 1 : 1).' },
      { h: 'Pelan dan dongakan', li: ['<b>Pelan</b>: pandangan dari <b>atas</b>, diunjurkan pada satah mengufuk. Tepi depan objek dilukis di bahagian bawah pelan.', '<b>Dongakan depan</b>: pandangan dari <b>depan</b>, diunjurkan pada satah mencancang.', '<b>Dongakan sisi</b>: pandangan dari <b>sisi</b> (kiri atau kanan), juga pada satah mencancang.'] },
      { h: 'Peraturan melukis', li: ['Garis penuh: sisi yang kelihatan.', 'Garis putus-putus: sisi yang tersembunyi (tidak kelihatan dari arah pandangan).', 'Garis dilukis apabila ada perubahan tinggi atau kedalaman permukaan, iaitu wujud tepi atau bucu sebenar.'] },
      { h: 'Contoh bentuk asas', li: ['Silinder tegak: pelan = bulatan, dongakan = segi empat tepat.', 'Kon tegak: pelan = bulatan dengan titik di pusat, dongakan = segi tiga sama kaki.', 'Piramid tegak bertapak segi empat sama: pelan = segi empat sama dengan dua pepenjuru, dongakan = segi tiga.', 'Sfera: pelan dan dongakan = bulatan.'] },
      { h: 'Cara membaca susunan kubus', p: 'Bayangkan diri kamu melihat objek dari arah yang ditanya. Kira bilangan lajur (kiri ke kanan) dan baris (bawah ke atas) yang kelihatan. Lukis garis di antara dua petak jika satu permukaan lebih dekat atau lebih tinggi daripada yang lain.', fig: D.iso(S1) },
    ],
    soalan: [
      {
        l: 1, q: 'Pelan bagi suatu objek ialah pandangan objek itu dari arah ...',
        o: ['atas', 'depan', 'sisi', 'bawah'], a: 0,
        f: 'Pelan = pandangan dari atas (satah mengufuk)',
        s: ['Pelan diunjurkan pada satah mengufuk, iaitu dilihat dari atas.', 'Pandangan dari depan ialah dongakan depan; dari sisi ialah dongakan sisi.'],
      },
      {
        l: 1, q: 'Dalam lukisan unjuran ortogon, sisi objek yang tersembunyi dilukis dengan ...',
        o: ['garis putus-putus', 'garis tebal', 'garis berwarna', 'tidak dilukis langsung'], a: 0,
        f: 'Garis penuh = kelihatan; garis putus-putus = tersembunyi',
        s: ['Sisi yang kelihatan dari arah pandangan dilukis dengan garis penuh.', 'Sisi yang wujud tetapi terlindung dilukis dengan garis putus-putus supaya pembaca tahu ia ada.'],
      },
      {
        l: 1, q: 'Satah unjuran yang digunakan untuk melukis dongakan depan ialah satah ...',
        o: ['mengufuk', 'mencancang', 'condong'], a: 1,
        f: 'Pelan → satah mengufuk; dongakan → satah mencancang',
        s: ['Dongakan dilihat dari depan atau sisi, jadi imejnya jatuh pada satah tegak, iaitu satah mencancang.', 'Satah mengufuk (rata seperti lantai) digunakan untuk pelan.'],
      },
      {
        l: 1, q: 'Apakah bentuk pelan bagi sebuah silinder yang berdiri tegak di atas meja?',
        o: ['Bulatan', 'Segi empat tepat', 'Segi tiga', 'Semibulatan'], a: 0,
        f: 'Pelan = pandangan dari atas',
        s: ['Dari atas, kita hanya nampak permukaan atas silinder.', 'Permukaan atas silinder ialah bulatan.', 'Segi empat tepat ialah dongakan (pandangan dari depan atau sisi).'],
      },
      {
        l: 1, q: 'Apakah bentuk dongakan depan bagi sebuah kon tegak?',
        o: ['Segi tiga sama kaki', 'Bulatan', 'Bulatan dengan titik di tengah', 'Segi empat tepat'], a: 0,
        f: 'Dongakan depan = pandangan dari depan',
        s: ['Dari depan, kon kelihatan lebar di tapak dan tirus ke puncak.', 'Bentuknya ialah segi tiga sama kaki.', 'Bulatan dengan titik di tengah ialah pelan kon (dilihat dari atas, puncak berada di tengah).'],
      },
      {
        l: 2, q: 'Rajah manakah ialah pelan bagi piramid tegak bertapak segi empat sama?',
        o: pyrPlan, a: 0,
        f: 'Pelan = pandangan dari atas; tepi condong dari puncak ke bucu tapak kelihatan',
        s: ['Dari atas, tapak segi empat sama kelihatan sebagai bingkai luar.', 'Puncak piramid berada tepat di atas pusat tapak.', 'Empat tepi condong dari puncak ke empat bucu kelihatan sebagai dua pepenjuru.', 'Jadi pelan ialah segi empat sama dengan dua pepenjuru bersilang di tengah.'],
        tip: 'Segi tiga ialah dongakan piramid, bukan pelan.',
      },
      {
        l: 2, q: 'Rajah menunjukkan sebuah objek yang dibina daripada kubus yang sama saiz. Pilih <b>pelan</b> bagi objek itu.',
        fig: D.iso(S1),
        o: D.viewOpts(S1, 'plan'), a: 0,
        f: 'Pelan = pandangan dari atas; tepi depan di bahagian bawah lukisan',
        s: ['Pandang dari atas. Baris depan (dekat anak panah) ada 3 kubus; baris belakang ada 1 kubus di sebelah kiri.', 'Kubus kiri hadapan bertingkat dua, jadi permukaan atasnya lebih tinggi daripada jirannya.', 'Garis dilukis di antara permukaan yang berlainan tinggi: di kanan petak kiri hadapan dan di atasnya.', 'Pelan yang betul:', view(S1, 'plan')],
      },
      {
        l: 2, q: 'Rajah menunjukkan sebuah objek yang dibina daripada kubus yang sama saiz. Pilih <b>dongakan depan</b> bagi objek itu.',
        fig: D.iso(S2),
        o: D.viewOpts(S2, 'front'), a: 0,
        f: 'Dongakan depan = pandangan dari arah anak panah "Depan"',
        s: ['Pandang dari depan. Dari kiri ke kanan ada 3 lajur.', 'Lajur kiri: 1 kubus. Lajur tengah: 2 kubus (atas yang di belakang). Lajur kanan: 1 kubus (di belakang).', 'Kubus yang lebih jauh ke belakang membentuk tepi baharu, jadi garis dilukis di antara permukaan depan dan belakang.', 'Dongakan depan yang betul:', view(S2, 'front')],
      },
      {
        l: 2, q: 'Rajah menunjukkan sebuah objek yang dibina daripada kubus yang sama saiz. Pilih <b>dongakan sisi</b> bagi objek itu apabila dilihat dari arah anak panah "Sisi".',
        fig: D.iso(S3, { side: true }),
        o: D.viewOpts(S3, 'side'), a: 0,
        f: 'Dongakan sisi = pandangan dari kanan; bahagian depan objek berada di sebelah kiri lukisan',
        s: ['Berdiri di sebelah kanan objek dan pandang ke kiri. Bahagian depan objek kini berada di sebelah kiri kamu.', 'Dari kiri ke kanan (depan ke belakang): lajur 2 tingkat, lajur 1 tingkat, lajur 2 tingkat.', 'Lajur paling kiri (bahagian depan objek) lebih dekat dengan kamu berbanding lajur tengah, jadi ada garis di antara keduanya.', 'Dongakan sisi yang betul:', view(S3, 'side')],
        tip: 'Untuk dongakan sisi kanan, depan objek berada di kiri lukisan. Ramai pelajar terbalikkan arah ini.',
      },
      {
        l: 2, q: 'Sebuah kuboid berukuran 6 cm panjang, 4 cm lebar dan 3 cm tinggi. Muka 6 cm × 3 cm menghadap ke depan. Apakah ukuran dongakan sisinya?',
        o: ['4 cm × 3 cm', '6 cm × 3 cm', '6 cm × 4 cm', '3 cm × 3 cm'], a: 0,
        f: 'Unjuran ortogon menggunakan ukuran sebenar',
        s: ['Depan: panjang 6 cm × tinggi 3 cm.', 'Dari sisi, kita nampak <b>lebar</b> kuboid (4 cm) dan tingginya (3 cm).', 'Dongakan sisi = 4 cm × 3 cm.', 'Untuk rujukan: pelan = 6 cm × 4 cm.'],
      },
      {
        l: 2, q: 'Rajah menunjukkan sebuah prisma tegak dengan keratan rentas segi tiga menghadap ke depan (seperti bumbung). Pilih <b>pelan</b> prisma itu.',
        fig: prismIso,
        o: prismOpts, a: 0,
        f: 'Pelan = pandangan dari atas; rabung bumbung kelihatan sebagai garis',
        s: ['Dari atas, kita nampak dua muka condong bumbung, jadi bentuk luarnya segi empat tepat.', 'Rabung (garis puncak) berjalan dari depan ke belakang, betul-betul di tengah.', 'Dalam pelan, depan berada di bawah, jadi garis rabung dilukis menegak di tengah.'],
        tip: 'Segi tiga ialah dongakan depan prisma ini, bukan pelan.',
      },
      {
        l: 3, q: 'Rajah menunjukkan sebuah objek yang dibina daripada kubus yang sama saiz. Pilih <b>pelan</b> bagi objek itu.',
        fig: D.iso(S4),
        o: D.viewOpts(S4, 'plan'), a: 0,
        f: 'Pelan: lukis garis di antara permukaan atas yang berlainan tinggi',
        s: ['Dari atas, tapak ialah 3 lajur × 2 baris.', 'Tinggi setiap lajur: baris depan → 1, 1, 2; baris belakang → 2, 1, 2.', 'Garis dilukis di sempadan antara petak tinggi 2 dan tinggi 1.', 'Pelan yang betul:', view(S4, 'plan')],
      },
      {
        l: 2, q: 'Sebuah pepejal mempunyai pelan berbentuk bulatan dan dongakan depan berbentuk segi empat tepat. Apakah pepejal itu?',
        o: ['Silinder', 'Kon', 'Sfera', 'Piramid'], a: 0,
        f: 'Padankan pelan dan dongakan dengan bentuk pepejal',
        s: ['Pelan bulatan → pepejal itu bulat apabila dilihat dari atas: silinder, kon atau sfera.', 'Dongakan segi empat tepat → sisinya lurus dan menegak.', 'Kon memberi dongakan segi tiga; sfera memberi bulatan.', 'Jadi pepejal itu silinder.'],
      },
    ],
  });
})();
