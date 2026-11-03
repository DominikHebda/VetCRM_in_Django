from unittest.mock import patch

import pytest
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError


@pytest.mark.parametrize(
    ("e2e_mode", "engine", "use_expected_path"),
    [
        (False, "django.db.backends.sqlite3", True),
        (True, "django.db.backends.postgresql", True),
        (True, "django.db.backends.sqlite3", False),
    ],
    ids=[
        "outside-e2e-mode",
        "non-sqlite-database",
        "wrong-database-path",
    ],
)
def test_seed_reset_rejects_unsafe_database(
    monkeypatch,
    e2e_mode,
    engine,
    use_expected_path,
):
    database_path = settings.BASE_DIR / ".e2e" / "db.sqlite3"

    if not use_expected_path:
        database_path = settings.BASE_DIR / "other.sqlite3"

    monkeypatch.setattr(settings, "E2E_MODE", e2e_mode, raising=False)
    monkeypatch.setattr(
        settings,
        "DATABASES",
        {
            "default": {
                "ENGINE": engine,
                "NAME": database_path,
            },
        },
    )

    with patch(
        "common.management.commands.seed_e2e.call_command"
    ) as run_command:
        with pytest.raises(
            CommandError,
            match="dedicated .e2e/db.sqlite3 database",
        ):
            call_command("seed_e2e", reset=True)

    run_command.assert_not_called()