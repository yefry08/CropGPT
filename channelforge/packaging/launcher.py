"""PyInstaller entry point: both executables (GUI and console CLI) start here."""
import multiprocessing
import sys

from channelforge.__main__ import main

if __name__ == "__main__":
    multiprocessing.freeze_support()
    sys.exit(main())
