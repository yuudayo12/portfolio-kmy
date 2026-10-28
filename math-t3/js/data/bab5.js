(() => {
  /* Segi tiga bersudut tegak: sudut tegak di bucu kedua, sudut θ di bucu pertama. */
  const tri = (o) => {
    const k = o.k, [a, b, c] = o.n;
    const P = { [a]: [36, o.opp * k + 26], [b]: [36 + o.adj * k, o.opp * k + 26], [c]: [36 + o.adj * k, 26] };
    return D.scene({
      w: o.adj * k + 84 + (o.wx || 0), h: o.opp * k + 56, P, polys: [[a, b, c]], rights: [[a, b, c]],
      angs: o.ang ? [[b, a, c, o.ang, 30]] : [], sides: o.sides || [],
    });
  };

  BANK.push({
    id: 'b5', no: 5, warna: 5, tajuk: 'Nisbah Trigonometri',
    ikon: 'sin',
    nota: [
      {
        h: 'Sisi segi tiga bersudut tegak', p: 'Nama sisi bergantung pada sudut θ yang sedang dilihat.',
        li: ['<b>Hipotenus</b>: sisi terpanjang, bertentangan dengan sudut tegak.', '<b>Sisi bertentangan</b>: sisi di depan sudut θ (tidak menyentuh θ).', '<b>Sisi bersebelahan</b>: sisi yang menyentuh θ, selain hipotenus.'],
        fig: tri({ n: ['A', 'B', 'C'], adj: 4, opp: 3, k: 40, wx: 80, ang: 'θ', sides: [['A', 'B', 'bersebelahan'], ['B', 'C', 'bertentangan'], ['A', 'C', 'hipotenus']] }),
      },
      { h: 'Tiga nisbah trigonometri', f: ['sin θ = ~f{sisi bertentangan}{hipotenus}', 'kos θ = ~f{sisi bersebelahan}{hipotenus}', 'tan θ = ~f{sisi bertentangan}{sisi bersebelahan} = ~f{sin θ}{kos θ}'], p: 'Cara ingat: <b>T-H, S-H, T-S</b> (Tentang/Hipotenus, Sebelah/Hipotenus, Tentang/Sebelah) atau dalam bahasa Inggeris SOH-CAH-TOA.' },
      { h: 'Nilai sudut khas', f: ['sin 30° = ~f{1}{2},  kos 30° = ~f{~r{3}}{2},  tan 30° = ~f{1}{~r{3}}', 'sin 45° = ~f{1}{~r{2}},  kos 45° = ~f{1}{~r{2}},  tan 45° = 1', 'sin 60° = ~f{~r{3}}{2},  kos 60° = ~f{1}{2},  tan 60° = ~r{3}'] },
      { h: 'Perubahan nilai', li: ['Apabila θ bertambah dari 0° ke 90°: sin θ bertambah (0 → 1), kos θ berkurang (1 → 0), tan θ bertambah tanpa had.', 'Nilai sin dan kos sentiasa di antara 0 dan 1 untuk sudut tirus.'] },
      { h: 'Mencari sisi atau sudut', li: ['Cari sisi: pilih nisbah yang mengandungi sisi diketahui dan sisi dicari. Contoh: hipotenus diberi, cari sisi bertentangan → guna sin.', 'Cari sudut: kira nisbah, kemudian guna sin^{−1}, kos^{−1} atau tan^{−1} pada kalkulator (pastikan mod DEG).'], ex: 'tan θ = 0.24 → θ = tan^{−1} 0.24 = 13.50°' },
    ],
    soalan: [
      {
        l: 1, q: 'Rajah menunjukkan segi tiga ABC bersudut tegak di B. Merujuk kepada sudut θ, nyatakan hipotenus dan sisi bertentangan.',
        fig: tri({ n: ['A', 'B', 'C'], adj: 4, opp: 3, k: 42, ang: 'θ' }),
        o: ['Hipotenus AC, bertentangan BC', 'Hipotenus AC, bertentangan AB', 'Hipotenus BC, bertentangan AB', 'Hipotenus AB, bertentangan BC'], a: 0,
        f: 'Hipotenus bertentangan dengan sudut tegak; sisi bertentangan berada di depan θ',
        s: ['Sudut tegak di B. Sisi di depan B ialah AC, jadi <b>hipotenus = AC</b>.', 'θ berada di bucu A. Sisi yang tidak menyentuh A ialah BC, jadi <b>sisi bertentangan = BC</b>.', 'AB menyentuh A dan bukan hipotenus, jadi AB ialah sisi bersebelahan.'],
      },
      {
        l: 1, q: 'Berdasarkan rajah, cari nilai sin θ.',
        fig: tri({ n: ['A', 'B', 'C'], adj: 4, opp: 3, k: 42, ang: 'θ', sides: [['A', 'B', '4 cm'], ['B', 'C', '3 cm'], ['A', 'C', '5 cm']] }),
        o: ['~f{3}{5}', '~f{4}{5}', '~f{3}{4}', '~f{5}{3}'], a: 0,
        f: 'sin θ = ~f{bertentangan}{hipotenus}',
        s: ['Dari θ: sisi bertentangan = BC = 3 cm, hipotenus = AC = 5 cm.', 'sin θ = ~f{3}{5}'],
        tip: '~f{4}{5} ialah kos θ dan ~f{3}{4} ialah tan θ.',
      },
      {
        l: 1, q: 'Rajah menunjukkan segi tiga PQR bersudut tegak di Q. Cari nilai kos x.',
        fig: tri({ n: ['P', 'Q', 'R'], adj: 12, opp: 5, k: 17, ang: 'x', sides: [['P', 'Q', '12 cm'], ['Q', 'R', '5 cm'], ['P', 'R', '13 cm']] }),
        o: ['~f{5}{13}', '~f{12}{13}', '~f{5}{12}', '~f{13}{12}'], a: 1,
        f: 'kos x = ~f{bersebelahan}{hipotenus}',
        s: ['Sudut x di P. Sisi bersebelahan (menyentuh P, bukan hipotenus) = PQ = 12 cm.', 'Hipotenus = PR = 13 cm.', 'kos x = ~f{12}{13}'],
      },
      {
        l: 1, q: 'Hitung nilai sin 30° + kos 60°.',
        o: ['~f{1}{2}', '1', '~f{~r{3}}{2}', '~r{3}'], a: 1,
        f: 'sin 30° = ~f{1}{2},  kos 60° = ~f{1}{2}',
        s: ['Ingat nilai sudut khas: sin 30° = ~f{1}{2} dan kos 60° = ~f{1}{2}.', 'sin 30° + kos 60° = ~f{1}{2} + ~f{1}{2} = 1'],
        tip: 'Perhatikan: sin 30° = kos 60°. Secara umum, sin θ = kos (90° − θ).',
      },
      {
        l: 2, q: 'Diberi tan θ = 1 dan θ ialah sudut tirus. Cari nilai θ.',
        o: ['30°', '45°', '60°', '90°'], a: 1,
        f: 'tan 45° = 1',
        s: ['tan θ = 1 bermaksud sisi bertentangan = sisi bersebelahan.', 'Segi tiga itu sama kaki, jadi dua sudut tirusnya sama: (180° − 90°) ÷ 2 = 45°.', 'θ = 45°'],
      },
      {
        l: 2, q: 'Dalam rajah, AC = 20 cm dan ∠BAC = 35°. Hitung panjang BC.',
        fig: tri({ n: ['A', 'B', 'C'], adj: 16.38, opp: 11.47, k: 11, ang: '35°', sides: [['A', 'C', '20 cm'], ['B', 'C', 'x']] }),
        o: ['11.47 cm', '14.00 cm', '16.38 cm', '34.87 cm'], a: 0,
        f: 'sin θ = ~f{bertentangan}{hipotenus}',
        s: ['Dari sudut 35°: BC ialah sisi <b>bertentangan</b>, AC ialah <b>hipotenus</b> (diberi).', 'Nisbah yang menghubungkan bertentangan dan hipotenus ialah sin.', 'sin 35° = ~f{BC}{20}', 'BC = 20 × sin 35° = 20 × 0.5736', 'BC = 11.47 cm'],
        tip: '16.38 cm ialah AB (guna kos). Pastikan sisi yang dicari betul-betul bertentangan dengan sudut 35°.',
      },
      {
        l: 2, q: 'Dalam rajah, PQ = 8 cm dan ∠QPR = 50°. Hitung panjang QR.',
        fig: tri({ n: ['P', 'Q', 'R'], adj: 8, opp: 9.53, k: 17, ang: '50°', sides: [['P', 'Q', '8 cm'], ['Q', 'R', 'y']] }),
        o: ['6.13 cm', '6.71 cm', '9.53 cm', '12.45 cm'], a: 2,
        f: 'tan θ = ~f{bertentangan}{bersebelahan}',
        s: ['Dari sudut 50°: QR ialah sisi bertentangan, PQ ialah sisi bersebelahan.', 'Nisbah yang menghubungkan bertentangan dan bersebelahan ialah tan.', 'tan 50° = ~f{QR}{8}', 'QR = 8 × tan 50° = 8 × 1.1918', 'QR = 9.53 cm'],
      },
      {
        l: 2, q: 'Dalam rajah, KM = 14 cm dan LM = 7 cm. Cari ∠MKL.',
        fig: tri({ n: ['K', 'L', 'M'], adj: 12.12, opp: 7, k: 13, ang: 'θ', sides: [['K', 'M', '14 cm'], ['L', 'M', '7 cm']] }),
        o: ['26.57°', '30°', '45°', '60°'], a: 1,
        f: 'sin θ = ~f{bertentangan}{hipotenus}',
        s: ['Dari θ di K: LM bertentangan (7 cm), KM hipotenus (14 cm).', 'sin θ = ~f{7}{14} = ~f{1}{2} = 0.5', 'Nilai sudut khas: sin 30° = 0.5.', 'θ = 30°'],
        tip: '26.57° terhasil jika guna tan (7 ÷ 14). Tetapi 14 cm ialah hipotenus, bukan sisi bersebelahan.',
      },
      {
        l: 2, q: 'Diberi sin θ = 0.6 dengan θ sudut tirus. Cari nilai kos θ.',
        o: ['0.4', '0.75', '0.8', '1.33'], a: 2,
        f: 'Lukis segi tiga, guna teorem Pythagoras',
        s: ['sin θ = 0.6 = ~f{6}{10} = ~f{3}{5}, jadi bertentangan = 3, hipotenus = 5.', 'Cari sisi bersebelahan dengan Pythagoras: ~r{5^{2} − 3^{2}} = ~r{25 − 9} = ~r{16} = 4.', 'kos θ = ~f{bersebelahan}{hipotenus} = ~f{4}{5} = 0.8'],
        tip: 'kos θ bukan 1 − sin θ (0.4). Guna segi tiga dan Pythagoras.',
      },
      {
        l: 3, q: 'Sebatang tangga sepanjang 6 m disandarkan pada dinding tegak. Tangga itu membentuk sudut 65° dengan lantai mengufuk. Berapakah tinggi titik sentuhan tangga pada dinding dari lantai?',
        fig: D.scene({ w: 240, h: 210, P: { Lantai: [40, 185], Dinding: [150, 185], Atas: [150, 22] }, labels: [], segs: [[[20, 185], [210, 185]], [[150, 185], [150, 10], 'br'], ['Lantai', 'Atas']], rights: [['Lantai', 'Dinding', 'Atas']], angs: [['Dinding', 'Lantai', 'Atas', '65°', 28]], sides: [['Lantai', 'Atas', '6 m'], ['Dinding', 'Atas', 'h', true]], texts: [[192, 100, 'dinding']] }),
        o: ['2.54 m', '5.44 m', '6.62 m', '12.87 m'], a: 1,
        f: 'sin θ = ~f{bertentangan}{hipotenus}',
        s: ['Tangga ialah hipotenus = 6 m. Tinggi h bertentangan dengan sudut 65°.', 'sin 65° = ~f{h}{6}', 'h = 6 × sin 65° = 6 × 0.9063', 'h = 5.44 m'],
        tip: '2.54 m ialah jarak kaki tangga dari dinding (guna kos).',
      },
      {
        l: 3, q: 'Sebuah tanjakan kerusi roda naik setinggi 1.2 m sepanjang jarak mengufuk 5 m. Hitung sudut kecondongan tanjakan dengan lantai.',
        o: ['0.24°', '13.50°', '13.89°', '76.50°'], a: 1,
        f: 'tan θ = ~f{bertentangan}{bersebelahan}',
        s: ['Tinggi 1.2 m bertentangan dengan sudut. Jarak mengufuk 5 m bersebelahan.', 'tan θ = ~f{1.2}{5} = 0.24', 'θ = tan^{−1} 0.24', 'θ = 13.50° (atau 13° 30′)'],
        tip: '13.89° ialah jika guna sin. Jarak mengufuk bukan hipotenus.',
      },
      {
        l: 3, q: 'Dalam rajah, PQR ialah segi tiga bersudut tegak di Q dan S terletak pada QR. Diberi PQ = 8 cm, QR = 15 cm dan tan ∠PSQ = ~f{4}{3}. Hitung panjang SR.',
        fig: D.scene({ w: 330, h: 200, P: { P: [40, 34], Q: [40, 170], S: [136, 170], R: [280, 170] }, polys: [['P', 'Q', 'R']], segs: [['P', 'S']], rights: [['P', 'Q', 'S']], angs: [['P', 'S', 'Q', '', 18]], sides: [['P', 'Q', '8 cm']], texts: [[212, 190, '15 cm']] }),
        o: ['6 cm', '7 cm', '9 cm', '10 cm'], a: 2,
        f: 'tan θ = ~f{bertentangan}{bersebelahan}',
        s: ['Lihat segi tiga PQS. Dari sudut di S: PQ bertentangan, SQ bersebelahan.', 'tan ∠PSQ = ~f{PQ}{SQ} → ~f{4}{3} = ~f{8}{SQ}', 'SQ = ~f{8 × 3}{4} = 6 cm', 'SR = QR − SQ = 15 − 6 = 9 cm'],
      },
      {
        l: 2, q: 'Diberi kos x = ~f{5}{13} dengan x sudut tirus. Cari nilai tan x.',
        o: ['~f{5}{12}', '~f{12}{5}', '~f{12}{13}', '~f{13}{12}'], a: 1,
        f: 'Pythagoras untuk cari sisi ketiga, kemudian tan x = ~f{bertentangan}{bersebelahan}',
        s: ['kos x = ~f{5}{13} → bersebelahan = 5, hipotenus = 13.', 'Bertentangan = ~r{13^{2} − 5^{2}} = ~r{169 − 25} = ~r{144} = 12.', 'tan x = ~f{12}{5}'],
      },
      {
        l: 1, q: 'Apabila sudut θ bertambah dari 0° hingga 90°, nilai kos θ ...',
        o: ['bertambah', 'berkurang', 'tidak berubah', 'sentiasa sama dengan 1'], a: 1,
        f: 'kos 0° = 1, kos 90° = 0',
        s: ['kos 0° = 1, kos 30° ≈ 0.866, kos 60° = 0.5, kos 90° = 0.', 'Nilai semakin kecil apabila sudut bertambah.', 'Jadi kos θ berkurang.'],
      },
    ],
  });
})();
