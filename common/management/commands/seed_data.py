from django.core.management.base import BaseCommand
from django.db import transaction

from common.management.seeders.owners import seed_owners
from owners.models import Owner


class Command(BaseCommand):
    help = "Populate the database with development data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing development data before seeding.",
        )
        parser.add_argument(
            "--owners",
            type=int,
            default=10,
            help="Number of owners to create.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Removing existing owners...")
            Owner.objects.all().delete()

        self.stdout.write("Creating owners...")

        owners = seed_owners(count=options["owners"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(owners)} owners."
            )
        )