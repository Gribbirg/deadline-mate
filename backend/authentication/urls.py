from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserViewSet,
    StudentViewSet,
)

# Создаем маршрутизатор для ViewSet
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register('students', StudentViewSet, basename='students')

urlpatterns = [
    # JWT аутентификация
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Регистрация и профиль пользователя
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Маршруты ViewSet
    path('', include(router.urls)),
] 