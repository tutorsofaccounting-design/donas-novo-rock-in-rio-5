"""Seed events into MongoDB once (auto-seed was disabled in server startup)."""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# Make backend importable
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from server import seed_db  # noqa: E402


async def main():
    await seed_db()
    print("Events seeded.")


if __name__ == "__main__":
    asyncio.run(main())
