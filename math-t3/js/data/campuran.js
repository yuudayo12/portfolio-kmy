(() => {
  const C0 = [150, 118], R = 88;
  const on = (d) => D.onC(C0[0], C0[1], R, d);
  const circ = (o) => D.scene({ w: 300, h: 236, center: C0, ...o, circles: [{ c: C0, r: R }, ...(o.circles || [])] });
  const cross = (p1, p2, p3, p4) => {
    const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  };
  const tri = (o) => {
    const k = o.k, [a, b, c] = o.n;
    const P = { [a]: [36, o.opp * k + 26], [b]: [36 + o.adj * k, o.opp * k + 26], [c]: [36 + o.adj * k, 26] };
    return D.scene({ w: o.adj * k + 84, h: o.opp * k + 56, P, polys: [[a, b, c]], rights: [[a, b, c]], angs: [[b, a, c, o.ang, 30]], sides: o.sides });
  };
  const S5 = [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 0], [2, 1, 0], [2, 1, 1]];
  const S6 = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 1, 0], [1, 2, 0]];
  const ikon = '<span style="font-size:15px">1–9</span>';

  BANK.push({
    id: 'c1', no: null, warna: 0, tajuk: 'Ujian Campuran 1', ikon, nota: [],
    soalan: [
      {
        bab: 1, l: 1, q: 'Permudahkan a^{4} × a^{−6} ÷ a^{−3}.',
        o: ['a', 'a^{−5}', 'a^{7}', 'a^{13}'], a: 0,
        f: 'a^{m} × a^{n} = a^{m + n};  a^{m} ÷ a^{n} = a^{m − n}',
        s: ['Gabungkan semua indeks: 4 + (−6) − (−3).', '= 4 − 6 + 3 = 1', 'a^{1} = a'],
        tip: 'Bahagi dengan indeks negatif: − (−3) = + 3.',
      },
      {
        bab: 1, l: 2, q: 'Hitung nilai 8^{−~f{2}{3}}.',
        o: ['~f{1}{4}', '4', '−4', '−~f{1}{4}'], a: 0,
        f: 'a^{−n} = ~f{1}{a^{n}};  a^{~f{m}{n}} = (~rt{n}{a})^{m}',
        s: ['Indeks negatif → salingan: 8^{−~f{2}{3}} = ~f{1}{8^{~f{2}{3}}}.', '8^{~f{2}{3}} = (~rt{3}{8})^{2} = 2^{2} = 4.', 'Jadi 8^{−~f{2}{3}} = ~f{1}{4}.'],
        tip: 'Indeks negatif tidak menghasilkan jawapan negatif.',
      },
      {
        bab: 2, l: 1, q: 'Bundarkan 0.0003049 betul kepada 2 angka bererti.',
        o: ['0.0003', '0.00030', '0.00031', '0.000305'], a: 1,
        f: 'Sifar di hujung nombor perpuluhan adalah bererti',
        s: ['Angka bererti pertama ialah 3, yang kedua ialah 0 (selepas 3).', 'Digit seterusnya ialah 4 (< 5), jadi kekal.', 'Jawapan: 0.00030. Sifar terakhir mesti ditulis kerana ia angka bererti kedua.'],
        tip: '0.0003 hanya ada 1 angka bererti.',
      },
      {
        bab: 2, l: 2, q: 'Hitung (5.2 × 10^{3})^{2}. Beri jawapan dalam bentuk piawai.',
        o: ['2.704 × 10^{7}', '2.704 × 10^{6}', '1.04 × 10^{7}', '2.704 × 10^{9}'], a: 0,
        f: '(A × 10^{m})^{2} = A^{2} × 10^{2m}',
        s: ['Kuasa dua A: 5.2^{2} = 27.04.', 'Kuasa dua 10^{3}: (10^{3})^{2} = 10^{6}.', 'Hasil: 27.04 × 10^{6}. Laraskan A: 27.04 = 2.704 × 10^{1}.', '= 2.704 × 10^{7}'],
      },
      {
        bab: 3, l: 2, q: 'Kamal menyimpan RM2 400 dengan kadar faedah mudah 3.5% setahun selama 18 bulan. Hitung faedah yang diterima.',
        o: ['RM84', 'RM126', 'RM252', 'RM1 512'], a: 1,
        f: 'I = Prt, t dalam tahun',
        s: ['Tukar masa ke tahun: 18 bulan = ~f{18}{12} = 1.5 tahun.', 'I = 2400 × 0.035 × 1.5', '2400 × 0.035 = 84 (faedah setahun); 84 × 1.5 = RM126.'],
        tip: 'RM1 512 terhasil jika t = 18. Masa mesti dalam tahun.',
      },
      {
        bab: 3, l: 2, q: 'Bayaran minimum kad kredit ialah 5% daripada baki tertunggak atau RM50, yang mana lebih tinggi. Baki tertunggak Nadia ialah RM800. Berapakah bayaran minimum?',
        o: ['RM40', 'RM50', 'RM90', 'RM800'], a: 1,
        f: 'Bayaran minimum = nilai lebih tinggi antara 5% baki dan RM50',
        s: ['5% × 800 = RM40.', 'Bandingkan RM40 dengan RM50: RM50 lebih tinggi.', 'Bayaran minimum = RM50.'],
      },
      {
        bab: 4, l: 2, q: 'Sebuah peta dilukis dengan skala 1 : 40 000. Jarak sebenar di antara dua tempat ialah 2.8 km. Berapakah jarak itu pada peta?',
        o: ['0.7 cm', '7 cm', '11.2 cm', '70 cm'], a: 1,
        f: 'Jarak peta = ~f{jarak sebenar}{n} (unit sama)',
        s: ['Tukar ke cm: 2.8 km = 2.8 × 100 000 = 280 000 cm.', 'Jarak peta = 280 000 ÷ 40 000 = 7 cm.'],
      },
      {
        bab: 5, l: 1, q: 'Berdasarkan rajah, cari nilai sin θ.',
        fig: tri({ n: ['A', 'B', 'C'], adj: 15, opp: 8, k: 12, ang: 'θ', sides: [['A', 'B', '15 cm'], ['B', 'C', '8 cm'], ['A', 'C', '17 cm']] }),
        o: ['~f{8}{17}', '~f{15}{17}', '~f{8}{15}', '~f{17}{8}'], a: 0,
        f: 'sin θ = ~f{bertentangan}{hipotenus}',
        s: ['Dari θ di A: sisi bertentangan = BC = 8 cm.', 'Hipotenus = AC = 17 cm.', 'sin θ = ~f{8}{17}'],
      },
      {
        bab: 5, l: 1, q: 'Hitung nilai 2 sin 30° + tan 45°.',
        o: ['1', '1.5', '2', '3'], a: 2,
        f: 'sin 30° = ~f{1}{2};  tan 45° = 1',
        s: ['2 sin 30° = 2 × ~f{1}{2} = 1.', 'tan 45° = 1.', '1 + 1 = 2'],
      },
      {
        bab: 6, l: 2, q: 'Dalam rajah, O ialah pusat bulatan dan ∠ADB = 48°. Cari ∠OAB.',
        fig: circ({ P: { A: on(222), B: on(318), D: on(90), O: C0 }, lpos: { O: [0, -13] }, segs: [['O', 'A'], ['O', 'B'], ['A', 'B'], ['D', 'A'], ['D', 'B']], dots: ['O'], angs: [['A', 'D', 'B', '48°', 22], ['O', 'A', 'B', 'x', 28]] }),
        o: ['42°', '48°', '84°', '96°'], a: 0,
        f: 'Sudut di pusat = 2 × sudut di lilitan; OA = OB',
        s: ['∠AOB = 2 × ∠ADB = 2 × 48° = 96°.', 'OA = OB (jejari), jadi segi tiga OAB sama kaki.', '∠OAB = (180° − 96°) ÷ 2 = 84° ÷ 2 = 42°.'],
      },
      {
        bab: 6, l: 2, q: 'Dalam rajah, PT ialah tangen kepada bulatan berpusat O pada T. Diberi ∠TOP = 58°. Cari ∠OPT.',
        fig: (() => {
          const O = [110, 100], T = [110, 160], P = [206, 160];
          return D.scene({ w: 290, h: 200, center: [140, 120], P: { O, T, P }, lpos: { O: [-12, -6] }, circles: [{ c: O, r: 60 }], segs: [[[40, 160], [262, 160]], ['O', 'T'], ['O', 'P']], dots: ['O'], rights: [['O', 'T', 'P']], angs: [['T', 'O', 'P', '58°', 20], ['O', 'P', 'T', 'x', 30]] });
        })(),
        o: ['32°', '58°', '90°', '122°'], a: 0,
        f: 'Tangen ⟂ jejari; hasil tambah sudut segi tiga = 180°',
        s: ['∠OTP = 90° (tangen berserenjang dengan jejari OT).', 'Dalam segi tiga OTP: x + 58° + 90° = 180°.', 'x = 180° − 148° = 32°.'],
      },
      {
        bab: 7, l: 2, q: 'Rajah menunjukkan sebuah objek yang dibina daripada kubus yang sama saiz. Pilih <b>dongakan depan</b> bagi objek itu.',
        fig: D.iso(S5),
        o: D.viewOpts(S5, 'front'), a: 0,
        f: 'Dongakan depan = pandangan dari arah anak panah "Depan"',
        s: ['Dari depan ada 3 lajur. Lajur kiri: 1 tingkat. Lajur tengah: 2 tingkat. Lajur kanan: 2 tingkat.', 'Tingkat atas lajur kanan terletak di belakang, lebih jauh daripada tingkat atas lajur tengah dan kubus bawahnya.', 'Perbezaan kedalaman ini membentuk garis di antara petak-petak tersebut.', 'Dongakan depan yang betul:', D.view(D.viewCells(S5, 'front'))],
      },
      {
        bab: 8, l: 1, q: 'Sebuah roda bergolek di atas lantai yang rata dan lurus. Lokus pusat roda itu ialah ...',
        o: ['garis lurus selari dengan lantai', 'bulatan', 'lengkok bulatan', 'satu titik tetap'], a: 0,
        f: 'Jarak tetap dari garis lurus → garis selari',
        s: ['Pusat roda sentiasa berada pada jarak yang sama (jejari roda) dari lantai.', 'Jarak tetap dari satu garis lurus (lantai) membentuk garis selari.', 'Hanya garis di atas lantai yang mungkin, jadi lokusnya satu garis lurus selari dengan lantai.'],
      },
      {
        bab: 9, l: 1, q: 'Hitung kecerunan garis lurus yang melalui titik (−2, 5) dan (4, −1).',
        o: ['−1', '1', '−~f{2}{3}', '2'], a: 0,
        f: 'm = ~f{y_{2} − y_{1}}{x_{2} − x_{1}}',
        s: ['m = ~f{−1 − 5}{4 − (−2)}', '= ~f{−6}{6}', '= −1'],
      },
      {
        bab: 9, l: 3, q: 'Sebuah garis lurus mempunyai kecerunan ~f{1}{2} dan pintasan-x 4. Cari persamaan garis itu.',
        o: ['y = ~f{1}{2}x − 2', 'y = ~f{1}{2}x + 4', 'y = ~f{1}{2}x + 2', 'y = 2x − 8'], a: 0,
        f: 'y = mx + c; titik pintasan-x ialah (4, 0)',
        s: ['Pintasan-x 4 bermaksud garis melalui (4, 0).', 'y = ~f{1}{2}x + c. Gantikan (4, 0): 0 = ~f{1}{2}(4) + c = 2 + c.', 'c = −2.', 'Persamaan: y = ~f{1}{2}x − 2.'],
        tip: 'Pintasan-x bukan c. c ialah pintasan-y.',
      },
    ],
  });

  BANK.push({
    id: 'c2', no: null, warna: 0, tajuk: 'Ujian Campuran 2', ikon, nota: [],
    soalan: [
      {
        bab: 1, l: 2, q: 'Hitung nilai ~f{2^{5} × 4^{2}}{8^{2}}.',
        o: ['2', '4', '8', '16'], a: 2,
        f: 'Tukar semua kepada asas 2',
        s: ['4 = 2^{2}, jadi 4^{2} = 2^{4}. 8 = 2^{3}, jadi 8^{2} = 2^{6}.', '~f{2^{5} × 2^{4}}{2^{6}} = 2^{5 + 4 − 6}', '= 2^{3} = 8'],
      },
      {
        bab: 1, l: 2, q: 'Permudahkan (16x^{8})^{~f{1}{2}}.',
        o: ['4x^{4}', '8x^{4}', '4x^{16}', '16x^{4}'], a: 0,
        f: '(ab)^{n} = a^{n}b^{n};  a^{~f{1}{2}} = ~r{a}',
        s: ['16^{~f{1}{2}} = ~r{16} = 4.', '(x^{8})^{~f{1}{2}} = x^{8 × ~f{1}{2}} = x^{4}.', 'Jawapan: 4x^{4}.'],
      },
      {
        bab: 2, l: 2, q: 'Hitung 3.2 × 10^{−5} ÷ (8 × 10^{−2}). Beri jawapan dalam bentuk piawai.',
        o: ['4 × 10^{−4}', '4 × 10^{−3}', '4 × 10^{−7}', '2.5 × 10^{3}'], a: 0,
        f: '(A ÷ B) × 10^{m − n}, kemudian laraskan A',
        s: ['3.2 ÷ 8 = 0.4.', '10^{−5 − (−2)} = 10^{−3}.', 'Hasil 0.4 × 10^{−3}. Laraskan: 0.4 = 4 × 10^{−1}.', '= 4 × 10^{−4}'],
      },
      {
        bab: 2, l: 1, q: 'Nyatakan bilangan angka bererti bagi 7.090.',
        o: ['2', '3', '4', '1'], a: 2,
        f: 'Sifar di antara digit bukan sifar dan sifar hujung nombor perpuluhan adalah bererti',
        s: ['7 → bererti.', '0 di antara 7 dan 9 → bererti.', '9 → bererti.', '0 di hujung selepas titik perpuluhan → bererti.', 'Jumlah: 4 angka bererti.'],
      },
      {
        bab: 3, l: 2, q: 'RM4 000 disimpan dengan kadar faedah 6% setahun yang dikompaun setiap setengah tahun. Hitung nilai matang selepas 2 tahun.',
        o: ['RM4 480.00', 'RM4 494.40', 'RM4 502.04', 'RM502.04'], a: 2,
        f: 'MV = P(1 + ~f{r}{n})^{nt}, setengah tahun → n = 2',
        s: ['~f{r}{n} = ~f{0.06}{2} = 0.03; nt = 2 × 2 = 4.', 'MV = 4000(1.03)^{4}', '(1.03)^{4} = 1.12551', 'MV = 4000 × 1.12551 = RM4 502.04'],
        tip: 'RM4 494.40 ialah jika dikompaun setiap tahun; RM4 480 ialah faedah mudah.',
      },
      {
        bab: 3, l: 3, q: 'Encik Sam membeli kereta dengan pinjaman RM60 000. Kadar faedah rata ialah 3% setahun selama 9 tahun. Hitung bayaran ansuran bulanan.',
        o: ['RM150.00', 'RM555.56', 'RM705.56', 'RM8 466.67'], a: 2,
        f: 'A = P + Prt;  ansuran = ~f{A}{bilangan bulan}',
        s: ['Faedah = 60 000 × 0.03 × 9 = RM16 200.', 'A = 60 000 + 16 200 = RM76 200.', 'Bilangan bulan = 9 × 12 = 108.', 'Ansuran = 76 200 ÷ 108 = RM705.56'],
      },
      {
        bab: 3, l: 1, q: 'Aishah memiliki 4 000 unit amanah saham. Dividen yang diisytiharkan ialah 5 sen seunit. Berapakah jumlah dividen yang diterima?',
        o: ['RM20', 'RM80', 'RM200', 'RM2 000'], a: 2,
        f: 'Dividen = bilangan unit × dividen seunit',
        s: ['5 sen = RM0.05.', '4 000 × RM0.05 = RM200.'],
        tip: 'Tukar sen ke ringgit dahulu: 5 sen = RM0.05, bukan RM5.',
      },
      {
        bab: 4, l: 2, q: 'Sebuah objek sepanjang 20 cm dilukis dengan skala 1 : 2.5. Berapakah panjang lukisan?',
        o: ['8 cm', '17.5 cm', '22.5 cm', '50 cm'], a: 0,
        f: 'Ukuran lukisan = ~f{ukuran sebenar}{n}',
        s: ['n = 2.5 (lebih daripada 1), jadi lukisan lebih kecil.', 'Panjang lukisan = 20 ÷ 2.5 = 8 cm.'],
      },
      {
        bab: 5, l: 2, q: 'Dalam rajah, AC = 10 cm dan ∠BAC = 40°. Hitung panjang AB.',
        fig: tri({ n: ['A', 'B', 'C'], adj: 7.66, opp: 6.43, k: 20, ang: '40°', sides: [['A', 'C', '10 cm'], ['A', 'B', 'x']] }),
        o: ['6.43 cm', '7.66 cm', '8.39 cm', '13.05 cm'], a: 1,
        f: 'kos θ = ~f{bersebelahan}{hipotenus}',
        s: ['Dari sudut 40°: AB bersebelahan, AC hipotenus.', 'kos 40° = ~f{AB}{10}', 'AB = 10 × kos 40° = 10 × 0.7660', 'AB = 7.66 cm'],
      },
      {
        bab: 5, l: 2, q: 'Dalam sebuah segi tiga bersudut tegak, sisi bertentangan dengan sudut θ ialah 9 cm dan sisi bersebelahan ialah 12 cm. Cari θ.',
        o: ['36.87°', '41.41°', '48.59°', '53.13°'], a: 0,
        f: 'tan θ = ~f{bertentangan}{bersebelahan}',
        s: ['tan θ = ~f{9}{12} = 0.75', 'θ = tan^{−1} 0.75', 'θ = 36.87°'],
        tip: '53.13° ialah sudut yang satu lagi (12 ÷ 9).',
      },
      {
        bab: 6, l: 3, q: 'Dalam rajah, A, B, C dan D terletak pada lilitan bulatan. Perentas AC dan BD bersilang di E. Diberi ∠BAC = 40° dan ∠ABD = 30°. Cari ∠DEC.',
        fig: (() => {
          const A = on(150), B = on(30), Cc = on(310), Dd = on(210), E = cross(A, Cc, B, Dd);
          return circ({ P: { A, B, C: Cc, D: Dd, E }, lpos: { E: [0, -14] }, polys: [['A', 'B', 'C', 'D']], segs: [['A', 'C'], ['B', 'D']], angs: [['B', 'A', 'C', '40°', 26], ['A', 'B', 'D', '30°', 26], ['D', 'E', 'C', 'x', 16]] });
        })(),
        o: ['40°', '70°', '80°', '110°'], a: 3,
        f: 'Sudut dalam tembereng sama adalah sama; hasil tambah sudut segi tiga = 180°',
        s: ['∠BDC = ∠BAC = 40° (dicangkum lengkok BC yang sama).', '∠ACD = ∠ABD = 30° (dicangkum lengkok AD yang sama).', 'Dalam segi tiga DEC: ∠EDC = 40° dan ∠ECD = 30°.', '∠DEC = 180° − 40° − 30° = 110°'],
      },
      {
        bab: 6, l: 3, q: 'PA dan PB ialah tangen kepada sebuah bulatan pada A dan B. Diberi PA = 9 cm dan ∠APB = 60°. Hitung panjang perentas AB.',
        o: ['4.5 cm', '9 cm', '12 cm', '18 cm'], a: 1,
        f: 'PA = PB; segi tiga sama kaki dengan sudut puncak 60° ialah segi tiga sama sisi',
        s: ['Tangen dari titik luar sama panjang: PB = PA = 9 cm.', 'Segi tiga PAB sama kaki, jadi ∠PAB = ∠PBA = (180° − 60°) ÷ 2 = 60°.', 'Ketiga-tiga sudut 60°, jadi segi tiga PAB sama sisi.', 'AB = PA = 9 cm.'],
      },
      {
        bab: 7, l: 3, q: 'Rajah menunjukkan sebuah objek yang dibina daripada kubus yang sama saiz. Pilih <b>pelan</b> bagi objek itu.',
        fig: D.iso(S6),
        o: D.viewOpts(S6, 'plan'), a: 0,
        f: 'Pelan = pandangan dari atas; depan di bahagian bawah',
        s: ['Dari atas: baris depan ada 2 kubus (kiri dan tengah), baris tengah ada 2 kubus (tengah dan kanan), baris belakang ada 1 kubus (tengah).', 'Kubus tengah di baris tengah bertingkat dua, jadi permukaan atasnya lebih tinggi daripada jirannya.', 'Garis dilukis di sekeliling petak itu kerana tingginya berbeza.', 'Pelan yang betul:', D.view(D.viewCells(S6, 'plan'))],
      },
      {
        bab: 8, l: 3, q: 'Dua garis lurus AB dan CD bersilang di O. Titik X sama jarak dari AB dan CD, dan juga 3 cm dari O. Berapakah bilangan kedudukan X yang mungkin?',
        o: ['1', '2', '4', '0'], a: 2,
        f: 'Kira persilangan dua lokus',
        s: ['Lokus 1: sama jarak dari dua garis bersilang → dua garis pembahagi dua sama sudut, kedua-duanya melalui O.', 'Lokus 2: 3 cm dari O → bulatan berpusat O, jejari 3 cm.', 'Setiap garis yang melalui pusat memotong bulatan di 2 titik.', '2 garis × 2 titik = 4 kedudukan X.'],
      },
      {
        bab: 9, l: 2, q: 'Garis lurus y = mx + 6 melalui titik (3, 0). Cari nilai m.',
        o: ['−2', '2', '−~f{1}{2}', '3'], a: 0,
        f: 'Gantikan titik ke dalam persamaan',
        s: ['Gantikan x = 3, y = 0: 0 = m(3) + 6.', '3m = −6', 'm = −2', 'Semakan: pintasan-y 6, pintasan-x 3 → m = −~f{6}{3} = −2 ✓'],
      },
    ],
  });
})();
