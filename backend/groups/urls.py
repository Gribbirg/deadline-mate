from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GroupViewSet

# Create a custom router that doesn't enforce trailing slashes
class NoTrailingSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = ""

router = NoTrailingSlashRouter()
router.register(r'groups', GroupViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 