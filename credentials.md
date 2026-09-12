# Credentials

**You need none of these to run the demo.**

- `make demo` (offline) replays recorded responses in `fixtures/responses/` and never touches the network.
- `make demo-live` works for any parcel without credentials, because every connector in this version uses a
  no-auth access path:

  | Data | Access path used | Account needed |
  |---|---|---|
  | Sentinel-2 L2A | Element84 Earth Search STAC (AWS Open Data COGs) | no |
  | Sentinel-1 RTC | Microsoft Planetary Computer (anonymous SAS token) | no |
  | MODIS MOD13Q1, MOD16A3GF, MOD17A3HGF, MCD12Q1 | Microsoft Planetary Computer | no |
  | Copernicus DEM GLO-90 | AWS Open Data bucket `copernicus-dem-90m` | no |
  | ISRIC SoilGrids v2.0 | REST API + 5 km aggregates on files.isric.org | no |
  | WorldClim v2.1 | GeoTIFF download from geodata.ucdavis.edu | no |

The variables below are read into `backend/cropmatch/config.py`, but **no connector in this version consumes
them yet**. They are the access paths the project brief names, and they're needed for the Tier-2 upgrade
(ECOSTRESS, GEDI, AIRS) and for moving Sentinel/MODIS reads onto the official services. Put them in `.env` (see
`.env.example`), never in code.

---

## Copernicus Data Space Ecosystem: `CDSE_CLIENT_ID`, `CDSE_CLIENT_SECRET`

For Sentinel-1/2 and Landsat via the CDSE STAC catalogue (`https://catalogue.dataspace.copernicus.eu/stac`) and
openEO (`https://openeo.dataspace.copernicus.eu`).

1. Register a free account at <https://dataspace.copernicus.eu/> ("Login" → "Register").
2. Sign in to the Sentinel Hub dashboard at <https://shapps.dataspace.copernicus.eu/dashboard/>, open
   **User settings → OAuth clients**, and create a client. Copy the client ID and the secret. The secret is
   shown only once.
3. Tokens use the OAuth2 client-credentials flow:

   ```bash
   curl -s -X POST https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token \
     -d grant_type=client_credentials -d client_id=$CDSE_CLIENT_ID -d client_secret=$CDSE_CLIENT_SECRET
   ```

   Access tokens are short-lived (minutes). A connector must refresh them, not store them.

## NASA Earthdata Login: `EARTHDATA_TOKEN`

For AppEEARS (`https://appeears.earthdatacloud.nasa.gov/api/`), ECOSTRESS, GEDI (ORNL DAAC), AIRS (GES DISC
OPeNDAP) and CMR-STAC.

1. Register at <https://urs.earthdata.nasa.gov/users/new>.
2. In your profile, open **Generate Token** and create a bearer token. Tokens expire after about 60 days.
3. Under **Applications → Authorized Apps**, approve the data centres you'll use (e.g. *LP DAAC Data Pool*,
   *NASA GESDISC DATA ARCHIVE*, *ORNL DAAC*). Downloads fail with 401/403 until each is approved.
4. Send it as `Authorization: Bearer $EARTHDATA_TOKEN`.

## USGS Machine-to-Machine API: `USGS_TOKEN`

For Landsat Collection 2 via `https://m2m.cr.usgs.gov/api/api/json/stable/`. The same Landsat scenes are also in
Copernicus Data Space and on AWS/Planetary Computer.

1. Create an EROS Registration System account at <https://ers.cr.usgs.gov/register>.
2. Request M2M access from your ERS profile (**Access Request → Machine to Machine**). USGS approves it by hand,
   usually within a few working days.
3. Generate an application token in the ERS profile. Exchange it for an API key with the `login-token`
   endpoint (`{"username": ..., "token": $USGS_TOKEN}`) and pass the key as the `X-Auth-Token` header.

## SoilGrids and WorldClim

No authentication. SoilGrids REST is subject to a fair-use rate limit (about 5 requests per minute). The
pipeline makes one request per parcel, and bulk work (the reference grid) reads the 5 km aggregate files instead.
