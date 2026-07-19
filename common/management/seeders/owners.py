from faker import Faker

from owners.models import Owner

fake = Faker("pl_PL")


def seed_owners(count: int = 10) -> list[Owner]:
    owners = []

    for _ in range(count):
        owner = Owner.objects.create(
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            email=fake.unique.email(),
            phone=fake.phone_number(),
            address=fake.address(),
        )
        owners.append(owner)

    return owners