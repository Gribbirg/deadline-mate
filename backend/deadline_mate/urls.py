from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.views.decorators.http import require_GET
from django.http import JsonResponse

# Ensure this setting is set to False in settings.py:
# APPEND_SLASH = False

schema_view = get_schema_view(
    openapi.Info(
        title="Deadline Mate API",
        default_version='v1',
        description="API для веб-сервиса управления задачами и дедлайнами",
        contact=openapi.Contact(email="contact@deadlinemate.com"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# Simple diagnostic endpoint
@require_GET
def api_status(request):
    return JsonResponse({
        "status": "ok",
        "message": "API is running",
        "path": request.path,
        "method": request.method,
        "headers": dict(request.headers),
        "append_slash": getattr(settings, 'APPEND_SLASH', True)
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API документация
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), 
         name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), 
         name='schema-redoc'),
         
    # Diagnostic endpoint
    path('api/status', api_status, name='api_status'),
    
    # API endpoints для каждого приложения
    path('api/auth/', include('authentication.urls')),
    path('api/groups/', include('groups.urls')),
    path('api/assignments/', include('assignments.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )
    urlpatterns += static(
        settings.STATIC_URL, document_root=settings.STATIC_ROOT
    ) 