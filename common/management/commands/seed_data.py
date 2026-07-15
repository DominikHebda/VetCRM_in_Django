from django.core.management.base import BaseCommand

from common.management.seeders.owners import seed_owners
from owners.models import Owner

Owner.objects.all().delete()

class Command(BaseCommand):

    help = "Populate the database with development data."

    def handle(self, *args, **options):

        self.stdout.write("Creating owners...")

        seed_owners()

        self.stdout.write(
            self.style.SUCCESS(
                "Development data generated successfully."
            )
        )