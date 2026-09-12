"""The offline demo must run from recorded fixtures alone: no network, no static rasters, no credentials."""

from __future__ import annotations

import socket

import pytest
from fastapi.testclient import TestClient

from cropmatch import config, geo, remote, vector


LOOPBACK = {"127.0.0.1", "::1", "localhost"}


@pytest.fixture
def no_network(monkeypatch):
    """Refuse every non-loopback connection (asyncio on Windows needs a loopback socketpair)."""
    real_connect = socket.socket.connect
    real_create = socket.create_connection

    def connect(self, addr, *a, **k):
        if isinstance(addr, tuple) and addr[0] not in LOOPBACK:
            raise OSError(f"network disabled in offline test: {addr}")
        return real_connect(self, addr, *a, **k)

    def create_connection(addr, *a, **k):
        if addr[0] not in LOOPBACK:
            raise OSError(f"network disabled in offline test: {addr}")
        return real_create(addr, *a, **k)

    monkeypatch.setattr(socket.socket, "connect", connect)
    monkeypatch.setattr(socket, "create_connection", create_connection)


@pytest.mark.parametrize("lat,lon", [(-22.5, -60.0), (18.8, -69.8), (18.5, -70.5)])
def test_fixture_parcels_replay_all_dimensions(no_network, lat, lon):
    poly = geo.circle(lat, lon, 2.0)
    with remote.io_context(remote.IOContext(mode="offline", replay_dirs=[vector.FIXTURE_RESPONSES])):
        vec = vector.compute(poly, kind="parcel")
    assert vec["n_available"] == 24, vec["missing"]
    assert all(e["mode"] in ("replay", "local") for e in vec["provenance"])


def test_unrecorded_parcel_degrades_with_reasons(no_network):
    poly = geo.circle(10.0, 10.0, 1.0)
    with remote.io_context(remote.IOContext(mode="offline", replay_dirs=[vector.FIXTURE_RESPONSES])):
        vec = vector.compute(poly, kind="parcel", profile_extras=False)
    assert vec["n_available"] == 0
    assert set(vec["missing"]) == set(vec["values"]), "every missing dimension must carry a reason"
    assert all(why for why in vec["missing"].values())
    assert "offline" in vec["missing"]["mat"]  # the first read that was never recorded says so


def test_api_offline_query_for_chaco(no_network, monkeypatch, tmp_path):
    monkeypatch.setattr(config, "DEMO_MODE", "offline")
    from cropmatch.api import app

    client = TestClient(app)
    assert client.get("/api/health").json()["status"] == "ok"
    r = client.post("/api/query", json={"fixture_id": "chaco-paraguayo"})
    assert r.status_code == 200, r.text
    res = r.json()
    assert res["status"] == "ok" and res["profile"]["n_available"] == 24
    assert res["match"]["analogs"], "expected at least one analog"
    for t in res["techniques"]["blocked"]:
        assert t["blocked_reasons"], "a blocked technique must state why"
    n = res["techniques"]["n_techniques"]
    assert len(res["techniques"]["ranked"]) + len(res["techniques"]["blocked"]) == n
    pdf = client.get(f"/api/results/{res['id']}/pdf")
    assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF"
