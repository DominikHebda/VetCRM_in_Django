# VetCRM

CRM do zarządzania przychodnią weterynaryjną: Django REST Framework, React i PostgreSQL. Logowanie korzysta z OAuth2 Authorization Code z PKCE.

## Funkcje i role

Dostępne są dashboard, właściciele, zwierzęta, wizyty, dokumentacja medyczna, szczepienia i recepty, wraz z wyszukiwaniem i paginacją.

| Obszar                              | ADMIN       | VET         | RECEPTIONIST |
| ----------------------------------- | ----------- | ----------- | ------------ |
| Właściciele i zwierzęta             | Zarządzanie | Odczyt      | Zarządzanie  |
| Wizyty                              | Zarządzanie | Zarządzanie | Zarządzanie  |
| Dokumentacja, szczepienia i recepty | Zarządzanie | Zarządzanie | Odczyt       |

Role ustawia się w UserProfile w Django Admin. Konta personelu powinny być aktywne; do korzystania z frontendu nie wymagają flag staff ani superuser. API Analytics i Notifications istnieją; ich osobne widoki frontendowe pozostają do wykonania.

## Wymagania

- Python 3.12.
- Node.js zgodny z Vite 8: 20.19+ lub 22.12+; można użyć nowszej wspieranej wersji.
- PostgreSQL; konfiguracja Docker i CI używa PostgreSQL 18.
- Docker z Compose, jeśli wybierasz uruchomienie kontenerowe.

Przykłady terminala poniżej używają PowerShell i są wykonywane z katalogu głównego repozytorium. Nie nadpisuj istniejących plików .env.

## Backend lokalnie

1. Przygotuj PostgreSQL: rolę `vetcrm_user`, bazę `vetcrm_db` należącą do tej roli i własne hasło. Ustaw port oraz dane połączenia w DATABASE_URL. Do testów pytest rola potrzebuje prawa tworzenia bazy testowej; używaj oddzielnej lokalnej bazy, nie Neon.
2. Utwórz środowisko i zainstaluj zależności:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

3. W .env ustaw lokalny DATABASE_URL oraz własny DJANGO_SECRET_KEY. Dla lokalnego HTTP pozostaw DJANGO_DEBUG=True.
4. Wykonaj:

```powershell
python manage.py migrate
python manage.py check
python manage.py runserver
```

Backend: http://localhost:8000. Admin: http://localhost:8000/admin/.

## Backend przez Docker Compose

```powershell
Copy-Item .env.docker.example .env.docker
docker compose up --build -d
docker compose ps
```

Przed uruchomieniem ustaw własny DJANGO_SECRET_KEY oraz zgodne hasła POSTGRES_PASSWORD i DATABASE_URL w .env.docker. Backend łączy się z bazą przez host `db:5432`. Baza jest dostępna z hosta na `localhost:5433`, backend na `localhost:8000`. Nie uruchamiaj równocześnie lokalnego runserver na tym samym porcie.

Compose uruchamia bazę i backend, nie frontend. Dane bazy przechowuje wolumen. `docker compose down` zatrzymuje usługi; nie dodawaj `-v`, jeśli chcesz zachować dane.

## Pierwszy administrator

Komenda `create_initial_admin` wymaga zmiennych DJANGO_ADMIN_USERNAME, DJANGO_ADMIN_EMAIL i DJANGO_ADMIN_PASSWORD. Można podać je w procesie Pythona przez prompt, bez wpisywania hasła do historii terminala:

```powershell
python manage.py shell -c "import os; from getpass import getpass; from django.core.management import call_command; os.environ['DJANGO_ADMIN_USERNAME']=input('Login: ').strip(); os.environ['DJANGO_ADMIN_EMAIL']=input('Email: ').strip(); os.environ['DJANGO_ADMIN_PASSWORD']=getpass('Haslo: '); call_command('create_initial_admin')"
```

Dla Compose poprzedź powyższe wywołanie `python` przez `docker compose exec web`.

Komenda nadaje rolę ADMIN oraz flagi active/staff/superuser. Dla istniejącego konta weryfikuje flagi, email i rolę, ale **nie zmienia hasła**. Zmiana hasła: `python manage.py changepassword NAZWA_UZYTKOWNIKA`, albo odpowiednie wywołanie przez Compose.

## Lokalna aplikacja OAuth i frontend

W lokalnym Django Admin dodaj aplikację OAuth:

| Pole                                      | Wartość                                    |
| ----------------------------------------- | ------------------------------------------ |
| Name                                      | VetCRM Web Local                           |
| User                                      | Administrator wybrany przez lupę przy polu |
| Client type                               | Public                                     |
| Authorization grant type                  | Authorization code                         |
| Redirect uris                             | http://localhost:5173/auth/callback        |
| Allowed origins, jeśli pole jest dostępne | http://localhost:5173                      |

Zachowaj Client ID. Nie umieszczaj Client secret we frontendzie.

```powershell
Copy-Item frontend/.env.example frontend/.env
npm --prefix frontend ci
```

W frontend/.env ustaw VITE_OAUTH_CLIENT_ID na Client ID lokalnej aplikacji. Następnie:

```powershell
npm --prefix frontend run dev
```

Otwórz http://localhost:5173. Jeżeli Vite wybierze inny port, zwolnij 5173 lub uzgodnij nowy port w konfiguracji OAuth, CORS, CSRF i FRONTEND_URL. Po zmianie frontend/.env uruchom Vite ponownie.

Lokalna baza i Neon są oddzielne: konta i aplikacje OAuth nie powstają automatycznie w obu bazach.

## Sprawdzenia

Przy lokalnym PostgreSQL i aktywnym środowisku Pythona:

```powershell
python -m ruff check .
python manage.py check
python manage.py makemigrations --check
python -m pytest
npm --prefix frontend run lint
npm --prefix frontend run build
git diff --check
```

Jeżeli używasz bazy z Compose, konfiguracja lokalnych testów musi wskazywać `localhost:5433`, a nie kontenerowy host `db`. Nie uruchamiaj testów na bazie wdrożenia.

Obecny workflow .github/workflows/ci.yml sprawdza backend. Lint i build frontendu wykonuj także lokalnie.

## Wdrożenie i dalsza praca

- [Instrukcja operacyjna Render i Neon](docs/operations.md).
- [Instrukcja frontendu](frontend/README.md).
- Konfiguracja usług: render.yaml.
- Zależności Pythona: requirements.txt; konfiguracja Ruff: pyproject.toml.

Wdrożenie frontendu: https://vetcrm-web.onrender.com. Backend: https://vetcrm-api.onrender.com.

Dalsze zadania obejmują widoki Analytics i Notifications, testy E2E oraz dopracowanie UX. Utworzenie taga i wydania v1.0.0 następuje po zatwierdzeniu dokumentacji i sprawdzeniu CI, nie przez samą zmianę tego pliku.
