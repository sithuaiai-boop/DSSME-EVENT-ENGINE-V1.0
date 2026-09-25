# Reference and Attribution — DSSME EVENT ENGINE V1.0

## Primary Astronomical & Vedic References

### 1. PyJHora
- **Repository**: `https://github.com/naturalstupid/PyJHora`
- **Author**: naturalstupid
- **Inspiration**: P.V.R. Narasimha Rao's seminal treatise *"Vedic Astrology - An Integrated Approach"* and the *Jagannatha Hora (JHora)* computation engine.
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0)
- **Role in DSSME**: PyJHora serves strictly as an architectural and methodological reference oracle and benchmark verification target. The DSSME Event Engine V1.0 is an independent, clean-room TypeScript implementation designed for modern cloud runtimes (Vercel Serverless / Node.js) and contains zero copied source code.

### 2. Swiss Ephemeris
- **Original Authors**: Astrodienst AG (Dieter Koch, Alois Treindl)
- **Engine Package**: `swisseph-wasm` (v0.1.0)
- **License**: GNU General Public License (GPL-3.0-or-later)
- **Role in DSSME**: High-precision planetary ephemeris computation compiled directly from Swiss Ephemeris C source to portable WebAssembly (WASM). Self-contained, immutable, zero native build requirements.

### 3. DSSME Universal Specification & Benchmark
- **Extraction Specification**: `DSSME_Extraction_Prompt_JSON_v1_4.md` (v1.4 - 16 active blocks, Gochara retired)
- **Canonical Benchmark Fixture**: `DSSME_CHART_2026-09-16_Chofu.json` (Chofu, Japan - 2026-09-16 18:50:00 JST)
- **Ayanamsa**: Lahiri (Chitra Paksha), sidereal longitude standard.
- **House System**: Placidus ('P') / Equal House sidereal.
