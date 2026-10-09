"""Create a Neon database archive without changing Django's DATABASE_URL."""

import os
import shutil
import subprocess
from datetime import datetime
from getpass import getpass
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a custom-format backup using a direct Neon connection."
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument("--host", required=True)
        parser.add_argument("--user", required=True)
        parser.add_argument("--database", default="neondb")
        parser.add_argument("--output-dir", default=str(Path.home() / "VetCRM-backups"))

    def handle(self, *args, **options):
        host = options["host"].strip().lower()
        user = options["user"].strip()
        database = options["database"].strip()
        if not host.endswith(".neon.tech") or "-pooler" in host:
            raise CommandError(
                "Use a direct Neon host ending in .neon.tech (no -pooler)."
            )
        for value in (host, user, database):
            if not value or not all(c.isalnum() or c in "._-" for c in value):
                raise CommandError("Host, user and database must be plain identifiers.")
        executable = shutil.which("pg_dump")
        if not executable:
            raise CommandError("pg_dump was not found in PATH.")

        output_dir = Path(options["output_dir"]).expanduser().resolve()
        project_dir = Path(settings.BASE_DIR).resolve()
        if output_dir == project_dir or project_dir in output_dir.parents:
            raise CommandError("Save backups outside the project directory.")
        try:
            output_dir.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise CommandError("Cannot create the backup directory.") from exc

        archive = output_dir / (
            f"vetcrm-neon-{datetime.now():%Y%m%d-%H%M%S}-{uuid4().hex[:8]}.dump"
        )
        partial = archive.with_suffix(".dump.partial")
        self.stdout.write(f"Source: {host}:5432 / {database} / {user}")
        password = getpass("Neon password (hidden): ")
        if not password:
            raise CommandError("Password cannot be empty.")
        env = os.environ.copy()
        env["PGPASSWORD"] = password
        connection = (
            f"host={host} port=5432 dbname={database} user={user} "
            "sslmode=require channel_binding=require connect_timeout=30"
        )
        try:
            result = subprocess.run(
                [
                    executable,
                    f"--dbname={connection}",
                    "--no-password",
                    "--format=custom",
                    f"--file={partial}",
                ],
                env=env,
                check=False,
            )
            if result.returncode != 0:
                raise CommandError(
                    f"pg_dump failed with exit code {result.returncode}."
                )
            if not partial.is_file() or partial.stat().st_size == 0:
                raise CommandError("pg_dump did not produce a nonempty archive.")
            partial.replace(archive)
        except OSError as exc:
            raise CommandError("Cannot run pg_dump or save the archive.") from exc
        finally:
            env.pop("PGPASSWORD", None)
            if partial.exists():
                partial.unlink()
        self.stdout.write(self.style.SUCCESS(f"Backup saved: {archive}"))
        self.stdout.write(f"Size: {archive.stat().st_size} bytes")
