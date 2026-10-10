"""Postgres (Supabase) connection pool shared by the API routes.

DATABASE_URL must point at the Supabase *pooler* (IPv4). The direct
db.<ref>.supabase.co host is IPv6-only. On Vercel use the transaction pooler
(port 6543); locally either pooler port works. Prepared statements are
disabled so the transaction pooler is safe to use.
"""

import os
from collections.abc import Iterator
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

load_dotenv(Path(__file__).with_name(".env"))


@lru_cache
def get_pool() -> ConnectionPool:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set (see backend/.env)")
    return ConnectionPool(
        url,
        min_size=1,
        max_size=4,
        open=True,
        kwargs={"row_factory": dict_row, "prepare_threshold": None, "autocommit": True},
    )


def get_db() -> Iterator[Connection]:
    """FastAPI dependency: borrow a connection from the pool for one request."""
    with get_pool().connection() as conn:
        yield conn
