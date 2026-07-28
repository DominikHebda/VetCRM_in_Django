import pytest
from django.urls import reverse
from rest_framework import status

from owners.models import Owner
from tests.factories.owners import OwnerFactory


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerApiAuthentication:
    def test_anonymous_user_cannot_list_owners(self, api_client):
        response = api_client.get(reverse("owner-list"))

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_user_can_list_owners(
        self,
        authenticated_client,
    ):
        response = authenticated_client.get(reverse("owner-list"))

        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerListApi:
    def test_returns_paginated_owner_list(
        self,
        authenticated_client,
    ):
        OwnerFactory.create_batch(3)

        response = authenticated_client.get(reverse("owner-list"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
        assert len(response.data["results"]) == 3
        assert "next" in response.data
        assert "previous" in response.data

    def test_default_page_size_is_ten(
        self,
        authenticated_client,
    ):
        OwnerFactory.create_batch(12)

        response = authenticated_client.get(reverse("owner-list"))

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 12
        assert len(response.data["results"]) == 10
        assert response.data["next"] is not None

    def test_page_size_can_be_changed(
        self,
        authenticated_client,
    ):
        OwnerFactory.create_batch(8)

        response = authenticated_client.get(
            reverse("owner-list"),
            {"page_size": 5},
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 5


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerRetrieveApi:
    def test_returns_owner_details(
        self,
        authenticated_client,
    ):
        owner = OwnerFactory(
            first_name="Anna",
            last_name="Kowalska",
        )

        response = authenticated_client.get(
            reverse(
                "owner-detail",
                kwargs={"pk": owner.pk},
            )
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == owner.pk
        assert response.data["first_name"] == "Anna"
        assert response.data["last_name"] == "Kowalska"

    def test_returns_not_found_for_unknown_owner(
        self,
        authenticated_client,
    ):
        response = authenticated_client.get(
            reverse(
                "owner-detail",
                kwargs={"pk": 999999},
            )
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerCreateApi:
    def test_creates_owner(
        self,
        authenticated_client,
    ):
        payload = {
            "first_name": "Jan",
            "last_name": "Nowak",
            "email": "jan.nowak@example.com",
            "phone": "+48123123123",
            "address": "Warszawa",
        }

        response = authenticated_client.post(
            reverse("owner-list"),
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Owner.objects.count() == 1

        owner = Owner.objects.get()

        assert owner.first_name == "Jan"
        assert owner.last_name == "Nowak"
        assert owner.email == "jan.nowak@example.com"

    def test_rejects_invalid_email(
        self,
        authenticated_client,
    ):
        payload = {
            "first_name": "Jan",
            "last_name": "Nowak",
            "email": "invalid-email",
        }

        response = authenticated_client.post(
            reverse("owner-list"),
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data

    def test_rejects_duplicate_email(
        self,
        authenticated_client,
    ):
        OwnerFactory(email="duplicate@example.com")

        payload = {
            "first_name": "Jan",
            "last_name": "Nowak",
            "email": "duplicate@example.com",
        }

        response = authenticated_client.post(
            reverse("owner-list"),
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "email" in response.data


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerUpdateApi:
    def test_updates_entire_owner(
        self,
        authenticated_client,
    ):
        owner = OwnerFactory(
            first_name="Old",
            last_name="Name",
            email="old@example.com",
        )

        payload = {
            "first_name": "New",
            "last_name": "Owner",
            "email": "new@example.com",
            "phone": "+48999999999",
            "address": "Gdańsk",
        }

        response = authenticated_client.put(
            reverse(
                "owner-detail",
                kwargs={"pk": owner.pk},
            ),
            payload,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        owner.refresh_from_db()

        assert owner.first_name == "New"
        assert owner.last_name == "Owner"
        assert owner.email == "new@example.com"

    def test_partially_updates_owner(
        self,
        authenticated_client,
    ):
        owner = OwnerFactory(
            first_name="Anna",
            last_name="Nowak",
        )

        response = authenticated_client.patch(
            reverse(
                "owner-detail",
                kwargs={"pk": owner.pk},
            ),
            {"first_name": "Joanna"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

        owner.refresh_from_db()

        assert owner.first_name == "Joanna"
        assert owner.last_name == "Nowak"


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerDeleteApi:
    def test_deletes_owner(
        self,
        authenticated_client,
    ):
        owner = OwnerFactory()

        response = authenticated_client.delete(
            reverse(
                "owner-detail",
                kwargs={"pk": owner.pk},
            )
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Owner.objects.filter(pk=owner.pk).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerFilteringApi:
    def test_filters_by_email(
        self,
        authenticated_client,
    ):
        expected_owner = OwnerFactory(
            email="searched@example.com",
        )
        OwnerFactory(email="other@example.com")

        response = authenticated_client.get(
            reverse("owner-list"),
            {"email": "searched@example.com"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == expected_owner.pk

    def test_searches_by_first_name(
        self,
        authenticated_client,
    ):
        expected_owner = OwnerFactory(
            first_name="Dominik",
            last_name="Kowalski",
        )
        OwnerFactory(
            first_name="Anna",
            last_name="Nowak",
        )

        response = authenticated_client.get(
            reverse("owner-list"),
            {"search": "Dominik"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == expected_owner.pk

    def test_searches_by_last_name(
        self,
        authenticated_client,
    ):
        expected_owner = OwnerFactory(
            last_name="Kowalski",
        )
        OwnerFactory(
            last_name="Nowak",
        )

        response = authenticated_client.get(
            reverse("owner-list"),
            {"search": "Kowalski"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == expected_owner.pk

    def test_searches_by_phone(
        self,
        authenticated_client,
    ):
        expected_owner = OwnerFactory(
            phone="+48111222333",
        )
        OwnerFactory(
            phone="+48999888777",
        )

        response = authenticated_client.get(
            reverse("owner-list"),
            {"search": "+48111222333"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["id"] == expected_owner.pk


@pytest.mark.api
@pytest.mark.django_db
class TestOwnerOrderingApi:
    def test_orders_by_first_name_ascending(
        self,
        authenticated_client,
    ):
        OwnerFactory(
            first_name="Zofia",
            last_name="Same",
        )
        OwnerFactory(
            first_name="Anna",
            last_name="Same",
        )

        response = authenticated_client.get(
            reverse("owner-list"),
            {"ordering": "first_name"},
        )

        names = [owner["first_name"] for owner in response.data["results"]]

        assert response.status_code == status.HTTP_200_OK
        assert names == ["Anna", "Zofia"]

    def test_orders_by_first_name_descending(
        self,
        authenticated_client,
    ):
        OwnerFactory(
            first_name="Anna",
            last_name="Same",
        )
        OwnerFactory(
            first_name="Zofia",
            last_name="Same",
        )

        response = authenticated_client.get(
            reverse("owner-list"),
            {"ordering": "-first_name"},
        )

        names = [owner["first_name"] for owner in response.data["results"]]

        assert response.status_code == status.HTTP_200_OK
        assert names == ["Zofia", "Anna"]

    def test_uses_default_ordering(
        self,
        authenticated_client,
    ):
        OwnerFactory(
            first_name="Zofia",
            last_name="Kowalski",
        )
        OwnerFactory(
            first_name="Anna",
            last_name="Kowalski",
        )
        OwnerFactory(
            first_name="Adam",
            last_name="Nowak",
        )

        response = authenticated_client.get(reverse("owner-list"))

        returned_names = [
            (
                owner["last_name"],
                owner["first_name"],
            )
            for owner in response.data["results"]
        ]

        assert returned_names == [
            ("Kowalski", "Anna"),
            ("Kowalski", "Zofia"),
            ("Nowak", "Adam"),
        ]
