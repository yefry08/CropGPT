"""ChannelForge entry point.

  channelforge                       launch the desktop app
  channelforge --demo                launch against local mock gateways (no keys, no spend)
  channelforge omniroute status      is the local OmniRoute gateway up?
  channelforge omniroute connect     password -> scoped access token, stored in the keyring
  channelforge omniroute verify      list the models your inference key can see (quick start step 4)
  channelforge omniroute setup       build the Claude combo from connected models; adjust routing
  channelforge secrets set NAME      store a key in the OS keyring (prompted, not echoed)
"""

from __future__ import annotations

import argparse
import getpass
import logging
import logging.handlers
import sys

from . import secrets
from .config import AppConfig, app_home
from .db import JobDB


def setup_logging() -> None:
    logdir = app_home() / "logs"
    logdir.mkdir(exist_ok=True)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    fh = logging.handlers.RotatingFileHandler(logdir / "channelforge.log", maxBytes=5_000_000, backupCount=5,
                                              encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
    sh = logging.StreamHandler()
    sh.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
    root.addHandler(fh)
    root.addHandler(sh)
    secrets.install_redaction(root)
    logging.getLogger("httpx").setLevel(logging.WARNING)   # httpx logs full URLs at INFO


def run_gui(demo: bool) -> int:
    from PySide6.QtWidgets import QApplication

    from .jobs.runner import JobRunner
    from .ui.main_window import MainWindow

    cfg = AppConfig.load()
    app = QApplication(sys.argv)
    app.setApplicationName("ChannelForge")
    if demo:
        import tempfile
        from .devtools import demo as demo_mod
        db = JobDB(__import__("pathlib").Path(tempfile.mkdtemp(prefix="channelforge-demo-db-")) / "jobs.db")
        cfg, sup, servers = demo_mod.prepare(cfg, db)
        from .jobs.channels import SMOKE_RECIPES
        runner = JobRunner(cfg, db, supervisor=sup, recipes=SMOKE_RECIPES)
    else:
        db = JobDB(app_home() / "jobs.db")
        runner = JobRunner(cfg, db)
    runner.start()
    win = MainWindow(cfg, db, runner, demo=demo)
    win.show()
    return app.exec()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="channelforge")
    p.add_argument("--demo", action="store_true", help="run against local mock gateways")
    sub = p.add_subparsers(dest="cmd")
    o = sub.add_parser("omniroute")
    o.add_argument("action", choices=["status", "start", "connect", "verify", "setup", "combos"])
    s = sub.add_parser("secrets")
    s.add_argument("action", choices=["set", "delete", "list"])
    s.add_argument("name", nargs="?")
    args = p.parse_args(argv)
    setup_logging()

    if args.cmd == "omniroute":
        from .router import omniroute
        cfg = AppConfig.load()
        if args.action == "status":
            up = omniroute.is_up(cfg.router)
            print(f"OmniRoute {cfg.router.omniroute_url}: {'up' if up else 'DOWN'}")
            return 0 if up else 1
        if args.action == "start":
            ok = omniroute.ensure_up(cfg.router.model_copy(update={"omniroute_autostart": True}))
            print("OmniRoute is up" if ok else "could not start OmniRoute")
            return 0 if ok else 1
        if args.action == "connect":
            print(omniroute.connect(cfg.router, getpass.getpass("OmniRoute dashboard password: ")))
            return 0
        if args.action == "verify":
            for line in omniroute.verify(cfg.router):
                print(line)
            return 0
        if args.action == "combos":
            import json
            print(json.dumps(omniroute.combo_payloads(cfg.router), indent=2))
            return 0
        for line in omniroute.setup_combos(cfg.router):
            print(line)
        cfg.save()
        return 0
    if args.cmd == "secrets":
        if args.action == "list":
            for n in secrets.KNOWN_SECRETS:
                print(f"{n:28s} {'set' if secrets.has_secret(n) else '-'}")
            return 0
        if not args.name:
            p.error("secret name required")
        if args.action == "delete":
            secrets.delete_secret(args.name)
        else:
            secrets.set_secret(args.name, getpass.getpass(f"{args.name}: "))
        return 0
    return run_gui(args.demo)


if __name__ == "__main__":
    sys.exit(main())
