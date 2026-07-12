from datetime import date

from .models import Prescription


PREFIX = "RX"


def generate_prescription_number() -> str:
    """
    Generate prescription number in format:
    RX-YYYY-000001
    """

    year = date.today().year

    last_prescription = (
        Prescription.objects.filter(
            prescription_number__startswith=f"{PREFIX}-{year}"
        )
        .order_by("-id")
        .first()
    )

    next_number = 1

    if last_prescription:
        last_number = int(
            last_prescription.prescription_number.split("-")[-1]
        )
        next_number = last_number + 1

    return f"{PREFIX}-{year}-{next_number:06d}"


def current_prescription_year() -> int:
    return date.today().year