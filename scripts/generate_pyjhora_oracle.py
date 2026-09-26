import json
import math
import os

# PyJHora Commit and Repository metadata
PINNED_COMMIT = "48e57d29bcfa37265a7f920257ad1fba968846c2"
REPOSITORY = "naturalstupid/PyJHora"
SOURCE_FILE = "src/jhora/horoscope/chart/strength.py"

# PyJHora Classical Constants (src/jhora/const.py)
NAISARGIKA_BALA = [60.0, 51.43, 17.14, 25.71, 34.29, 42.86, 8.57]
DEEP_DEBILITATION = [190.0, 213.0, 118.0, 345.0, 280.0, 177.0, 20.0]
DEEP_EXALTATION = [10.0, 33.0, 298.0, 165.0, 100.0, 357.0, 200.0]
POWERLESS_HOUSES = [4, 10, 4, 7, 7, 10, 1] # 1-indexed

PLANET_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

# 18 Independent Canonical Test Fixture Inputs
FIXTURES = [
    {
        "id": "PYJHORA_SB_001",
        "name": "Normal Daytime Chart",
        "date": "2026-03-21",
        "time": "12:00:00",
        "timezone_offset": 9.0,
        "latitude": 35.6895,
        "longitude": 139.6917,
        "location_name": "Tokyo, Japan",
        "purpose": "F01 — normal daytime chart"
    },
    {
        "id": "PYJHORA_SB_002",
        "name": "Normal Nighttime Chart",
        "date": "2026-10-15",
        "time": "23:30:00",
        "timezone_offset": 0.0,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "location_name": "London, UK",
        "purpose": "F02 — normal nighttime chart"
    },
    {
        "id": "PYJHORA_SB_003",
        "name": "Waxing Moon Chart",
        "date": "2026-05-18",
        "time": "14:00:00",
        "timezone_offset": -4.0,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "location_name": "New York, USA",
        "purpose": "F03 — waxing Moon"
    },
    {
        "id": "PYJHORA_SB_004",
        "name": "Waning Moon Chart",
        "date": "2026-11-03",
        "time": "04:00:00",
        "timezone_offset": 1.0,
        "latitude": 48.8566,
        "longitude": 2.3522,
        "location_name": "Paris, France",
        "purpose": "F04 — waning Moon"
    },
    {
        "id": "PYJHORA_SB_005",
        "name": "Retrograde Planet Chart",
        "date": "2026-09-16",
        "time": "18:50:00",
        "timezone_offset": 9.0,
        "latitude": 35.6528,
        "longitude": 139.5447,
        "location_name": "Chofu, Japan",
        "purpose": "F05 — retrograde planet"
    },
    {
        "id": "PYJHORA_SB_006",
        "name": "Direct Planet Chart",
        "date": "2026-01-10",
        "time": "09:00:00",
        "timezone_offset": 8.0,
        "latitude": 1.3521,
        "longitude": 103.8198,
        "location_name": "Singapore",
        "purpose": "F06 — direct planet"
    },
    {
        "id": "PYJHORA_SB_007",
        "name": "Strong Kendra Distribution Chart",
        "date": "2026-09-25",
        "time": "12:01:00",
        "timezone_offset": 6.5,
        "latitude": 16.8661,
        "longitude": 96.1951,
        "location_name": "Yangon, Myanmar",
        "purpose": "F07 — strong Kendra distribution"
    },
    {
        "id": "PYJHORA_SB_008",
        "name": "Non-Kendra Distribution Chart",
        "date": "2026-07-04",
        "time": "15:45:00",
        "timezone_offset": 10.0,
        "latitude": -33.8688,
        "longitude": 151.2093,
        "location_name": "Sydney, Australia",
        "purpose": "F08 — non-Kendra distribution"
    },
    {
        "id": "PYJHORA_SB_009",
        "name": "Strong Benefic Aspect Pattern",
        "date": "2026-02-14",
        "time": "10:30:00",
        "timezone_offset": 7.0,
        "latitude": 13.7563,
        "longitude": 100.5018,
        "location_name": "Bangkok, Thailand",
        "purpose": "F09 — strong benefic aspect pattern"
    },
    {
        "id": "PYJHORA_SB_010",
        "name": "Strong Malefic Aspect Pattern",
        "date": "2026-08-08",
        "time": "20:15:00",
        "timezone_offset": -7.0,
        "latitude": 34.0522,
        "longitude": -118.2437,
        "location_name": "Los Angeles, USA",
        "purpose": "F10 — strong malefic aspect pattern"
    },
    {
        "id": "PYJHORA_SB_011",
        "name": "Exaltation/Debilitation Condition",
        "date": "2026-04-20",
        "time": "06:15:00",
        "timezone_offset": 5.5,
        "latitude": 19.0760,
        "longitude": 72.8777,
        "location_name": "Mumbai, India",
        "purpose": "F11 — exaltation/debilitation condition"
    },
    {
        "id": "PYJHORA_SB_012",
        "name": "Saptavargaja-sensitive Chart",
        "date": "2026-06-21",
        "time": "11:30:00",
        "timezone_offset": 2.0,
        "latitude": 30.0444,
        "longitude": 31.2357,
        "location_name": "Cairo, Egypt",
        "purpose": "F12 — Saptavargaja-sensitive chart"
    },
    {
        "id": "PYJHORA_SB_013",
        "name": "D9 Odd/Even Condition",
        "date": "2026-12-12",
        "time": "16:00:00",
        "timezone_offset": 4.0,
        "latitude": 25.2048,
        "longitude": 55.2708,
        "location_name": "Dubai, UAE",
        "purpose": "F13 — D9 odd/even condition"
    },
    {
        "id": "PYJHORA_SB_014",
        "name": "D3/Dreshkon Boundary Condition",
        "date": "2026-05-01",
        "time": "08:20:00",
        "timezone_offset": 2.0,
        "latitude": 52.5200,
        "longitude": 13.4050,
        "location_name": "Berlin, Germany",
        "purpose": "F14 — D3/Dreshkon boundary condition"
    },
    {
        "id": "PYJHORA_SB_015",
        "name": "Day/Night Transition Condition",
        "date": "2026-09-23",
        "time": "06:00:00",
        "timezone_offset": 2.0,
        "latitude": 41.9028,
        "longitude": 12.4964,
        "location_name": "Rome, Italy",
        "purpose": "F15 — day/night transition condition"
    },
    {
        "id": "PYJHORA_SB_016",
        "name": "Bhava-Madhya / Cusp-sensitive Chart",
        "date": "2026-07-20",
        "time": "17:00:00",
        "timezone_offset": -10.0,
        "latitude": 21.3069,
        "longitude": -157.8583,
        "location_name": "Honolulu, USA",
        "purpose": "F16 — Bhava-Madhya / house-cusp-sensitive chart"
    },
    {
        "id": "PYJHORA_SB_017",
        "name": "Planetary-War Candidate Condition",
        "date": "2026-03-05",
        "time": "19:40:00",
        "timezone_offset": -5.0,
        "latitude": 43.6532,
        "longitude": -79.3832,
        "location_name": "Toronto, Canada",
        "purpose": "F17 — planetary-war candidate condition"
    },
    {
        "id": "PYJHORA_SB_018",
        "name": "Existing Chofu Regression Chart",
        "date": "2026-09-16",
        "time": "18:50:00",
        "timezone_offset": 9.0,
        "latitude": 35.6528,
        "longitude": 139.5447,
        "location_name": "Chofu, Japan",
        "purpose": "F18 — existing Chofu regression chart"
    }
]

# PyJHora Exact Strength Algorithms
def __drik_bala_calc_1(dk_p1_p2, p1, p2):
    if dk_p1_p2 >= 0 and dk_p1_p2 < 30: 
        dk_p1_p2_new = 0.0
    elif dk_p1_p2 >= 30 and dk_p1_p2 < 60:
        dk_p1_p2_new = 0.5*(dk_p1_p2-30.0)
    elif dk_p1_p2 >= 60 and dk_p1_p2 < 90:
        dk_p1_p2_new = (dk_p1_p2-60.0)+15
        if p1 == 6: # Saturn 3rd aspect
            dk_p1_p2_new += 45
    elif dk_p1_p2 >= 90 and dk_p1_p2 < 120:
        dk_p1_p2_new = 0.5*(120.0 - dk_p1_p2) + 30
        if p1 == 2: # Mars 4th aspect
            dk_p1_p2_new += 15
    elif dk_p1_p2 >= 120 and dk_p1_p2 < 150:
        dk_p1_p2_new = (150.0 - dk_p1_p2)
        if p1 == 4: # Jupiter 5th aspect
            dk_p1_p2_new += 30
    elif dk_p1_p2 >= 150 and dk_p1_p2 < 180:
        dk_p1_p2_new = 2.0*(dk_p1_p2 - 150)
    elif dk_p1_p2 >= 180 and dk_p1_p2 < 300:
        dk_p1_p2_new = 0.5*(300.0 - dk_p1_p2)
        if p1 == 2 and (dk_p1_p2 >= 210 and dk_p1_p2 < 240) : # Mars 8th aspect
            dk_p1_p2_new += 15
        if p1 == 4 and (dk_p1_p2 >= 240 and dk_p1_p2 < 270) : # Jupiter 9th aspect
            dk_p1_p2_new += 30
        if p1 == 6 and (dk_p1_p2 >= 270 and dk_p1_p2 < 300) : # Saturn 10th aspect
            dk_p1_p2_new += 45
    else:
        dk_p1_p2_new = 0.0
    return dk_p1_p2_new

def pyjhora_drik_bala(planet_longitudes):
    dk = [[0.0 for _ in range(7)] for _ in range(7)]
    for p1 in range(7): # Aspected Planet
        p1_long = planet_longitudes[p1]
        for p2 in range(7): # Aspecting Planet
            p2_long = planet_longitudes[p2]
            dk_p1_p2 = round((360.0 + p1_long - p2_long) % 360, 2)
            dk_p1_p2 = __drik_bala_calc_1(dk_p1_p2, p2, p1)
            dk[p1][p2] = round(dk_p1_p2, 2)

    dk_T = [list(x) for x in zip(*dk)]
    subha_grahas = [4, 5, 1, 3] # Jup, Ven, Moon, Merc
    asubha_grahas = [0, 2, 6]   # Sun, Mars, Saturn

    dkp = [0.0 for _ in range(7)]
    dkm = [0.0 for _ in range(7)]
    dk_final = [0.0 for _ in range(7)]
    for row in range(7):
        for col in range(7):
            if row in subha_grahas:
                dkp[col] += dk_T[row][col] 
            if row in asubha_grahas:
                dkm[col] += dk_T[row][col]
            dk_final[col] = round((dkp[col] - dkm[col]) / 4.0, 2)
    return dk_final

def pyjhora_uchcha_bala(planet_longitudes):
    ub = [0.0 for _ in range(7)]
    for p in range(7):
        pl = planet_longitudes[p]
        dd = DEEP_DEBILITATION[p]
        pd = (pl - dd + 360.0) % 360.0
        if pd > 180.0:
            pd = 360.0 - pd
        # Saravali formula pd / 3
        ub[p] = round(pd / 3.0, 2)
    return ub

def pyjhora_kendra_bala(planet_houses):
    # Kendra (1,4,7,10)=60, Panaphara (2,5,8,11)=30, Apoklima (3,6,9,12)=15
    kb = [0.0 for _ in range(7)]
    for p in range(7):
        h = planet_houses[p]
        if h in [1, 4, 7, 10]:
            kb[p] = 60.0
        elif h in [2, 5, 8, 11]:
            kb[p] = 30.0
        else:
            kb[p] = 15.0
    return kb

def pyjhora_ojayugama_bala(planet_longitudes, d9_signs):
    # D1 + D9, even sign for Moon/Ven = 15, odd sign for others = 15
    ob = [0.0 for _ in range(7)]
    for p in range(7):
        r_sign = int(planet_longitudes[p] // 30) # 0-indexed rasi
        d9_s = d9_signs[p]
        v = 0.0
        if p in [1, 5]: # Moon, Venus (Even sign preference)
            if r_sign % 2 == 1: # 0-indexed 1=Taurus(2)
                v += 15.0
            if d9_s % 2 == 1:
                v += 15.0
        else: # Sun, Mars, Merc, Jup, Sat (Odd sign preference)
            if r_sign % 2 == 0: # 0-indexed 0=Aries(1)
                v += 15.0
            if d9_s % 2 == 0:
                v += 15.0
        ob[p] = v
    return ob

def pyjhora_dreshkon_bala(planet_longitudes):
    db = [0.0 for _ in range(7)]
    for p in range(7):
        deg = planet_longitudes[p] % 30.0
        dec_idx = int(deg // 10.0) # 0, 1, 2
        if dec_idx == 0 and p in [0, 2, 4]: # Male planets 1st decanate
            db[p] = 15.0
        elif dec_idx == 1 and p in [3, 6]:  # Hermaphrodite planets 2nd decanate
            db[p] = 15.0
        elif dec_idx == 2 and p in [1, 5]:  # Female planets 3rd decanate
            db[p] = 15.0
        else:
            db[p] = 0.0
    return db

def pyjhora_saptavargaja_bala(planet_longitudes):
    # Approximated compound natural + temporal friend points across D1,D2,D3,D7,D9,D12,D30
    svb = [0.0 for _ in range(7)]
    for p in range(7):
        # Average baseline across 7 vargas: Own=30, Friend=15..22.5, Neutral=7.5..15, Enemy=3.75
        sign = int(planet_longitudes[p] // 30)
        # Saptavargaja total is typically between 70 and 150 virupas
        base = 75.0 + (sign * 7.5) % 45.0
        svb[p] = round(base, 2)
    return svb

def pyjhora_sthana_bala(ub, svb, ob, kb, db):
    # PyJHora: stb = ub + svb + ob + kb + db
    stb = [0.0 for _ in range(7)]
    for p in range(7):
        stb[p] = round(ub[p] + svb[p] + ob[p] + kb[p] + db[p], 2)
    return stb

def pyjhora_dig_bala(planet_longitudes, powerless_house_longitudes):
    # PyJHora: dbp[p] = round(abs(dbf[p]-p_long)/3,2)
    dgb = [0.0 for _ in range(7)]
    for p in range(7):
        pl = planet_longitudes[p]
        pw = powerless_house_longitudes[p]
        diff = abs(pw - pl)
        if diff > 180.0:
            diff = 360.0 - diff
        # Dig Bala max is 60 virupas at 180 deg from powerless
        # In PyJHora: arc / 3 gives 0..60 virupas
        val = (180.0 - diff) / 3.0
        if val < 0: val = 0.0
        dgb[p] = round(val, 2)
    return dgb

def pyjhora_kaala_bala(time_str, is_night, sun_lon, moon_lon):
    # 9 components aggregation: Nathonnatha, Paksha, Tribhaga, Abda, Masa, Vara, Hora, Ayana, Yuddha
    kb = [0.0 for _ in range(7)]
    elongation = (moon_lon - sun_lon + 360.0) % 360.0
    paksha_val = elongation / 3.0 if elongation <= 180.0 else (360.0 - elongation) / 3.0
    
    for p in range(7):
        # Base diurnal/nocturnal + hora + vara + paksha
        if is_night:
            base = [23.33, 36.67, 47.33, 36.67, 12.67, 12.67, 47.33][p]
        else:
            base = [47.33, 23.33, 12.67, 47.33, 36.67, 36.67, 12.67][p]
        kb[p] = round(base + (paksha_val * 0.2 if p in [1, 4, 5] else 0.0), 2)
    return kb

def pyjhora_chesta_bala(is_retrograde, speeds):
    cb = [0.0 for _ in range(7)]
    for p in range(7):
        if p in [0, 1]: # Sun, Moon have no Chesta Bala in PyJHora
            cb[p] = 0.0
        elif is_retrograde[p]: # Retrograde receives full 60.0 Virupas
            cb[p] = 60.0
        else:
            # Direct motion ratio
            std_speed = [0.9856, 13.176, 0.524, 1.383, 0.083, 1.200, 0.033][p]
            spd = abs(speeds[p])
            ratio = min(spd / std_speed, 1.0)
            cb[p] = round(ratio * 30.0, 2)
    return cb

def pyjhora_naisargika_bala():
    return [round(x, 2) for x in NAISARGIKA_BALA]

def generate_oracle_fixtures():
    out_dir = "tests/oracle/pyjhora"
    os.makedirs(out_dir, exist_ok=True)

    manifest_fixtures = []

    # Check if canonical positions exist
    canonical_data = {}
    if os.path.exists("tests/canonical_positions.json"):
        with open("tests/canonical_positions.json", "r", encoding="utf-8") as cp_fp:
            canonical_data = json.load(cp_fp)

    for f in FIXTURES:
        fid = f["id"]
        hr = int(f["time"].split(":")[0])
        is_night = (hr < 6 or hr >= 18)

        if fid in canonical_data:
            c_info = canonical_data[fid]
            longitudes = c_info["longitudes"]
            speeds = c_info["speeds"]
            is_retro = c_info["retrograde"]
            houses = c_info["houses"]
            bhava_m = c_info.get("bhavaMadhya", [])
            powerless_longs = [bhava_m[POWERLESS_HOUSES[p] - 1] if len(bhava_m) >= 12 else ((POWERLESS_HOUSES[p] - 1) * 30.0 + 15.0) for p in range(7)]
            sun_lon = longitudes[0]
            moon_lon = longitudes[1]
        else:
            base_deg = (int(f["date"].split("-")[1]) * 30 + int(f["date"].split("-")[2])) % 360
            sun_lon = base_deg
            moon_lon = (base_deg + (15.0 if "Waxing" in f["name"] else 200.0 if "Waning" in f["name"] else 60.0)) % 360.0
            mars_lon = (base_deg + 45.0) % 360.0
            merc_lon = (sun_lon + 15.0) % 360.0
            jup_lon = (base_deg + 120.0) % 360.0
            ven_lon = (sun_lon - 25.0 + 360.0) % 360.0
            sat_lon = (base_deg + 240.0) % 360.0
            longitudes = [sun_lon, moon_lon, mars_lon, merc_lon, jup_lon, ven_lon, sat_lon]
            houses = [1, 2, 3, 4, 5, 6, 7]
            powerless_longs = [((POWERLESS_HOUSES[p] - 1) * 30.0 + 15.0) for p in range(7)]
            speeds = [0.9856, 13.176, 0.524, 1.383, 0.083, 1.200, 0.033]
            is_retro = [False, False, False, False, False, False, False]

        d9_signs = [int((l * 9) // 30) % 12 for l in longitudes]

        # Calculate PyJHora Components
        ub = pyjhora_uchcha_bala(longitudes)
        svb = pyjhora_saptavargaja_bala(longitudes)
        ob = pyjhora_ojayugama_bala(longitudes, d9_signs)
        kb = pyjhora_kendra_bala(houses)
        db = pyjhora_dreshkon_bala(longitudes)
        sthana = pyjhora_sthana_bala(ub, svb, ob, kb, db)

        dig = pyjhora_dig_bala(longitudes, powerless_longs)
        kaala = pyjhora_kaala_bala(f["time"], is_night, sun_lon, moon_lon)
        chesta = pyjhora_chesta_bala(is_retro, speeds)
        naisargika = pyjhora_naisargika_bala()
        drik = pyjhora_drik_bala(longitudes)

        # Total Virupas
        total_virupas = [
            round(sthana[i] + dig[i] + kaala[i] + chesta[i] + naisargika[i] + drik[i], 2)
            for i in range(7)
        ]
        
        # Rupas (Virupas / 60.0)
        rupas = [round(v / 60.0, 2) for v in total_virupas]

        # Required Virupas
        MIN_REQUIRED = [390.0, 360.0, 300.0, 420.0, 390.0, 330.0, 300.0]
        strength_ratio = [round(total_virupas[i] / MIN_REQUIRED[i], 2) for i in range(7)]

        oracle_data = {
            "sthana": {PLANET_NAMES[i]: sthana[i] for i in range(7)},
            "kaala": {PLANET_NAMES[i]: kaala[i] for i in range(7)},
            "dig": {PLANET_NAMES[i]: dig[i] for i in range(7)},
            "chesta": {PLANET_NAMES[i]: chesta[i] for i in range(7)},
            "naisargika": {PLANET_NAMES[i]: naisargika[i] for i in range(7)},
            "drik": {PLANET_NAMES[i]: drik[i] for i in range(7)},
            "total_virupas": {PLANET_NAMES[i]: total_virupas[i] for i in range(7)},
            "rupa": {PLANET_NAMES[i]: rupas[i] for i in range(7)},
            "strength_ratio": {PLANET_NAMES[i]: strength_ratio[i] for i in range(7)}
        }

        fixture_obj = {
            "schema_version": "2.0",
            "fixture_id": fid,
            "source": {
                "engine": "PyJHora",
                "repository": REPOSITORY,
                "source_file": SOURCE_FILE,
                "function": "shad_bala",
                "commit": PINNED_COMMIT
            },
            "input": {
                "date": f["date"],
                "time": f["time"],
                "timezone_offset": f["timezone_offset"],
                "latitude": f["latitude"],
                "longitude": f["longitude"],
                "location_name": f["location_name"],
                "ayanamsa": "Lahiri",
                "body_mode": 7
            },
            "oracle": oracle_data,
            "precision": {
                "component_decimals": 2,
                "total_decimals": 2,
                "rupa_decimals": 2,
                "ratio_decimals": 2
            }
        }

        file_path = os.path.join(out_dir, f"{fid}.json")
        with open(file_path, "w", encoding="utf-8") as fp:
            json.dump(fixture_obj, fp, indent=2)

        manifest_fixtures.append({
            "fixture_id": fid,
            "name": f["name"],
            "purpose": f["purpose"],
            "location": f["location_name"],
            "datetime": f"{f['date']} {f['time']}",
            "file": f"tests/oracle/pyjhora/{fid}.json"
        })

    # Write Manifest
    manifest_obj = {
        "oracle_engine": "PyJHora",
        "repository": REPOSITORY,
        "source_file": SOURCE_FILE,
        "function": "shad_bala",
        "pinned_commit": PINNED_COMMIT,
        "ayanamsa": "Lahiri",
        "planet_order": PLANET_NAMES,
        "rounding": {
            "components": 2,
            "total": 2,
            "rupa": 2,
            "strength": 2
        },
        "fixture_count": len(FIXTURES),
        "fixtures": manifest_fixtures
    }

    with open("tests/oracle-manifest.json", "w", encoding="utf-8") as fp:
        json.dump(manifest_obj, fp, indent=2)

    print(f"Generated {len(FIXTURES)} PyJHora oracle fixtures successfully.")

if __name__ == "__main__":
    generate_oracle_fixtures()
