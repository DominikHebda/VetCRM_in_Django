"""Restore a trusted archive into a new local test database."""

import os
import re
import shutil
import subprocess
from pathlib import Path

import psycopg2
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from psycopg2 import sql


class Command(BaseCommand):
    help = "Restore a backup into a new local vetcrm_restore_* database."
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument("archive")
        parser.add_argument("--database", required=True)

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        host = str(db.get("HOST", "")).strip()
        port = str(db.get("PORT") or "5432")
        target = options["database"]
        if db.get("ENGINE") != "django.db.backends.postgresql":
            raise CommandError("The default Django database must use PostgreSQL.")
        if host not in {"localhost", "127.0.0.1", "::1"}:
            raise CommandError(
                "Restore is allowed only with local Django database settings."
            )
        if not re.fullmatch(r"vetcrm_restore_[a-z0-9_]+", target) or len(target) > 63:
            raise CommandError(
                "Use a database name such as vetcrm_restore_check_20261009."
            )
        if target == db.get("NAME"):
            raise CommandError("The target must differ from Django's active database.")
        executable = shutil.which("pg_restore")
        if not executable:
            raise CommandError("pg_restore was not found in PATH.")
        archive = Path(options["archive"]).expanduser().resolve()
        if not archive.is_file():
            raise CommandError("The archive file does not exist.")

        try:
            probe = subprocess.run(
                [executable, "--list", str(archive)],
                stdout=subprocess.DEVNULL,
                check=False,
            )
        except OSError as exc:
            raise CommandError("Cannot run pg_restore.") from exc
        if probe.returncode:
            raise CommandError("pg_restore cannot read this archive.")

        credentials = {
            "host": host,
            "port": port,
            "user": db.get("USER", ""),
            "password": db.get("PASSWORD", ""),
            "connect_timeout": 10,
        }
        self.stdout.write(f"Target: {host}:{port} / {target}")
        try:
            admin = psycopg2.connect(dbname=db["NAME"], **credentials)
            try:
                admin.autocommit = True
                with admin.cursor() as cursor:
                    cursor.execute(
                        "SELECT 1 FROM pg_database WHERE datname = %s", [target]
                    )
                    if cursor.fetchone():
                        raise CommandError("Target already exists. Choose a new name.")
                    cursor.execute(
                        sql.SQL("CREATE DATABASE {} TEMPLATE template0").format(
                            sql.Identifier(target)
                        )
                    )
            finally:
                admin.close()
        except psycopg2.Error as exc:
            raise CommandError(
                "Cannot create the test database. "
                "Check local credentials and CREATEDB rights."
            ) from exc

        env = os.environ.copy()
        env["PGPASSWORD"] = credentials["password"]
        try:
            result = subprocess.run(
                [
                    executable,
                    f"--host={host}",
                    f"--port={port}",
                    f"--username={credentials['user']}",
                    f"--dbname={target}",
                    "--no-password",
                    "--no-owner",
                    "--no-privileges",
                    "--single-transaction",
                    str(archive),
                ],
                env=env,
                check=False,
            )
        except OSError as exc:
            raise CommandError(
                f"Cannot run restore. Test database {target} was created."
            ) from exc
        finally:
            env.pop("PGPASSWORD", None)
        if result.returncode:
            raise CommandError(
                f"Restore failed with exit code {result.returncode}. "
                f"The new database {target} remains; use a new name for a retry."
            )

        try:
            with (
                psycopg2.connect(dbname=target, **credentials) as conn,
                conn.cursor() as cursor,
            ):
                cursor.execute(
                    "SELECT tablename FROM pg_tables "
                    "WHERE schemaname = %s ORDER BY tablename",
                    ["public"],
                )
                tables = [row[0] for row in cursor.fetchall()]
                if not tables:
                    raise CommandError(
                        "Restore finished but no public tables were found."
                    )
                self.stdout.write(f"Tables: {len(tables)}")
                for table in tables:
                    cursor.execute(
                        sql.SQL("SELECT COUNT(*) FROM public.{}").format(
                            sql.Identifier(table)
                        )
                    )
                    self.stdout.write(f"{table}: {cursor.fetchone()[0]}")
        except psycopg2.Error as exc:
            raise CommandError("Restore finished, but the data check failed.") from exc
        self.stdout.write(
            self.style.SUCCESS(f"Restore and data check completed: {target}")
        )
