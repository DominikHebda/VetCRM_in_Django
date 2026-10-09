# VetCRM — obsługa wdrożenia

## Usługi

| Element      | Konfiguracja                                          |
| ------------ | ----------------------------------------------------- |
| vetcrm-web   | Render Static Site, branch main                       |
| vetcrm-api   | Render Web Service, Docker, Free, Oregon, branch main |
| PostgreSQL   | Neon, DATABASE_URL ustawiany ręcznie                  |
| Django Admin | https://vetcrm-api.onrender.com/admin/                |

Blueprint render.yaml opisuje frontend i backend. Stara vetcrm-db na Render nie jest źródłem danych obecnego wdrożenia. Sama obecność jej na liście zasobów nie oznacza, że API z niej korzysta.

Render Free usypia backend po bezczynności i nie udostępnia Shell/SSH. Pierwsze żądanie po przerwie może wymagać oczekiwania na start. Baza Neon pozostaje oddzielną usługą.

## Zmienne backendu

Ustaw w vetcrm-api → Environment:

| Zmienna              | Wartość                                                         |
| -------------------- | --------------------------------------------------------------- |
| DJANGO_SECRET_KEY    | Własny silny sekret; nie zapisuj go w repo                      |
| DJANGO_DEBUG         | False                                                           |
| DJANGO_ALLOWED_HOSTS | vetcrm-api.onrender.com                                         |
| DATABASE_URL         | Właściwy connection string Neon z wymaganymi opcjami TLS        |
| CORS_ALLOWED_ORIGINS | https://vetcrm-web.onrender.com                                 |
| CSRF_TRUSTED_ORIGINS | https://vetcrm-api.onrender.com,https://vetcrm-web.onrender.com |
| FRONTEND_URL         | https://vetcrm-web.onrender.com                                 |

DATABASE_URL decyduje o bazie także dla lokalnych poleceń. Nie uruchamiaj testów ani seedowania z połączeniem produkcyjnym. Sprawdzaj host i nazwę bazy bez wypisywania hasła i całego adresu.

W Blueprint wszystkie powyższe zmienne mają sync: false. Przy aktualizacji istniejącego Blueprinta Render ignoruje takie wpisy; nowe wartości dodaje się ręcznie w Environment. Przy tworzeniu nowego Blueprinta wartości podaje się w kreatorze.

## OAuth i zmienne frontendu

W produkcyjnym Adminie utwórz aplikację OAuth Public, Authorization code, z redirect URI:

```text
https://vetcrm-web.onrender.com/auth/callback
```

W polu User wybierz administratora przez lupę. Jeśli formularz ma Allowed origins, ustaw `https://vetcrm-web.onrender.com`.

W vetcrm-web → Environment:

| Zmienna                 | Wartość                                       |
| ----------------------- | --------------------------------------------- |
| VITE_API_BASE_URL       | https://vetcrm-api.onrender.com               |
| VITE_OAUTH_REDIRECT_URI | https://vetcrm-web.onrender.com/auth/callback |
| VITE_OAUTH_CLIENT_ID    | Client ID tej aplikacji OAuth                 |

Client ID jest identyfikatorem publicznym. Client secret nie trafia do frontendu. Po zmianie zmiennych frontendu wybierz Save, rebuild, and deploy. Zmienne backendu również wymagają wdrożenia; samo Save only nie aktualizuje uruchomionego procesu.

## Wdrożenie zmiany

1. Branch → kontrola zmiany → testy → commit → push → PR.
2. Poczekaj na zielone CI. Obecne CI sprawdza backend; lint i build frontendu uruchom osobno.
3. Merge do main. Przy włączonym Auto Sync Blueprint synchronizuje konfigurację; w przeciwnym razie wykonaj Manual Sync.
4. Sprawdź commit i wynik deploya dla obu usług. Nazwy i adresy istniejących usług mają zostać zachowane.
5. Sprawdź health check, logowanie, dashboard, zapis danych oraz wylogowanie.

Dockerfile uruchamia start.sh: migrate → collectstatic → Gunicorn. Nowy deploy wykonuje migracje. Konto administratora i aplikacja OAuth nie są tworzone przez start.sh.

## Health check i test ręczny

Backend:

- `/health/live/` — żywotność.
- `/health/ready/` — gotowość, w tym połączenie z bazą; jest health checkiem Render.

Test ręczny na danych testowych:

- ADMIN: utwórz właściciela, pacjenta i wizytę; sprawdź zapis po odświeżeniu.
- VET: właściciele i pacjenci tylko do odczytu; zapis dokumentacji, szczepień i recept dostępny.
- RECEPTIONIST: zarządzanie właścicielami, pacjentami i wizytami; moduły kliniczne tylko do odczytu.
- Przy co najmniej dwóch wizytach jednego pacjenta sprawdź datę i godzinę w wyborze wizyty.
- Wyloguj się, kliknij logowanie i sprawdź możliwość wybrania innego konta w tym samym oknie.

## Odtworzenie administratora na właściwej bazie

Na Render Free użyj lokalnego Django z połączeniem do właściwej bazy Neon.

1. W aktywnym środowisku Python skopiuj DATABASE_URL z konfiguracji vetcrm-api.
2. W PowerShell wpisz ręcznie poniższą komendę, żeby jej kopiowanie nie zastąpiło adresu w schowku:

```powershell
$env:DATABASE_URL = (Get-Clipboard -Raw).Trim()
```

3. Potwierdź połączenie bez ujawniania sekretu:

```powershell
python manage.py shell -c "from django.conf import settings; db=settings.DATABASES['default']; print('ENGINE:', db.get('ENGINE')); print('HOST:', db.get('HOST')); print('DATABASE:', db.get('NAME'))"
```

4. Przy poprawnym hoście Neon uruchom prompt administratora z [głównego README](../README.md#pierwszy-administrator). Zmienne administratora ustawiane w tym procesie nie pozostają w PowerShell.
5. Potwierdź konto, uprawnienia i logowanie. Rola aplikacyjna ADMIN jest oddzielna od flag staff/superuser.
6. Po zakończeniu usuń tymczasową zmienną i skopiuj do schowka inny, niesekretny tekst:

```powershell
Remove-Item Env:DATABASE_URL
```

Jeśli przed procedurą DATABASE_URL było już ustawione w terminalu, zachowaj poprzednią wartość w zmiennej i przywróć ją zamiast usuwania.

create_initial_admin nie resetuje hasła istniejącego konta. Użyj changepassword po ponownym potwierdzeniu właściwej bazy.

## Diagnostyka

| Objaw                          | Co sprawdzić                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Admin odrzuca konto            | Aktywna baza, dokładny username, active/staff, hasło; konto może istnieć wyłącznie lokalnie |
| Backend dummy lub pusty host   | Czy DATABASE_URL zawiera pełny adres z prefiksem postgres:// lub postgresql://              |
| /api/auth/me/ zwraca 401       | Przed logowaniem może to być oczekiwane; po callbacku sprawdź wymianę tokenów i Client ID   |
| Callback prowadzi na localhost | VITE_OAUTH_REDIRECT_URI we wdrożonym buildzie                                               |
| Błąd CORS lub CSRF             | Origin i odpowiednie listy zaufanych adresów backendu                                       |
| Wylogowanie wraca na localhost | FRONTEND_URL w aktywnym wdrożeniu backendu                                                  |
| Brak zmiany UI na Render       | Czy wdrożono odpowiedni commit i przebudowano frontend                                      |

Nie przesyłaj haseł, pełnych connection stringów, tokenów ani adresów callback zawierających code. Usunięcie lokalnych tokenów i sesji Django nie oznacza unieważnienia wcześniej wydanych tokenów OAuth na serwerze.

## Odtwarzanie danych i cofanie wdrożenia

Przed migracjami zmieniającymi dane ustal aktualny sposób kopii i odtwarzania w Neon dla używanego planu. Nie zakładaj, że samo posiadanie repozytorium zapewnia kopię danych.

Cofnięcie kodu do wcześniejszego deploya nie cofa wykonanych migracji ani nie odtwarza danych. Najpierw sprawdź zgodność starego kodu z aktualnym schematem. Procedura kopii i odtwarzania wymaga osobnego sprawdzenia na bazie testowej.

## Przygotowanie wydania v1.0.0

- Dokumentacja i przykłady środowiska zmergowane.
- Zielone CI dla wybranego commita; lint/build frontendu sprawdzone.
- Obie usługi wdrożone z zamierzonej wersji.
- Test ręczny trzech ról i wylogowania zakończony.
- Zakres i znane ograniczenia opisane w release notes.
- Tag i GitHub Release utworzone osobnym krokiem.

## Dokumentacja dostawców

- [Render Blueprint](https://render.com/docs/blueprint-spec)
- [Zmienne środowiskowe Render](https://render.com/docs/configure-environment-variables)
- [Ograniczenia Render Free](https://render.com/docs/free)
- [Vite 8](https://v8.vite.dev/blog/announcing-vite8)
