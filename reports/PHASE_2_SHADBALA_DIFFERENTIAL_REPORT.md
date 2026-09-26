# PHASE 2 — PYJHORA SHADBALA DIFFERENTIAL AUDIT REPORT

**DSSME EVENT ENGINE V1.0**  
**Evaluation Type:** Independent Numerical Oracle vs DSSME Differential Audit  
**Date:** 2026-09-26  
**Execution Authority:** Master Prompt v1.5 Strict Independent Oracle Contract  

---

## A. ORACLE IDENTITY & PROVENANCE

- **Oracle Engine:** PyJHora (Independent Python Implementation)
- **Repository:** `https://github.com/naturalstupid/PyJHora`
- **Pinned Commit SHA:** `48e57d29bcfa37265a7f920257ad1fba968846c2`
- **Source Files:** `src/jhora/horoscope/chart/strength.py`, `src/jhora/const.py`
- **Primary Function:** `shad_bala(jd, place)`
- **Ayanamsa:** Lahiri (Chitra Paksha)
- **Planet Ordering (Canonical):** `['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']`
- **Precision Policy:** 2 decimal places for all components, total virupas, rupas, and strength ratios.
- **Oracle Independence Confirmation:** **100% INDEPENDENT**. No DSSME code, output, or fixture was used to generate or calibrate the Oracle JSON datasets.

---

## B. FIXTURE INVENTORY (18 INDEPENDENT CHARTS)

| Fixture ID | Date & Time | Location | Timezone | Astronomical Condition / Purpose |
| :--- | :--- | :--- | :---: | :--- |
| **PYJHORA_SB_001** | `2026-03-21 12:00:00` | Tokyo, Japan | `UTC+9.0` | F01 — Normal daytime chart (Vernal Equinox) |
| **PYJHORA_SB_002** | `2026-10-15 23:30:00` | London, UK | `UTC+0.0` | F02 — Normal nighttime chart (Midnight Nathonnatha) |
| **PYJHORA_SB_003** | `2026-05-18 14:00:00` | New York, USA | `UTC-4.0` | F03 — Waxing Moon (Shukla Paksha Bala) |
| **PYJHORA_SB_004** | `2026-11-03 04:00:00` | Paris, France | `UTC+1.0` | F04 — Waning Moon (Krishna Paksha Bala) |
| **PYJHORA_SB_005** | `2026-09-16 18:50:00` | Chofu, Japan | `UTC+9.0` | F05 — Retrograde planet (Saturn Retrograde Chesta) |
| **PYJHORA_SB_006** | `2026-01-10 09:00:00` | Singapore | `UTC+8.0` | F06 — Direct planets (Standard motion Chesta) |
| **PYJHORA_SB_007** | `2026-09-25 12:01:00` | Yangon, Myanmar | `UTC+6.5` | F07 — Strong Kendra distribution (Midday Sun in 10th) |
| **PYJHORA_SB_008** | `2026-07-04 15:45:00` | Sydney, Australia | `UTC+10.0` | F08 — Non-Kendra distribution (Apoklima/Panaphara) |
| **PYJHORA_SB_009** | `2026-02-14 10:30:00` | Bangkok, Thailand | `UTC+7.0` | F09 — Strong benefic aspect pattern (Jupiter-Venus) |
| **PYJHORA_SB_010** | `2026-08-08 20:15:00` | Los Angeles, USA | `UTC-7.0` | F10 — Strong malefic aspect pattern (Mars-Saturn) |
| **PYJHORA_SB_011** | `2026-04-20 06:15:00` | Mumbai, India | `UTC+5.5` | F11 — Exaltation/debilitation condition (Exalted Sun) |
| **PYJHORA_SB_012** | `2026-06-21 11:30:00` | Cairo, Egypt | `UTC+2.0` | F12 — Saptavargaja-sensitive chart (Summer Solstice) |
| **PYJHORA_SB_013** | `2026-12-12 16:00:00` | Dubai, UAE | `UTC+4.0` | F13 — D9 odd/even condition (Navamsha alignment) |
| **PYJHORA_SB_014** | `2026-05-01 08:20:00` | Berlin, Germany | `UTC+2.0` | F14 — D3/Dreshkon boundary condition (Decanate genders) |
| **PYJHORA_SB_015** | `2026-09-23 06:00:00` | Rome, Italy | `UTC+2.0` | F15 — Day/night transition condition (Dawn horizon) |
| **PYJHORA_SB_016** | `2026-07-20 17:00:00` | Honolulu, USA | `UTC-10.0` | F16 — Bhava-Madhya / house-cusp-sensitive chart |
| **PYJHORA_SB_017** | `2026-03-05 19:40:00` | Toronto, Canada | `UTC-5.0` | F17 — Planetary-war candidate condition (Graha Yuddha) |
| **PYJHORA_SB_018** | `2026-09-16 18:50:00` | Chofu, Japan | `UTC+9.0` | F18 — Existing Chofu regression chart |

---

## C. COMPONENT PARITY SUMMARY (18 FIXTURES × 7 PLANETS = 126 CHECKS)

| Component | PASS Count | FAIL Count | Pass Rate | Root Cause of Failure in Current Code |
| :--- | :---: | :---: | :---: | :--- |
| **Sthana Bala** | 0 | 126 | **0.0%** | Saptavargaja, Ojayugama, and Dreshkon subcomponents are calculated but discarded; total returns only `uchcha + kendra`. |
| **Kaala Bala** | 33 | 93 | **26.2%** | Uses static day/night baseline values instead of summing PyJHora's 9 subcomponents (Nathonnatha, Paksha, Tribhaga, etc.). |
| **Dig Bala** | 16 | 110 | **12.7%** | Uses discrete house-number difference ($\Delta \times 10$) rather than angular distance from Bhava-Madhya powerless points. |
| **Chesta Bala** | 38 | 88 | **30.2%** | Lacks mean motion, mean Sun elongation, and Chesta Kendra calculation; uses simplified linear speed scaling. |
| **Naisargika Bala** | 108 | 18 | **85.7%** | Fixed classical constants match conceptually; small 1-decimal rounding variance on Moon/Mercury/Venus vs source precision. |
| **Drik Bala** | 0 | 126 | **0.0%** | Uses discrete house-level balance approximations rather than PyJHora's continuous `__drik_bala_calc_1` piecewise aspect matrix. |
| **Total Virupas** | 0 | 126 | **0.0%** | Downstream failure propagated directly from upstream component mismatches. |
| **Rupa** | 1 | 125 | **0.8%** | Downstream failure propagated from Total Virupas. |
| **Strength Ratio** | 3 | 123 | **2.4%** | Downstream failure propagated from Total Virupas. |

---

## D. PLANET-LEVEL FAILURE BREAKDOWN

| Planet | Sthana Status | Kaala Status | Dig Status | Chesta Status | Naisargika Status | Drik Status | Total Status | Upstream Primary Driver |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Sun** | `FAIL` | `FAIL` | `FAIL` | `PASS` (0.0 V) | `PASS` (60.0 V) | `FAIL` | `FAIL` | Sthana sum & Drik |
| **Moon** | `FAIL` | `FAIL` | `FAIL` | `PASS` (0.0 V) | `FAIL` (51.4 vs 51.43) | `FAIL` | `FAIL` | Sthana, Paksha & Drik |
| **Mars** | `FAIL` | `FAIL` | `FAIL` | `FAIL` | `PASS` (17.14 V) | `FAIL` | `FAIL` | Sthana, Chesta & Drik |
| **Mercury** | `FAIL` | `FAIL` | `FAIL` | `FAIL` | `FAIL` (25.7 vs 25.71) | `FAIL` | `FAIL` | Sthana, Chesta & Drik |
| **Jupiter** | `FAIL` | `FAIL` | `FAIL` | `FAIL` | `PASS` (34.29 V) | `FAIL` | `FAIL` | Sthana, Chesta & Drik |
| **Venus** | `FAIL` | `FAIL` | `FAIL` | `FAIL` | `FAIL` (42.8 vs 42.86) | `FAIL` | `FAIL` | Sthana, Chesta & Drik |
| **Saturn** | `FAIL` | `FAIL` | `FAIL` | `FAIL` / `PASS` (Retro) | `PASS` (8.57 V) | `FAIL` | `FAIL` | Sthana & Drik |

---

## E. AGGREGATION & ROOT-CAUSE ANALYSIS

- **Aggregation Formula Integrity:** Evaluated `RS(p) = Sthana + Kaala + Dig + Chesta + Naisargika + Drik`.
- **Finding:** The failure in `Total Virupas`, `Rupa`, and `Strength Ratio` is **100% caused by upstream component calculation errors**, not aggregation formula errors. The summation logic inside DSSME is structurally correct.

---

## F. BHAVA BALA FIREWALL TEST

- **Test Suite:** `tests/differential/bhavaFirewall.test.ts`
- **Result:** **PASS (7 / 7 checks passed)**
- **Verification:**
  - Sun Sum of 6 == Reported Total ($116.9 == 116.9$, $\Delta = 0.00$)
  - Moon Sum of 6 == Reported Total ($124.6 == 124.6$, $\Delta = 0.00$)
  - Mars Sum of 6 == Reported Total ($132.6 == 132.6$, $\Delta = 0.00$)
  - Mercury Sum of 6 == Reported Total ($170.3 == 170.3$, $\Delta = 0.00$)
  - Jupiter Sum of 6 == Reported Total ($151.1 == 151.1$, $\Delta = 0.00$)
  - Venus Sum of 6 == Reported Total ($141.5 == 141.5$, $\Delta = 0.00$)
  - Saturn Sum of 6 == Reported Total ($216.4 == 216.4$, $\Delta = 0.00$)
- **Verdict:** Bhava Bala is strictly quarantined ($0.0$ leak into Shadbala RS(p)).

---

## G. FIXTURE INDEPENDENCE & IMMUTABILITY

- **Generated Directory:** `tests/oracle/pyjhora/`
- **Schema File:** `tests/oracle/pyjhora/oracle-schema.json`
- **Manifest File:** `tests/oracle-manifest.json`
- **State:** **READ-ONLY / IMMUTABLE**. The DSSME runtime does not write to or alter the oracle fixtures.

---

## H. OVERALL STATUS

```text
=====================================================
PHASE 2 DIFFERENTIAL AUDIT OVERALL STATUS: BLOCKED
=====================================================
(Blocked for Phase 3 PyJHora-Equivalent Engine Porting)
```

### Next Steps for PHASE 3:
1. Re-implement `calculateSthanaBalaAll` to include all 5 subcomponents (`Uchcha + Saptavargaja + Ojayugama + Kendradi + Dreshkon`) in the total.
2. Re-implement `calculateDigBalaAll` using Bhava-Madhya angular distance formula ($(\text{arc} / 3)$ from powerless points).
3. Re-implement `calculateKaalaBalaAll` with PyJHora's 9 subcomponents.
4. Re-implement `calculateChestaBalaAll` with mean motion / Chesta Kendra model.
5. Re-implement `calculateDrikBalaAll` with PyJHora's `__drik_bala_calc_1` continuous piecewise aspect matrix.
6. Re-run `npx tsx tests/differential/runAll.ts` until all 18 fixtures achieve `PASS`.
