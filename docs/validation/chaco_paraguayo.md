# Validation run: Chaco Paraguayo

Parcel: circle of 2 km radius at −22.5, −60.0 (12.5 km²). Mode: offline replay of recorded responses. Result `6evrfxv_c7a8cd50_9ff48e`, generated 2026-09-12T09:59:22+00:00. Reference grid: 2000 cells, 1981 comparable. Dimensions used: 24/24.

Regenerate with `uv run python scripts/validate_chaco.py`. All figures below are read from `chaco_paraguayo.json` in this folder.

## Parcel profile

| Dimension | Value | z |
|---|---|---|
| Mean annual temperature | 24.7 °C | +0.80 |
| Temperature seasonality (SD × 100) | 361 °C×100 | -0.58 |
| Max temperature of warmest month | 35.6 °C | +0.62 |
| Min temperature of coldest month | 11.8 °C | +0.71 |
| Annual precipitation | 685 mm | +0.09 |
| Precipitation seasonality (CV) | 55.3 % | -0.60 |
| Aridity index (P / PET) | 0.368 | -0.22 |
| Mean annual evapotranspiration | 407 mm/yr | -0.15 |
| Water use efficiency (GPP / ET) | 1.84 g C / kg H₂O | -0.01 |
| NDWI, dry-season mean | -0.492 | -0.65 |
| NDMI, dry-season mean | -0.010 | -0.13 |
| Sentinel-1 VV backscatter, dry-season mean | -9.51 dB | +0.29 |
| pH (H₂O), 0–30 cm | 6.88 pH | +0.01 |
| Soil organic carbon, 0–30 cm | 16.0 g/kg | -0.31 |
| Clay, 0–30 cm | 32.1 % | +0.94 |
| Sand, 0–30 cm | 33.5 % | -0.99 |
| Cation exchange capacity, 0–30 cm | 18.9 cmol(c)/kg | -0.23 |
| Bulk density, 0–30 cm | 1.35 kg/dm³ | +0.14 |
| Coarse fragments, 0–30 cm | 3.05 vol % | -1.52 |
| Elevation | 133 m | -0.64 |
| Mean slope | 0.271 ° | -0.75 |
| Insolation index (equinox noon, flat = 1) | 1.000 | +0.49 |
| NDVI amplitude (peak − trough) | 0.408 | +0.75 |
| Growing season length | 208 days | +0.62 |

Land cover (ESA WorldCover 2021): Grassland (41 % of the parcel). Dry quarter: months [6, 7, 8].

## Matched innovation regions

| # | Region | Similarity percentile | Distance | Analog cell aridity index | Analog annual precip. | Closest dimensions | Largest divergences |
|---|---|---|---|---|---|---|---|
| 1 | Sonora (Costa de Hermosillo, Yaqui and Mayo valleys) (Mexico) | 99.5 | 0.690 | 0.192 | 360 mm | NDMI, dry-season mean, Mean annual temperature, Cation exchange capacity, 0–30 cm | Precipitation seasonality (CV), pH (H₂O), 0–30 cm, Max temperature of warmest month |
| 2 | Western Rajasthan (India) | 99.4 | 0.704 | 0.096 | 186 mm | Mean slope, Insolation index (equinox noon, flat = 1), Water use efficiency (GPP / ET) | Temperature seasonality (SD × 100), NDWI, dry-season mean, Sand, 0–30 cm |
| 3 | San Juan (Tulum, Ullum-Zonda valleys) (Argentina) | 99.1 | 0.724 | 0.185 | 234 mm | Precipitation seasonality (CV), Water use efficiency (GPP / ET), Cation exchange capacity, 0–30 cm | Mean annual temperature, Coarse fragments, 0–30 cm, NDWI, dry-season mean |
| 4 | Mendoza oases (Argentina) | 99.0 | 0.725 | 0.218 | 279 mm | Cation exchange capacity, 0–30 cm, Sentinel-1 VV backscatter, dry-season mean, Soil organic carbon, 0–30 cm | Mean annual temperature, Sand, 0–30 cm, Growing season length |
| 5 | Xinjiang oases (Tarim and Junggar margins) (China) | 98.7 | 0.741 | 0.063 | 77.8 mm | Mean slope, Insolation index (equinox noon, flat = 1), NDMI, dry-season mean | Temperature seasonality (SD × 100), Elevation, Growing season length |

The parcel's aridity index is 0.368 (UNEP class: semi-arid).

## Top transferable techniques

| Score | Technique | Source region | Constraints met | Evidence |
|---|---|---|---|---|
| 0.995 | Bed planting of irrigated wheat (furrow-irrigated raised beds) | Sonora (Costa de Hermosillo, Yaqui and Mayo valleys) | 100 % | 10.2134/agronj2000.922295x (doi_verified) |
| 0.995 | Permanent raised beds with crop-residue retention under furrow irrigation | Sonora (Costa de Hermosillo, Yaqui and Mayo valleys) | 100 % | 10.1007/s11104-010-0618-5 (doi_verified) |
| 0.995 | Optical-sensor (NDVI) based nitrogen top-dressing in irrigated wheat | Sonora (Costa de Hermosillo, Yaqui and Mayo valleys) | 100 % | 10.1017/S0021859607006995 (doi_verified_metadata) |
| 0.994 | Prosopis cineraria (khejri) parkland agroforestry with arable crops | Western Rajasthan | 100 % | 10.1016/j.jaridenv.2006.12.003 (doi_verified) |
| 0.994 | Pearl millet – legume (cluster bean, moth bean) rotation and intercropping | Western Rajasthan | 100 % | https://www.cazri.res.in/ (url_ok) |
| 0.994 | Tanka / kund: covered underground cisterns fed by a prepared catchment | Western Rajasthan | 100 % | not available (no_link) |
| 0.991 | Tree windbreaks (e.g. poplar rows) around irrigated plots | San Juan (Tulum, Ullum-Zonda valleys) | 100 % | 10.1023/B:AGFO.0000028990.31801.62 (doi_verified) |
| 0.990 | Inter-row cover crops in irrigated vineyards | Mendoza oases | 100 % | not available (no_link) |
| 0.987 | Alternate partial root-zone irrigation (PRD) | Xinjiang oases (Tarim and Junggar margins) | 100 % | 10.1093/jxb/erh249 (doi_verified) |
| 0.987 | Oasis farmland shelterbelt networks | Xinjiang oases (Tarim and Junggar margins) | 100 % | 10.1023/B:AGFO.0000028990.31801.62 (doi_verified) |

## Blocked techniques (27 of 65)

- **Khadin: runoff from a rocky catchment impounded behind an earthen bund, then cropped on residual moisture** (Western Rajasthan): Requires Aridity index (P / PET) ≤ 0.3; this parcel: 0.37; Requires Mean slope ≥ 0.3 °; this parcel: 0.27 °
- **Shelterbelts of drought-hardy trees against wind erosion and sand movement** (Western Rajasthan): Requires Sand, 0–30 cm ≥ 40 %; this parcel: 33 %
- **Conversion of furrow-irrigated vineyards to pressurised drip** (San Juan (Tulum, Ullum-Zonda valleys)): Requires Aridity index (P / PET) ≤ 0.3; this parcel: 0.37
- **Controlled deficit irrigation in red wine grapes** (Mendoza oases): Requires Min temperature of coldest month ≤ 8 °C; this parcel: 12 °C
- **Anti-hail netting over vineyards and orchards** (Mendoza oases): Requires Min temperature of coldest month ≤ 8 °C; this parcel: 12 °C; Requires Mean annual temperature ≤ 20 °C; this parcel: 25 °C
- **Drip irrigation under plastic film mulch for cotton** (Xinjiang oases (Tarim and Junggar margins)): Requires Aridity index (P / PET) ≤ 0.3; this parcel: 0.37; Requires Min temperature of coldest month ≤ 5 °C; this parcel: 12 °C
- **Pre-season (winter or spring) flood leaching of accumulated salts** (Xinjiang oases (Tarim and Junggar margins)): Requires Aridity index (P / PET) ≤ 0.3; this parcel: 0.37
- **Community check dams and well recharge (Saurashtra recharge movement)** (Gujarat (Kutch, Saurashtra)): Requires Precipitation seasonality (CV) ≥ 80 %; this parcel: 55 %
- **Tidal regulators, spreading channels and recharge to halt seawater ingress into coastal aquifers** (Gujarat (Kutch, Saurashtra)): Requires Elevation ≤ 100 m; this parcel: 133 m
- **Underground (subsurface) dams across alluvial valley floors** (Petrolina–Juazeiro (São Francisco valley)): Requires Precipitation seasonality (CV) ≥ 60 %; this parcel: 55 %
- **Fanya juu terraces (soil thrown uphill to build bench terraces over time)** (Kenya ASAL (Machakos, Makueni, Kitui, Laikipia)): Requires Mean slope ≥ 1 °; this parcel: 0.27 °
- **Sand dams across seasonal sandy riverbeds** (Kenya ASAL (Machakos, Makueni, Kitui, Laikipia)): Requires Precipitation seasonality (CV) ≥ 60 %; this parcel: 55 %
- **Fertilizer micro-dosing (small doses placed in the planting hole)** (West African Sahel (Yatenga, Maradi, Tahoua, Zinder)): Requires Soil organic carbon, 0–30 cm ≤ 15 g/kg; this parcel: 16 g/kg
- **Pearl millet – cowpea / groundnut rotation on sandy soils** (West African Sahel (Yatenga, Maradi, Tahoua, Zinder)): Requires Sand, 0–30 cm ≥ 40 %; this parcel: 33 %
- **Contour stone bunds (cordons pierreux)** (West African Sahel (Yatenga, Maradi, Tahoua, Zinder)): Requires Mean slope ≥ 0.3 °; this parcel: 0.27 °
- **Tree windbreaks against wind erosion on sandy Sahelian fields (e.g. Majjia Valley, Niger)** (West African Sahel (Yatenga, Maradi, Tahoua, Zinder)): Requires Sand, 0–30 cm ≥ 50 %; this parcel: 33 %
- **Area exclosures: degraded hillsides closed to grazing and cutting for regeneration** (Tigray highlands): Requires Mean slope ≥ 3 °; this parcel: 0.27 °
- **Stone bunds, check dams and percolation trenches at catchment scale** (Tigray highlands): Requires Mean slope ≥ 1 °; this parcel: 0.27 °
- **On-farm winter flood recharge (Flood-MAR) of groundwater on dormant fields** (Central Valley): Requires Precipitation seasonality (CV) ≥ 60 %; this parcel: 55 %
- **Gypsum application to improve infiltration in sodic or low-salinity-water-sealed soils** (Central Valley): Requires pH (H₂O), 0–30 cm between 7 and 9.5; this parcel: 6.88
- **Limans: small runoff-fed tree groves in wadi depressions** (Negev Desert): Requires Aridity index (P / PET) ≤ 0.3; this parcel: 0.37; Requires Mean slope ≥ 0.3 °; this parcel: 0.27 °
- **Runoff agriculture with microcatchments and contour-bounded runoff plots** (Negev Desert): Requires Aridity index (P / PET) ≤ 0.35; this parcel: 0.37; Requires Mean slope ≥ 0.5 °; this parcel: 0.27 °
- **Break-crop rotations (canola, pulses) in wheat sequences** (Mallee (Victoria / South Australia)): Requires Min temperature of coldest month ≤ 10 °C; this parcel: 12 °C
- **Clay spreading and delving on water-repellent sandy soils** (Mallee (Victoria / South Australia)): Requires Sand, 0–30 cm ≥ 70 %; this parcel: 33 %
- **Fog collectors (atrapanieblas) for water supply on coastal hills** (Norte Chico (Copiapó, Huasco, Elqui, Limarí)): Requires Aridity index (P / PET) ≤ 0.2; this parcel: 0.37
- **Drip irrigation of avocado and table grape planted on steep hillsides** (Norte Chico (Copiapó, Huasco, Elqui, Limarí)): Requires Mean slope ≥ 2 °; this parcel: 0.27 °
- **Quesungual slash-and-mulch agroforestry (no burning, pruned trees, permanent mulch)** (Lempira (Quesungual agroforestry)): Requires Annual precipitation ≥ 800 mm; this parcel: 685 mm; Requires Mean slope ≥ 2 °; this parcel: 0.27 °

## Missing data

None: all 24 dimensions were retrieved.

## Reading this result

- The percentile ranks resemblance within the reference grid. It does not measure how likely a technique is to work.
- Constraint checks use the parcel's own values; see METHODOLOGY.md §6 for what they cannot see (water source, capital, markets).
