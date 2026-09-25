#!/usr/bin/env python3
"""Convenience runner for the Direct Mode suite on Windows workstations.

Equivalent to: pytest tests/direct/ -v
Keeps a printable summary so non-Python teammates can run it from a shell.
"""

import subprocess
import sys


def main() -> int:
    command = [sys.executable, "-m", "pytest", "tests/direct/", "-v", "--tb=short"]
    print("running:", " ".join(command))
    result = subprocess.run(command)
    if result.returncode == 0:
        print("\nAll Direct Mode checks passed.")
    else:
        print("\nDirect Mode checks failed; see the case output above.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
