import io
import subprocess
import tempfile
from pathlib import Path
from unittest import TestCase
from unittest.mock import MagicMock, patch

from django.core.management.base import CommandError
from django.test import override_settings

from common.management.commands.backup_neon import Command as BackupCommand
from common.management.commands.backup_test import Command as RestoreCommand


class BackupCommandTests(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        self.project = root / "project"
        self.output = root / "backups"
        self.command = BackupCommand(stdout=io.StringIO())
        self.options = {
            "host": "ep-example.us-west-2.aws.neon.tech",
            "user": "neondb_owner",
            "database": "neondb",
            "output_dir": str(self.output),
        }
        self.settings = override_settings(BASE_DIR=self.project)
        self.settings.enable()
        self.addCleanup(self.settings.disable)

    def test_pooled_or_non_neon_host_is_rejected_before_password_prompt(self):
        for host in (
            "ep-example-pooler.neon.tech",
            "localhost",
            "neon.tech.attacker.test",
        ):
            with (
                self.subTest(host=host),
                patch("common.management.commands.backup_neon.getpass") as password,
            ):
                with self.assertRaises(CommandError):
                    self.command.handle(**{**self.options, "host": host})
                password.assert_not_called()

    @patch(
        "common.management.commands.backup_neon.shutil.which", return_value="pg_dump"
    )
    def test_backup_inside_project_is_rejected(self, _which):
        with self.assertRaises(CommandError):
            self.command.handle(
                **{**self.options, "output_dir": str(self.project / "data")}
            )

    @patch(
        "common.management.commands.backup_neon.getpass",
        return_value="private-password",
    )
    @patch(
        "common.management.commands.backup_neon.shutil.which", return_value="pg_dump"
    )
    def test_failed_export_removes_partial_file(self, _which, _password):
        def fail(argv, **kwargs):
            file_arg = next(arg for arg in argv if arg.startswith("--file="))
            Path(file_arg.removeprefix("--file=")).write_bytes(b"partial")
            return subprocess.CompletedProcess(argv, 1)

        with (
            patch(
                "common.management.commands.backup_neon.subprocess.run",
                side_effect=fail,
            ),
            self.assertRaises(CommandError),
        ):
            self.command.handle(**self.options)
        self.assertEqual(list(self.output.iterdir()), [])

    @patch(
        "common.management.commands.backup_neon.getpass",
        return_value="private-password",
    )
    @patch(
        "common.management.commands.backup_neon.shutil.which", return_value="pg_dump"
    )
    def test_success_publishes_archive_without_password_in_arguments(
        self, _which, _password
    ):
        def succeed(argv, **kwargs):
            self.assertNotIn("private-password", " ".join(argv))
            self.assertEqual(kwargs["env"]["PGPASSWORD"], "private-password")
            file_arg = next(arg for arg in argv if arg.startswith("--file="))
            Path(file_arg.removeprefix("--file=")).write_bytes(b"PGDMP-test")
            return subprocess.CompletedProcess(argv, 0)

        with patch(
            "common.management.commands.backup_neon.subprocess.run", side_effect=succeed
        ):
            self.command.handle(**self.options)
        self.assertEqual(len(list(self.output.glob("*.dump"))), 1)
        self.assertFalse(list(self.output.glob("*.partial")))
        self.assertNotIn("private-password", self.command.stdout.getvalue())


class RestoreCommandTests(TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.archive = Path(self.temp.name) / "archive.dump"
        self.archive.write_bytes(b"PGDMP-test")
        self.db = {
            "ENGINE": "django.db.backends.postgresql",
            "HOST": "localhost",
            "PORT": "5432",
            "NAME": "vetcrm_db",
            "USER": "vetcrm_user",
            "PASSWORD": "local-password",
        }
        self.command = RestoreCommand(stdout=io.StringIO())
        self.options = {
            "archive": str(self.archive),
            "database": "vetcrm_restore_check",
        }
        self.settings = override_settings(DATABASES={"default": self.db})
        self.settings.enable()
        self.addCleanup(self.settings.disable)

    @patch("common.management.commands.backup_test.psycopg2.connect")
    def test_remote_host_is_rejected_before_any_connection(self, connect):
        with (
            override_settings(
                DATABASES={"default": {**self.db, "HOST": "ep-demo.neon.tech"}}
            ),
            self.assertRaises(CommandError),
        ):
            self.command.handle(**self.options)
        connect.assert_not_called()

    @patch("common.management.commands.backup_test.psycopg2.connect")
    def test_unsafe_target_name_is_rejected(self, connect):
        for name in (
            "vetcrm_db",
            "neondb",
            "vetcrm_restore_check;DROP",
            "vetcrm_restore_",
        ):
            with self.subTest(name=name), self.assertRaises(CommandError):
                self.command.handle(**{**self.options, "database": name})
        connect.assert_not_called()

    @patch("common.management.commands.backup_test.psycopg2.connect")
    def test_active_database_is_rejected_even_with_test_prefix(self, connect):
        with (
            override_settings(
                DATABASES={"default": {**self.db, "NAME": "vetcrm_restore_check"}}
            ),
            self.assertRaises(CommandError),
        ):
            self.command.handle(**self.options)
        connect.assert_not_called()

    @patch(
        "common.management.commands.backup_test.shutil.which",
        return_value="pg_restore",
    )
    @patch("common.management.commands.backup_test.psycopg2.connect")
    @patch("common.management.commands.backup_test.subprocess.run")
    def test_invalid_archive_does_not_create_database(self, run, connect, _which):
        run.return_value = subprocess.CompletedProcess([], 1)
        with self.assertRaises(CommandError):
            self.command.handle(**self.options)
        connect.assert_not_called()

    @patch(
        "common.management.commands.backup_test.shutil.which",
        return_value="pg_restore",
    )
    @patch("common.management.commands.backup_test.psycopg2.connect")
    @patch("common.management.commands.backup_test.subprocess.run")
    def test_existing_database_is_not_modified(self, run, connect, _which):
        run.return_value = subprocess.CompletedProcess([], 0)
        admin = connect.return_value
        cursor = admin.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = (1,)
        with self.assertRaises(CommandError):
            self.command.handle(**self.options)
        self.assertEqual(cursor.execute.call_count, 1)
        self.assertEqual(run.call_count, 1)
        admin.close.assert_called_once()

    @patch(
        "common.management.commands.backup_test.shutil.which",
        return_value="pg_restore",
    )
    @patch("common.management.commands.backup_test.psycopg2.connect")
    @patch("common.management.commands.backup_test.subprocess.run")
    def test_restore_failure_stops_before_data_check(self, run, connect, _which):
        run.side_effect = [
            subprocess.CompletedProcess([], 0),
            subprocess.CompletedProcess([], 1),
        ]
        admin = connect.return_value
        cursor = admin.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = None
        with self.assertRaises(CommandError):
            self.command.handle(**self.options)
        self.assertEqual(connect.call_count, 1)
        restore_args = run.call_args.args[0]
        self.assertIn("--single-transaction", restore_args)
        self.assertIn("--no-owner", restore_args)
        self.assertIn("--no-privileges", restore_args)

    @patch(
        "common.management.commands.backup_test.shutil.which",
        return_value="pg_restore",
    )
    @patch("common.management.commands.backup_test.psycopg2.connect")
    @patch("common.management.commands.backup_test.subprocess.run")
    def test_success_reads_counts_from_target_database(self, run, connect, _which):
        run.return_value = subprocess.CompletedProcess([], 0)
        admin = MagicMock()
        admin.cursor.return_value.__enter__.return_value.fetchone.return_value = None
        restored = MagicMock()
        cursor = (
            restored.__enter__.return_value.cursor.return_value.__enter__.return_value
        )
        cursor.fetchall.return_value = [("visits_visit",)]
        cursor.fetchone.return_value = (5,)
        connect.side_effect = [admin, restored]
        self.command.handle(**self.options)
        self.assertEqual(connect.call_args.kwargs["dbname"], "vetcrm_restore_check")
        self.assertIn("visits_visit: 5", self.command.stdout.getvalue())
        self.assertNotIn("local-password", self.command.stdout.getvalue())
