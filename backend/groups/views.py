from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from authentication.models import StudentProfile, TeacherProfile
from .models import Group, GroupMembership, GroupTeacher
from .serializers import (
    GroupSerializer,
    GroupDetailSerializer,
    GroupMembershipSerializer,
    GroupTeacherSerializer
)
from .permissions import (
    IsTeacherOrReadOnly,
    IsTeacherGroupOwnerOrReadOnly,
    IsGroupMember
)


class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet для операций с группами.
    
    list: Список всех групп (с фильтрацией по роли пользователя)
    retrieve: Детальная информация о группе
    create: Создание новой группы (только для преподавателей)
    update/partial_update: Обновление группы (только для создателя)
    destroy: Удаление группы (только для создателя)
    """
    queryset = Group.objects.annotate(
        _member_count=Count('memberships', filter=Q(memberships__is_active=True)),
        _teacher_count=Count('teachers', filter=Q(teachers__is_active=True))
    )
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at', '_member_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Выбор сериализатора в зависимости от действия."""
        if self.action == 'retrieve':
            return GroupDetailSerializer
        return GroupSerializer

    def get_queryset(self):
        """
        Фильтрация списка групп в зависимости от роли пользователя:
        - Преподаватели видят все группы
        - Студенты видят группы, в которых они состоят
        - Администраторы видят все группы
        """
        user = self.request.user
        queryset = super().get_queryset()

        if user.is_staff:
            return queryset
        
        if user.is_teacher():
            # Преподаватели видят все группы
            return queryset
        
        if user.is_student() and hasattr(user, 'student_profile'):
            return queryset.filter(
                memberships__student=user.student_profile,
                memberships__is_active=True
            )
        
        return Group.objects.none()

    def get_permissions(self):
        """Настройка прав доступа в зависимости от действия."""
        if self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [
                permissions.IsAuthenticated, IsTeacherGroupOwnerOrReadOnly
            ]
        elif self.action == 'retrieve':
            self.permission_classes = [permissions.IsAuthenticated, IsGroupMember]
        else:
            self.permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
        
        return super().get_permissions()

    @action(detail=True, methods=['post'])
    def add_student(self, request, pk=None):
        """Добавление студента в группу (для любого преподавателя)."""
        group = self.get_object()
        
        # Проверяем, является ли пользователь преподавателем
        if not request.user.is_teacher():
            return Response(
                {"detail": "Только преподаватели могут добавлять студентов."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        student_id = request.data.get('student_id')
        if not student_id:
            return Response(
                {"detail": "ID студента не указан."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {"detail": "Студент не найден."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, не состоит ли студент уже в группе
        if GroupMembership.objects.filter(group=group, student=student).exists():
            # Если студент уже был в группе, но не активен, активируем его
            membership = GroupMembership.objects.get(group=group, student=student)
            if not membership.is_active:
                membership.is_active = True
                membership.save()
                return Response(
                    {"detail": "Студент восстановлен в группе."},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"detail": "Студент уже состоит в группе."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Создаем новое членство
        role = request.data.get('role', GroupMembership.ROLE_MEMBER)
        membership = GroupMembership.objects.create(
            group=group,
            student=student,
            role=role
        )
        
        serializer = GroupMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_student(self, request, pk=None):
        """Удаление студента из группы (для любого преподавателя)."""
        group = self.get_object()
        
        # Проверяем, является ли пользователь преподавателем
        if not request.user.is_teacher():
            return Response(
                {"detail": "Только преподаватели могут удалять студентов."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        membership_id = request.data.get('membership_id')
        if not membership_id:
            return Response(
                {"detail": "ID членства не указан."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = GroupMembership.objects.get(id=membership_id, group=group)
        except GroupMembership.DoesNotExist:
            return Response(
                {"detail": "Членство не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Деактивируем членство вместо удаления
        membership.is_active = False
        membership.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def add_teacher(self, request, pk=None):
        """Добавление преподавателя в группу (для любого преподавателя)."""
        group = self.get_object()
        
        # Проверяем, является ли пользователь преподавателем
        if not request.user.is_teacher():
            return Response(
                {"detail": "Только преподаватели могут добавлять других преподавателей."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        teacher_id = request.data.get('teacher_id')
        if not teacher_id:
            return Response(
                {"detail": "ID преподавателя не указан."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            teacher = TeacherProfile.objects.get(id=teacher_id)
        except TeacherProfile.DoesNotExist:
            return Response(
                {"detail": "Преподаватель не найден."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверяем, не является ли преподаватель создателем группы
        if teacher.id == group.created_by.id:
            return Response(
                {"detail": "Создатель группы уже является преподавателем этой группы."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, не добавлен ли преподаватель уже в группу
        if GroupTeacher.objects.filter(group=group, teacher=teacher).exists():
            # Если преподаватель уже был в группе, но не активен, активируем его
            teacher_membership = GroupTeacher.objects.get(group=group, teacher=teacher)
            if not teacher_membership.is_active:
                teacher_membership.is_active = True
                teacher_membership.save()
                return Response(
                    {"detail": "Преподаватель восстановлен в группе."},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"detail": "Преподаватель уже добавлен в группу."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Создаем новое членство преподавателя
        teacher_membership = GroupTeacher.objects.create(
            group=group,
            teacher=teacher
        )
        
        serializer = GroupTeacherSerializer(teacher_membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_teacher(self, request, pk=None):
        """Удаление преподавателя из группы (для любого преподавателя)."""
        group = self.get_object()
        
        # Проверяем, является ли пользователь преподавателем
        if not request.user.is_teacher():
            return Response(
                {"detail": "Только преподаватели могут удалять других преподавателей."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        teacher_id = request.data.get('teacher_id')
        if not teacher_id:
            return Response(
                {"detail": "ID преподавателя не указан."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            teacher_membership = GroupTeacher.objects.get(
                id=teacher_id, 
                group=group
            )
        except GroupTeacher.DoesNotExist:
            return Response(
                {"detail": "Преподаватель не найден в этой группе."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Деактивируем членство вместо удаления
        teacher_membership.is_active = False
        teacher_membership.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    @action(detail=True, methods=['post'])
    def join_as_teacher(self, request, pk=None):
        """Присоединиться к группе как преподаватель"""
        group = self.get_object()
        
        # Проверяем, является ли пользователь преподавателем
        if not request.user.is_teacher() or not hasattr(request.user, 'teacher_profile'):
            return Response(
                {"detail": "Только преподаватели могут присоединиться к группе как преподаватель."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        teacher = request.user.teacher_profile
            
        # Проверяем, не является ли преподаватель создателем группы
        if teacher.id == group.created_by.id:
            return Response(
                {"detail": "Вы уже являетесь создателем этой группы."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Проверяем, не добавлен ли преподаватель уже в группу
        if GroupTeacher.objects.filter(group=group, teacher=teacher).exists():
            # Если преподаватель уже был в группе, но не активен, активируем его
            teacher_membership = GroupTeacher.objects.get(group=group, teacher=teacher)
            if not teacher_membership.is_active:
                teacher_membership.is_active = True
                teacher_membership.save()
                return Response(
                    {"detail": "Вы снова присоединились к группе как преподаватель."},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"detail": "Вы уже являетесь преподавателем этой группы."},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        # Создаем новое членство преподавателя
        teacher_membership = GroupTeacher.objects.create(
            group=group,
            teacher=teacher
        )
            
        serializer = GroupTeacherSerializer(teacher_membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED) 