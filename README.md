# VetCRM

CRM do zarządzania przychodnią weterynaryjną: Django REST Framework, React i PostgreSQL. Logowanie korzysta z OAuth2 Authorization Code z PKCE.

## Funkcje i role

Dostępne są dashboard, właściciele, zwierzęta, wizyty,
dokumentacja medyczna, szczepienia, recepty, Analityka i Powiadomienia.
Listy właścicieli, zwierząt, wizyt oraz wpisów klinicznych obsługują
wyszukiwanie i paginację.

| Obszar                              | ADMIN                    | VET                   | RECEPTIONIST             |
| ----------------------------------- | ------------------------ | --------------------- | ------------------------ |
| Właściciele i zwierzęta             | Zarządzanie              | Odczyt                | Zarządzanie              |
| Wizyty                              | Zarządzanie              | Zarządzanie           | Zarządzanie              |
| Dokumentacja, szczepienia i recepty | Zarządzanie              | Zarządzanie           | Odczyt                   |
| Analityka                           | Odczyt                   | Odczyt                | Brak dostępu             |
| Powiadomienia                       | Wszystkie pasujące wpisy | Własne pasujące wpisy | Wszystkie pasujące wpisy |

Role ustawia się w UserProfile w Django Admin.
Konta personelu powinny być aktywne; do korzystania z frontendu
nie wymagają flag staff ani superuser.

### Analityka

Ekran `/analytics` przedstawia:

- wizyty według miesiąca, niezależnie od statusu,
- zwierzęta według gatunku,
- do pięciu najczęstszych szczepionek i przepisywanych leków,
- wizyty według lekarza.

Zestawienia obejmują wszystkie zapisane dane, bez filtra okresu.
Dostępne są ręczne odświeżanie oraz obsługa ładowania, błędów
i pustych zestawień.

### Powiadomienia

Ekran `/notifications` przedstawia:

- szczepienia z kolejnym terminem od dziś do 30 dni,
- recepty ważne do daty przypadającej od dziś do 7 dni,
- zaplanowane wizyty na dziś.

Weterynarz widzi wpisy przypisane do jego konta.
Powiadomienia zawierają terminy i linki do odpowiednich modułów.
Lista jest pobierana przy otwarciu ekranu i odświeżana ręcznie;
nie ma oznaczania wpisów jako przeczytane ani wysyłki e-mail.
Treść komunikatów z API jest obecnie w języku polskim.

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

Workflow `.github/workflows/ci.yml` sprawdza backend oraz frontend.
Job `frontend` wykonuje `npm ci`, lint i build na Node.js 24.
Te same sprawdzenia można uruchomić lokalnie przed wysłaniem zmian.

## Testy przeglądarkowe E2E

Przy aktywnym `.venv` i zainstalowanych zależnościach frontendu:

```powershell
npm --prefix frontend run test:e2e
```

Przy pierwszym uruchomieniu zainstaluj Chromium:

```powershell
Push-Location frontend
npx playwright install chromium
Pop-Location
```

Playwright uruchamia backend na porcie 8002 i frontend na 5174.
Korzysta z `config.settings_e2e`, osobnej bazy SQLite w `.e2e/`
oraz dedykowanych kont ADMIN, VET i RECEPTIONIST oraz aplikacji OAuth.

Testy sprawdzają logowanie administratora przez OAuth,
otwarcie dashboardu, zachowanie logowania po odświeżeniu
oraz wylogowanie wymagające ponownego podania danych logowania.

Testy sprawdzają również dostęp ADMIN i VET do Analityki
oraz ukrycie linku i przekierowanie RECEPTIONIST przy wejściu
na `/analytics`.

Sprawdzane są także dodawanie, edycja i usuwanie właścicieli
przez ADMIN i RECEPTIONIST, wraz z weryfikacją zapisanych zmian
i trwałości usunięcia po odświeżeniu strony.

Dla VET sprawdzany jest odczyt danych właścicieli i zwierząt,
w tym przypisania zwierzęcia do właściciela, oraz brak przycisków
dodawania, edycji i usuwania w obu modułach.

Dla ADMIN i RECEPTIONIST sprawdzane są dodawanie, edycja
i usuwanie zwierząt, przypisanie właściciela oraz zachowanie
danych i notatki po odświeżeniu strony. Sprawdzana jest również
trwałość usunięcia po odświeżeniu.

Dla ADMIN, VET i RECEPTIONIST sprawdzane są dodawanie, edycja
i usuwanie wizyt. Testy potwierdzają zachowanie pacjenta,
weterynarza, terminu, statusu, powodu i notatki po odświeżeniu
oraz trwałość usunięcia wizyty.

Dla ADMIN i VET sprawdzane są tworzenie, edycja i usuwanie
dokumentacji medycznej. Testy potwierdzają zachowanie przypisanej
wizyty i danych klinicznych po odświeżeniu, trwałość usunięcia
oraz ponowną dostępność wizyty do utworzenia dokumentacji.

Dla RECEPTIONIST sprawdzany jest odczyt dokumentacji medycznej
oraz brak przycisków dodawania, edycji i usuwania.

Dla ADMIN i VET sprawdzane są dodawanie, edycja i usuwanie
szczepień. Testy potwierdzają zachowanie pacjenta, weterynarza,
danych szczepionki, dat i uwag po odświeżeniu oraz trwałość
usunięcia szczepienia.

Dla RECEPTIONIST sprawdzany jest odczyt szczepień oraz brak
przycisków dodawania, edycji i usuwania.

Dla ADMIN i VET sprawdzane są tworzenie, edycja i usuwanie recept.
Testy potwierdzają zachowanie danych po odświeżeniu, niezmienność
numeru recepty, wystawiającego, pacjenta i wizyty podczas edycji
oraz trwałość usunięcia.

Dla RECEPTIONIST sprawdzany jest odczyt recept oraz brak
przycisków dodawania, edycji i usuwania.

Testy powiadomień sprawdzają trzy rodzaje przypomnień i ręczne
odświeżanie. ADMIN i RECEPTIONIST widzą wpisy obu weterynarzy,
a każde z dwóch kont VET wyłącznie własne wpisy.

Dla ADMIN i VET wartości w pięciu tabelach Analityki są porównywane
z odpowiedzią API przy otwarciu, po ręcznym odświeżeniu
i po ponownym załadowaniu strony.

Nie zastępują one testów backendu na PostgreSQL.

Job `e2e` uruchamia te testy także w GitHub Actions.

## Wdrożenie i dalsza praca

- [Instrukcja operacyjna Render i Neon](docs/operations.md).
- [Instrukcja frontendu](frontend/README.md).
- Konfiguracja usług: render.yaml.
- Zależności Pythona: requirements.txt; konfiguracja Ruff: pyproject.toml.

Wdrożenie frontendu: https://vetcrm-web.onrender.com. Backend: https://vetcrm-api.onrender.com.

Dalsze zadania obejmują rozbudowę testów E2E oraz dopracowanie UX.
Wydanie `v1.0.0` zostało opublikowane;
późniejsze zmiany są rozwijane na `main` i wejdą do kolejnego wydania.
