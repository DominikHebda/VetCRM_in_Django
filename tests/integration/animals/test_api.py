import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories.animals import AnimalFactory
from tests.factories.owners import OwnerFactory

pytestmark = [
    pytest.mark.integration,
    pytest.mark.api,
]


@pytest.fixture
def animal_list_url():
    return reverse("animal-list")


@pytest.fixture
def animal_detail_url(animal):
    return reverse("animal-detail", kwargs={"pk": animal.pk})


def test_unauthenticated_user_cannot_list_animals(
    api_client,
    animal_list_url,
):
    response = api_client.get(animal_list_url)

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_authenticated_user_can_list_animals(
    authenticated_client,
    animal_list_url,
):
    AnimalFactory.create_batch(3)

    response = authenticated_client.get(animal_list_url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 3
    assert len(response.data["results"]) == 3


def test_authenticated_user_can_retrieve_animal(
    authenticated_client,
    animal,
    animal_detail_url,
):
    response = authenticated_client.get(animal_detail_url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == animal.id
    assert response.data["name"] == animal.name


def test_authenticated_user_can_create_animal(
    authenticated_client,
    animal_list_url,
):
    owner = OwnerFactory()
    payload = {
        "owner": owner.pk,
        "name": "Rex",
        "species": "dog",
        "breed": "Labrador",
        "chip_number": "CHIP-12345678",
    }

    response = authenticated_client.post(
        animal_list_url,
        payload,
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["owner"] == owner.pk
    assert response.data["name"] == "Rex"


def test_create_rejects_invalid_species(
    authenticated_client,
    animal_list_url,
):
    owner = OwnerFactory()
    payload = {
        "owner": owner.pk,
        "name": "Rex",
        "species": "horse",
    }

    response = authenticated_client.post(
        animal_list_url,
        payload,
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "species" in response.data


def test_authenticated_user_can_update_animal(
    authenticated_client,
    animal,
    animal_detail_url,
):
    response = authenticated_client.patch(
        animal_detail_url,
        {"name": "Updated name"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK

    animal.refresh_from_db()

    assert animal.name == "Updated name"


def test_authenticated_user_can_delete_animal(
    authenticated_client,
    animal,
    animal_detail_url,
):
    response = authenticated_client.delete(animal_detail_url)

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not type(animal).objects.filter(pk=animal.pk).exists()


def test_animals_can_be_filtered_by_owner(
    authenticated_client,
    animal_list_url,
):
    owner = OwnerFactory()
    expected_animal = AnimalFactory(owner=owner)
    AnimalFactory()

    response = authenticated_client.get(
        animal_list_url,
        {"owner": owner.pk},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == expected_animal.pk


def test_animals_can_be_filtered_by_species(
    authenticated_client,
    animal_list_url,
):
    AnimalFactory(species="dog")
    AnimalFactory(species="cat")

    response = authenticated_client.get(
        animal_list_url,
        {"species": "cat"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["species"] == "cat"


def test_animals_can_be_searched_by_name(
    authenticated_client,
    animal_list_url,
):
    expected_animal = AnimalFactory(name="UniqueAnimalName")
    AnimalFactory(name="DifferentName")

    response = authenticated_client.get(
        animal_list_url,
        {"search": "UniqueAnimalName"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == expected_animal.pk


def test_animals_can_be_searched_by_chip_number(
    authenticated_client,
    animal_list_url,
):
    expected_animal = AnimalFactory(
        chip_number="UNIQUE-CHIP-123",
    )
    AnimalFactory(chip_number="OTHER-CHIP")

    response = authenticated_client.get(
        animal_list_url,
        {"search": "UNIQUE-CHIP-123"},
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == expected_animal.pk


def test_animals_can_be_ordered_by_name(
    authenticated_client,
    animal_list_url,
):
    AnimalFactory(name="Zulu")
    AnimalFactory(name="Alpha")

    response = authenticated_client.get(
        animal_list_url,
        {"ordering": "name"},
    )

    names = [
        result["name"]
        for result in response.data["results"]
    ]

    assert response.status_code == status.HTTP_200_OK
    assert names == ["Alpha", "Zulu"]


def test_animals_endpoint_is_paginated(
    authenticated_client,
    animal_list_url,
):
    AnimalFactory.create_batch(12)

    response = authenticated_client.get(animal_list_url)

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 12
    assert len(response.data["results"]) == 10
    assert response.data["next"] is not None