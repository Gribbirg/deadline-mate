from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

from .serializers import (
    UserRegistrationSerializer, 
    UserProfileDetailSerializer,
    UserProfileUpdateSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer
)
from .permissions import IsOwnerOrTeacher, IsTeacher, IsStudent

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Кастомное представление для получения JWT токенов с дополнительной информацией о пользователе."""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_200_OK:
            # Получаем текущего пользователя по имени пользователя из запроса
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                # Добавляем базовую информацию о пользователе к ответу
                response.data.update({
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                })
            except User.DoesNotExist:
                pass
                
        return response


class UserRegistrationView(generics.CreateAPIView):
    """Представление для регистрации новых пользователей."""
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Представление для просмотра и обновления профиля пользователя."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserProfileDetailSerializer
        return UserProfileUpdateSerializer
    
    def get_object(self):
        """Возвращает текущего аутентифицированного пользователя."""
        return self.request.user


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для просмотра пользователей с фильтрацией по ролям."""
    queryset = User.objects.all()
    serializer_class = UserProfileDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Фильтрует пользователей в зависимости от роли текущего пользователя."""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Для студентов возвращаем только преподавателей
        if user.is_student():
            return queryset.filter(role=User.ROLE_TEACHER)
        
        # Для преподавателей возвращаем все
        return queryset
    
    @action(detail=False, methods=['get'], permission_classes=[IsTeacher])
    def students(self, request):
        """Возвращает список всех студентов (только для преподавателей)."""
        students = User.objects.filter(role=User.ROLE_STUDENT)
        page = self.paginate_queryset(students)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsStudent])
    def teachers(self, request):
        """Возвращает список всех преподавателей (для студентов)."""
        teachers = User.objects.filter(role=User.ROLE_TEACHER)
        page = self.paginate_queryset(teachers)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(teachers, many=True)
        return Response(serializer.data) 