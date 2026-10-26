# Maono PD100X — review edit (HyperFrames)

9:16, 1080×1920, 30 fps, 1:44. Built with [HyperFrames](https://hyperframes.heygen.com) (HTML → video).

## Edit decisions

| Film time | What | Source |
| --- | --- | --- |
| 0:00–0:06 | **Hook** (duplicate of 7.45–13.45): "Benda paling berbaloi tahun ni aku spend tau. Tak sampai RM300, Maono PD100X." | raw + B-roll mic |
| 0:06 | Light flash into the full video | `editorial-flash-overlay` |
| 0:06–0:58 | Full video from the start (hook moment plays again in its original place) | raw 0–52.3 |
| 0:58 | Muted pause tightened by 2.1 s (jump cut re-framed) | raw 54.4–100.05 |

B-roll: mic hero shot on "Tak sampai RM300, Maono PD100X" (hook + original) and on "mic jenis dynamic";
bottom ports on "port XLR bawah ni… USB Type-C"; cable on "dua connector… cabut, jadi Type-C"
(the adapter coming off is synced to "cabut").

Smooth zoom-ins on the product with function cards: Dynamic Mic, Touch-to-Mute (red LED),
Knob Volume. Brand cards whenever MAONO PD100X / MAONO SOUNDCARD is said.

Captions: Whisper large-v3 word timings, corrected by hand (Maono, XLR, Type-C, "beg kuning").
White text, active word and key words in yellow (#FFD23F), Montserrat. All text sits inside the
TikTok/Reels safe band (168–1330 px, clear of the right action rail).

Grade (HyperFrames media treatment): A-roll `skin-soft` 0.7, exposure +0.25, shadows +0.2,
highlights −0.16, warm +0.07, vignette 0.14, fine grain. B-roll: restrained product polish.

Audio: high-pass, light denoise, EQ, gentle compression, static gain to −15 LUFS / −1.6 dBTP
(static so the volume-knob demo still sounds quieter).

## Rebuild

Media is not committed (the A-roll proxy is ~300 MB).

```bash
tools/prep_media.sh /path/to/drive-downloads assets   # raw.mov, broll1.mov, broll2.mov, broll3.mov
python3 tools/build_captions.py tools/transcript.json compositions/captions.html
npx hyperframes@0.8.201 check
npx hyperframes@0.8.201 render --quality high -o maono-pd100x-edit.mp4
```

Drive sources: raw `1o7U5_-roCw1V5V3vX2avYDUaH0oHOGiX`, B-roll `1MSYlroXwtSpvlw_oXZR9d0DWPLvLdZPf` (mic),
`1zXd1o8TaekTLlY-0sawEAVvzNyyPiOmN` (cable), `13Tf3Bx9jSbm_2_woH90WECy8kdJYmZks` (ports).
