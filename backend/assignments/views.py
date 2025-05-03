from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Prefetch
from django.utils import timezone

from .models import (
    Assignment, AssignmentAttachment, AssignmentGroup, 
    Submission, SubmissionAttachment
)
from .serializers import (
    AssignmentSerializer, AssignmentMinSerializer, 
    AssignmentAttachmentSerializer, AssignmentGroupSerializer,
    SubmissionSerializer, SubmissionAttachmentSerializer,
    SubmissionGradeSerializer
)
from groups.models import GroupMembership, GroupTeacher
from authentication.models import CustomUser


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Пользовательское разрешение для учителей.
    Полный доступ для учителей, только чтение для остальных.
    """
    def has_permission(self, request, view):
        # Разрешить GET, HEAD, OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Разрешить действия только для учителей
        return hasattr(request.user, 'teacher_profile')


class AssignmentViewSet(viewsets.ModelViewSet):
    """API для работы с заданиями."""
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Получение списка заданий в зависимости от роли пользователя.
        Преподаватели видят свои созданные задания и задания назначенных им групп.
        Студенты видят только задания, назначенные их группам.
        """
        user = self.request.user
        
        if hasattr(user, 'teacher_profile'):
            # Для преподавателей
            teacher = user.teacher_profile
            
            # Получаем все группы, где учитель преподает
            teaching_groups = GroupTeacher.objects.filter(
                teacher=teacher, 
                is_active=True
            ).values_list('group_id', flat=True)
            
            # Задания, созданные учителем + задания, назначенные группам учителя
            return Assignment.objects.filter(
                Q(created_by=teacher) | 
                Q(assignment_groups__group_id__in=teaching_groups)
            ).distinct()
            
        elif hasattr(user, 'student_profile'):
            # Для студентов
            student = user.student_profile
            
            # Получаем все активные группы студента
            student_groups = GroupMembership.objects.filter(
                student=student, 
                is_active=True
            ).values_list('group_id', flat=True)
            
            # Только задания, назначенные группам студента
            return Assignment.objects.filter(
                assignment_groups__group_id__in=student_groups,
                status=Assignment.STATUS_PUBLISHED
            ).distinct()
            
        return Assignment.objects.none()
    
    def perform_create(self, serializer):
        """Сохранение задания с текущим преподавателем."""
        serializer.save(created_by=self.request.user.teacher_profile)
    
    @action(detail=True, methods=['get'])
    def groups(self, request, pk=None):
        """Получение групп, которым назначено задание."""
        assignment = self.get_object()
        assignment_groups = AssignmentGroup.objects.filter(assignment=assignment)
        serializer = AssignmentGroupSerializer(assignment_groups, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def submissions(self, request, pk=None):
        """Получение всех ответов на задание."""
        user = request.user
        assignment = self.get_object()
        
        # Проверка прав доступа (только преподаватель, создавший задание, или преподаватель группы)
        if hasattr(user, 'teacher_profile'):
            teacher = user.teacher_profile
            teacher_groups = GroupTeacher.objects.filter(
                teacher=teacher, 
                is_active=True
            ).values_list('group_id', flat=True)
            
            is_assignment_creator = assignment.created_by == teacher
            is_group_teacher = AssignmentGroup.objects.filter(
                assignment=assignment,
                group_id__in=teacher_groups
            ).exists()
            
            if not (is_assignment_creator or is_group_teacher):
                return Response(
                    {"detail": "У вас нет прав для просмотра ответов на это задание."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            submissions = Submission.objects.filter(assignment=assignment)
            serializer = SubmissionSerializer(submissions, many=True)
            return Response(serializer.data)
        
        # Для студента показываем только его ответ
        elif hasattr(user, 'student_profile'):
            student = user.student_profile
            try:
                submission = Submission.objects.get(
                    assignment=assignment,
                    student=student
                )
                serializer = SubmissionSerializer(submission)
                return Response(serializer.data)
            except Submission.DoesNotExist:
                return Response(
                    {"detail": "Вы еще не отправляли ответ на это задание."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(
            {"detail": "Доступ запрещен."},
            status=status.HTTP_403_FORBIDDEN
        )


class AssignmentAttachmentViewSet(viewsets.ModelViewSet):
    """API для работы с вложениями заданий."""
    serializer_class = AssignmentAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    
    def get_queryset(self):
        return AssignmentAttachment.objects.all()
    
    def perform_create(self, serializer):
        """Привязка вложения к заданию."""
        assignment_id = self.request.data.get('assignment_id')
        if not assignment_id:
            return Response(
                {"detail": "Необходимо указать ID задания."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            assignment = Assignment.objects.get(id=assignment_id)
            # Проверка прав доступа
            if assignment.created_by != self.request.user.teacher_profile:
                return Response(
                    {"detail": "Вы можете добавлять вложения только к своим заданиям."},
                    status=status.HTTP_403_FORBIDDEN
                )
            serializer.save(assignment=assignment)
        except Assignment.DoesNotExist:
            return Response(
                {"detail": "Задание не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )


class AssignmentGroupViewSet(viewsets.ModelViewSet):
    """API для работы с назначением заданий группам."""
    serializer_class = AssignmentGroupSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrReadOnly]
    
    def get_queryset(self):
        """
        Фильтрация назначений заданий в зависимости от параметров запроса:
        - assignment_id: фильтр по ID задания
        - group_id: фильтр по ID группы
        """
        queryset = AssignmentGroup.objects.all()
        
        assignment_id = self.request.query_params.get('assignment_id')
        if assignment_id:
            queryset = queryset.filter(assignment_id=assignment_id)
            
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
            
        return queryset
    
    def perform_create(self, serializer):
        """Проверка прав доступа перед созданием."""
        user = self.request.user
        if not hasattr(user, 'teacher_profile'):
            return Response(
                {"detail": "Только преподаватели могут назначать задания группам."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        assignment_id = serializer.validated_data.get('assignment_id').id
        group_id = serializer.validated_data.get('group_id').id
        
        try:
            assignment = Assignment.objects.get(id=assignment_id)
            
            # Проверка, является ли пользователь создателем задания или преподавателем группы
            is_assignment_creator = assignment.created_by == user.teacher_profile
            is_group_teacher = GroupTeacher.objects.filter(
                teacher=user.teacher_profile,
                group_id=group_id,
                is_active=True
            ).exists()
            
            if not (is_assignment_creator or is_group_teacher):
                return Response(
                    {"detail": "У вас нет прав для назначения этого задания данной группе."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            serializer.save()
            
        except Assignment.DoesNotExist:
            return Response(
                {"detail": "Задание не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )


class SubmissionViewSet(viewsets.ModelViewSet):
    """API для работы с ответами на задания."""
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Получение списка ответов в зависимости от роли пользователя.
        """
        user = self.request.user
        
        if hasattr(user, 'teacher_profile'):
            # Для преподавателей - ответы на их задания и задания их групп
            teacher = user.teacher_profile
            
            # Получаем все группы, где учитель преподает
            teaching_groups = GroupTeacher.objects.filter(
                teacher=teacher, 
                is_active=True
            ).values_list('group_id', flat=True)
            
            return Submission.objects.filter(
                Q(assignment__created_by=teacher) | 
                Q(assignment__assignment_groups__group_id__in=teaching_groups)
            ).distinct()
            
        elif hasattr(user, 'student_profile'):
            # Для студентов - только их собственные ответы
            return Submission.objects.filter(student=user.student_profile)
            
        return Submission.objects.none()
    
    def create(self, request, *args, **kwargs):
        """Создание нового ответа на задание."""
        if not hasattr(request.user, 'student_profile'):
            return Response(
                {"detail": "Только студенты могут отправлять ответы на задания."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        student = request.user.student_profile
        assignment_id = request.data.get('assignment_id')
        
        if not assignment_id:
            return Response(
                {"detail": "Необходимо указать ID задания."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response(
                {"detail": "Задание не найдено."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Проверка, доступно ли задание для студента
        student_groups = student.get_active_groups()
        if not AssignmentGroup.objects.filter(
            assignment=assignment, 
            group__in=student_groups
        ).exists():
            return Response(
                {"detail": "У вас нет доступа к этому заданию."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Проверка на существующий ответ
        if Submission.objects.filter(assignment=assignment, student=student).exists():
            return Response(
                {"detail": "Вы уже отправили ответ на это задание."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        comment = request.data.get('comment', '')
        
        # Создаем запись ответа
        submission = Submission.objects.create(
            assignment=assignment,
            student=student,
            comment=comment,
            is_late=assignment.is_deadline_expired()
        )
        
        return Response(
            SubmissionSerializer(submission).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['patch'], serializer_class=SubmissionGradeSerializer)
    def grade(self, request, pk=None):
        """Оценивание ответа на задание."""
        submission = self.get_object()
        serializer = SubmissionGradeSerializer(
            submission, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SubmissionAttachmentViewSet(viewsets.ModelViewSet):
    """API для работы с вложениями ответов на задания."""
    serializer_class = SubmissionAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SubmissionAttachment.objects.all()
    
    def perform_create(self, serializer):
        """Привязка вложения к ответу."""
        submission_id = self.request.data.get('submission_id')
        if not submission_id:
            return Response(
                {"detail": "Необходимо указать ID ответа."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            submission = Submission.objects.get(id=submission_id)
            
            # Проверка прав доступа
            user = self.request.user
            if hasattr(user, 'student_profile') and submission.student != user.student_profile:
                return Response(
                    {"detail": "Вы можете добавлять вложения только к своим ответам."},
                    status=status.HTTP_403_FORBIDDEN
                )
                
            serializer.save(submission=submission)
            
        except Submission.DoesNotExist:
            return Response(
                {"detail": "Ответ не найден."},
                status=status.HTTP_404_NOT_FOUND
            ) 