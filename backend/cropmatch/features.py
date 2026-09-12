"""The 24-dimension biophysical feature vector."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Feature:
    key: str
    group: str
    label: str
    unit: str
    source: str


FEATURES: list[Feature] = [
    # Climate (7)
    Feature("mat", "climate", "Mean annual temperature", "°C", "WorldClim 2.1 BIO1"),
    Feature("temp_seasonality", "climate", "Temperature seasonality (SD × 100)", "°C×100", "WorldClim 2.1 BIO4"),
    Feature("tmax_warmest", "climate", "Max temperature of warmest month", "°C", "WorldClim 2.1 BIO5"),
    Feature("tmin_coldest", "climate", "Min temperature of coldest month", "°C", "WorldClim 2.1 BIO6"),
    Feature("annual_precip", "climate", "Annual precipitation", "mm", "WorldClim 2.1 BIO12"),
    Feature("precip_seasonality", "climate", "Precipitation seasonality (CV)", "%", "WorldClim 2.1 BIO15"),
    Feature("aridity_index", "climate", "Aridity index (P / PET)", "ratio",
            "WorldClim BIO12 / Hargreaves PET from WorldClim monthly Tmin, Tmax"),
    # Water (5)
    Feature("et_annual", "water", "Mean annual evapotranspiration", "mm/yr", "MODIS MOD16A3GF.061 ET_500m"),
    Feature("wue", "water", "Water use efficiency (GPP / ET)", "g C / kg H₂O",
            "MODIS MOD17A3HGF.061 GPP ÷ MOD16A3GF.061 ET"),
    Feature("ndwi_dry", "water", "NDWI, dry-season mean", "index", "Sentinel-2 L2A (B03, B08)"),
    Feature("ndmi_dry", "water", "NDMI, dry-season mean", "index", "Sentinel-2 L2A (B08, B11)"),
    Feature("s1_vv_dry", "water", "Sentinel-1 VV backscatter, dry-season mean", "dB", "Sentinel-1 IW GRD → RTC γ⁰ VV"),
    # Soil (7) — thickness-weighted 0–30 cm
    Feature("ph", "soil", "pH (H₂O), 0–30 cm", "pH", "ISRIC SoilGrids v2.0 phh2o"),
    Feature("soc", "soil", "Soil organic carbon, 0–30 cm", "g/kg", "ISRIC SoilGrids v2.0 soc"),
    Feature("clay", "soil", "Clay, 0–30 cm", "%", "ISRIC SoilGrids v2.0 clay"),
    Feature("sand", "soil", "Sand, 0–30 cm", "%", "ISRIC SoilGrids v2.0 sand"),
    Feature("cec", "soil", "Cation exchange capacity, 0–30 cm", "cmol(c)/kg", "ISRIC SoilGrids v2.0 cec"),
    Feature("bdod", "soil", "Bulk density, 0–30 cm", "kg/dm³", "ISRIC SoilGrids v2.0 bdod"),
    Feature("cfvo", "soil", "Coarse fragments, 0–30 cm", "vol %", "ISRIC SoilGrids v2.0 cfvo"),
    # Terrain (3)
    Feature("elevation", "terrain", "Elevation", "m", "Copernicus DEM GLO-90"),
    Feature("slope", "terrain", "Mean slope", "°", "Copernicus DEM GLO-90"),
    Feature("insolation", "terrain", "Insolation index (equinox noon, flat = 1)", "ratio", "Copernicus DEM GLO-90"),
    # Vegetation regime (2)
    Feature("ndvi_amplitude", "vegetation", "NDVI amplitude (peak − trough)", "index", "MODIS MOD13Q1.061"),
    Feature("growing_season_days", "vegetation", "Growing season length", "days", "MODIS MOD13Q1.061"),
]

FEATURE_KEYS = [f.key for f in FEATURES]
BY_KEY = {f.key: f for f in FEATURES}
GROUPS = ["climate", "water", "soil", "terrain", "vegetation"]
assert len(FEATURES) == 24


def as_dicts() -> list[dict]:
    return [f.__dict__.copy() for f in FEATURES]
