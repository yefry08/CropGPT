# Methodology

CropMatch does not predict what to plant. It asks a narrower question that can be answered with data: **which
places on Earth are biophysically most like this parcel, and which documented techniques from those places does
this parcel's own data not rule out?**

Pipeline: parcel → 24-dimension feature vector → z-scores against a global reference grid → weighted Mahalanobis
distance to every reference cell → best cell per innovation region → technique knowledge base, screened against
the parcel's own values → ranked and blocked techniques, with provenance.

## 1. Feature vector (24 dimensions)

Every dimension is computed with the same code for queried parcels and for reference-grid cells
(`backend/cropmatch/vector.py`). Parcel = polygon or circle (default radius 2 km). Cell = 0.25° box.

| # | Dimension | Unit | Source and computation |
|---|---|---|---|
| 1 | Mean annual temperature | °C | WorldClim 2.1 BIO1 (1970–2000), 10′, mean of pixels touching the area |
| 2 | Temperature seasonality | SD×100 | BIO4 |
| 3 | Max temp. of warmest month | °C | BIO5 |
| 4 | Min temp. of coldest month | °C | BIO6 |
| 5 | Annual precipitation | mm | BIO12 |
| 6 | Precipitation seasonality | CV % | BIO15 |
| 7 | Aridity index | P/PET | BIO12 ÷ annual PET; PET by Hargreaves–Samani from WorldClim monthly Tmin/Tmax and FAO-56 extraterrestrial radiation (`scripts/prepare_static.py`) |
| 8 | Mean annual ET | mm/yr | MODIS MOD16A3GF.061 `ET_500m`, 2021–2025 (years available), mean of valid pixel-years; fill values (barren, urban, water) excluded; missing if < 10 % of pixels are valid |
| 9 | Water-use efficiency | g C / kg H₂O | Σ GPP ÷ Σ ET over pixel-years where both MOD17A3HGF.061 `Gpp_500m` and MOD16A3GF are valid |
| 10 | NDWI, dry season | index | Sentinel-2 L2A, (B03−B08)/(B03+B08), mean of SCL-clear pixels (classes 4–7) over ≤ 2 scenes/year × 2024–2025 with < 20 % cloud, in the area's driest WorldClim quarter |
| 11 | NDMI, dry season | index | Same scenes, (B08−B11)/(B08+B11) |
| 12 | Sentinel-1 VV, dry season | dB | Sentinel-1 IW GRD → RTC γ⁰ (Planetary Computer), ≤ 4 scenes spread across the 2025 dry quarter, averaged in linear power, then 10·log₁₀ |
| 13–19 | pH, SOC, clay, sand, CEC, bulk density, coarse fragments | pH, g/kg, %, %, cmol(c)/kg, kg/dm³, vol % | ISRIC SoilGrids v2.0 mean, thickness-weighted over 0–5, 5–15 and 15–30 cm (weights 5:10:15). Parcels: REST point query at the centroid (250 m). Cells, and parcels where REST has no value: ISRIC's 5 km aggregates. |
| 20 | Elevation | m | Copernicus DEM GLO-90, mean |
| 21 | Mean slope | ° | GLO-90 at native 90 m (latitude-corrected pixel spacing), mean |
| 22 | Insolation index | ratio | Direct-beam irradiance on each pixel's slope at equinox solar noon ÷ that on flat ground at the same latitude; mean. 1 = flat |
| 23 | NDVI amplitude | index | MOD13Q1.061 250 m 16-day NDVI, 2023–2025, pixel reliability 0–1; per-composite medians across years form a 23-point climatology (≤ 5 missing periods circularly interpolated, otherwise missing); max − min |
| 24 | Growing-season length | days | Periods where the climatology ≥ min + 50 % of amplitude, × 16, capped at 365 |

Profile-only context (not in the vector): dominant ESA WorldCover 2021 (10 m) land-cover class and composition,
monthly precipitation, PET, the NDVI curve, and the scene lists.

**Caching.** Parcel vectors are cached on disk under `data/cache/vectors/<geohash7>_<shape-hash>.json`, and a
parcel's satellite reads are never repeated. **Audit.** Every read is logged (source, product ID, acquisition date,
processing level, URL, live/replay) to `data/cache/audit.jsonl` and into the result's `provenance`.

## 2. Reference grid

`data/reference_grid.parquet`: 2,000 land cells at 0.25°, built by `scripts/build_reference_grid.py`.

- **Innovation cells (924).** All land cells inside the bounding boxes of the 18 regions in
  `data/regions.json`, capped at 80 per region by seeded random sampling. The 16 regions come from the brief;
  Lempira (Honduras) and Tigray (Ethiopia) were added so humid and sub-humid parcels have documented innovation
  zones to match against.
- **Background cells (1,076).** A cos(latitude)-weighted random sample of all other land cells between 56° S
  and 72° N, so that z-scores, the covariance matrix and the percentiles describe global land, not only drylands.
- Per-cell provenance (scene and granule IDs) is in `data/reference_grid_provenance.jsonl.gz`.

## 3. Similarity

1. **Normalisation.** z = (x − μ) / σ, with μ and σ (sample SD) taken over the reference grid, ignoring missing
   values.
2. **Weights.** The brief's group weights are the defaults (water 0.30, soil 0.25, climate 0.25, terrain 0.10,
   vegetation 0.10) and can be changed in the UI and the API. Each group's weight is split evenly across its
   dimensions that are available for the parcel. If a group has no available dimension, its weight is
   redistributed proportionally to the other groups. The result reports the effective weights.
3. **Shared dimensions.** For each cell, only dimensions available for both parcel and cell are used (set D).
   Cells sharing fewer than 70 % of the parcel's dimensions are excluded and counted, never imputed.
4. **Distance.** With u = √w_D ⊙ (z_parcel − z_cell) on D and Σ_D the covariance of reference z-scores (pairwise
   complete) restricted to D:

   d² = uᵀ Σ_D⁻¹ u / Σ w_D

   If Σ_D is not positive definite or its condition number exceeds 10⁶, that cell falls back to weighted
   Euclidean distance, d² = Σ w δ² / Σ w. The method used is reported per analog.
5. **Similarity percentile.** The share of comparable reference cells that are farther from the parcel than the
   analog. 99.5 means "closer than 99.5 % of the grid". It is a rank within this grid, not an accuracy or a
   probability.
6. **Analogs.** The best cell in each innovation region, ranked by distance. The top 5 are returned, and the
   top 3 are drawn on the world map. For each analog the result gives per-dimension raw and z deltas, each
   dimension's contribution to d² (u_i · (Σ_D⁻¹u)_i / Σw), the 3 closest dimensions ("drivers") and the 3 largest
   contributions ("divergences").

**Weighting rationale.** Water availability is usually the binding constraint when transferring dryland
techniques, so the water group gets the largest share. Soil and climate set what is agronomically possible, and
terrain and vegetation regime modify it. These are the brief's defaults, set by judgement. They have not been
fitted to data, because no dataset of successful and failed technique transfers exists to fit them against.

## 4. Techniques and transferability

`data/techniques.json`: 65 entries, 18 regions, 10 categories. Each entry has a `requires` block of
screening constraints on parcel features (`<feature>_min`, `_max`, `_range`), the rationale for them, a
qualitative documented effect, a citation, and adaptation notes. `scripts/check_evidence.py` looks up every DOI
in Crossref and compares the registered title with the citation, fetches every other URL, and writes
`data/evidence_check.json`. The UI and the PDF show the result beside each citation. Entries with no verified
source say "not available" instead of describing an effect.

transferability = analog similarity × constraint satisfaction

- analog similarity = similarity percentile ÷ 100 of the best cell in the technique's source region;
- constraint satisfaction = constraints verified as met ÷ constraints declared. A constraint that can't be
  checked because the parcel lacks that dimension lowers the score and is listed as unverified.
- Any violated constraint **blocks** the technique: score 0 and the reason stated ("Requires aridity index ≤
  0.2; this parcel: 0.37"). Blocked techniques are returned and displayed, never dropped. A technique whose
  region has no comparable cell is also listed as blocked, with that reason.

## 5. Offline mode and graceful degradation

`backend/cropmatch/remote.py` is a record/replay layer. In live mode every STAC/REST response and every raster
window read is saved under the SHA-1 of the request. With `DEMO_MODE=offline` the identical request is answered
from `fixtures/responses/`, so offline results come from the same raw data and code as live ones.
`scripts/record_fixtures.py` checks that replay reproduces all 24 values exactly for the three fixture parcels.
When a source fails (outage, no clear scene, fill values), its dimensions are dropped with a stated reason, the
weights renormalise, and the result lists what is missing.

## 6. Limitations

1. **No ground truth.** Nothing here validates that biophysical similarity predicts whether a technique will
   succeed. The percentile ranks resemblance within this grid and nothing more.
2. **Constraints are screens, not agronomy.** The `requires` thresholds were written for this demo. They ignore
   what often decides transfer: water rights and source (groundwater depth, canal access, water quality),
   capital, markets, labour, tenure and institutions. Irrigation techniques in particular assume water the parcel
   may not have.
3. **The knowledge base is small and curated.** 65 entries from 18 regions. Effects are summarised
   qualitatively. The checker confirms that each DOI is the cited paper, not that the paper supports the
   summary. Several entries have no linked source and print "not available". Review everything with a local
   agronomist before acting.
4. **Scale mismatch.** A 2 km-radius parcel (about 12.6 km²) is compared with 0.25° cells (about 600–770 km²).
   WorldClim at 10′ (about 18 km) smooths mountain climates, which matters for San José de Ocoa. Parcel soils are
   a 250 m point value at the centroid, while cells use 5 km means. Slope depends on scale even though both use
   90 m DEM pixels.
5. **Source substitutions.** ET and WUE come from MODIS MOD16/MOD17, not ECOSTRESS. Sentinel data come from
   AWS/Planetary Computer mirrors, not Copernicus Data Space. PET is Hargreaves rather than Penman–Monteith, so
   aridity values differ from the CGIAR Global Aridity Index. GEDI, AIRS, ECOSTRESS and Landsat/VIIRS long-term
   series are not in the vector.
6. **Short observation windows.** 3 years of MODIS NDVI, up to 4 Sentinel-2 scenes (2024–2025) and up to 4
   Sentinel-1 scenes (2025 only). Ascending and descending passes are mixed, and incidence angle is not
   normalised, so VV carries geometry effects. The climate normals are 1970–2000 and predate recent warming.
7. **Desert gaps.** MOD16 has no ET over barren pixels, so many hyper-arid cells lack ET and WUE and are
   compared on fewer dimensions. Growing-season length is unstable when the NDVI amplitude is tiny or the regime
   is evergreen or bimodal.
8. **Grid composition shapes the answer.** z-scores and percentiles depend on which cells are in the grid, and
   the grid over-samples drylands. Regions with more cells (up to 80) get more chances to contain a close cell
   than regions with 4–20. Region bounding boxes are coarse and include land that is not farmed, and a cell's
   region tag says nothing about its actual land use.
9. **Covariance.** Σ is estimated from pairwise-complete data and may be non-positive-definite for some
   dimension subsets. The weighted-Euclidean fallback then ignores correlation for those cells.
10. **Land use is context, not a filter.** The parcel's WorldCover class is displayed but not matched, so a
    forested parcel can match a cropped oasis cell.
