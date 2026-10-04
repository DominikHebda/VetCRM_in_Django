from django.conf import settings
from django.contrib.auth import logout
from django.shortcuts import redirect, render
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods


@never_cache
@csrf_protect
@require_http_methods(["GET", "POST"])
def browser_logout(request):
    if request.method == "POST":
        logout(request)
        return redirect(settings.FRONTEND_URL)

    return render(request, "registration/logout.html")