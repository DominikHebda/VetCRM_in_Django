# Frontend VetCRM

React, Vite i SCSS. Backend, przygotowanie bazy oraz aplikacji OAuth opisuje [główny README](../README.md).

## Uruchomienie

Z katalogu głównego repozytorium, jeśli frontend/.env jeszcze nie istnieje:

```powershell
Copy-Item frontend/.env.example frontend/.env
npm --prefix frontend ci
npm --prefix frontend run dev
```

Node.js musi być zgodny z Vite 8: 20.19+ lub 22.12+, albo nowsza wspierana wersja. Domyślny adres: http://localhost:5173.

## Konfiguracja

| Zmienna                 | Lokalnie                                       |
| ----------------------- | ---------------------------------------------- |
| VITE_API_BASE_URL       | http://localhost:8000                          |
| VITE_OAUTH_CLIENT_ID    | Client ID lokalnej aplikacji OAuth typu Public |
| VITE_OAUTH_REDIRECT_URI | http://localhost:5173/auth/callback            |

Nie dodawaj końcowego ukośnika do VITE*API_BASE_URL. Po zmianie .env zrestartuj Vite; na Render przebuduj frontend. Zmienne VITE* są częścią kodu przeglądarki: nie umieszczaj w nich haseł ani Client secret.

Logowanie używa Authorization Code z PKCE. Tokeny są przechowywane w sessionStorage. Wylogowanie usuwa je lokalnie, a następnie kończy sesję Django przez formularz POST z CSRF na backendzie. Ten przepływ nie wywołuje endpointu unieważniania tokenów OAuth.

## Sprawdzenia i build

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

Wynik kompilacji trafia do frontend/dist. Na Render rewrite `/*` do `/index.html` obsługuje React Router.

Szczegóły wdrożenia: [instrukcja operacyjna](../docs/operations.md).
