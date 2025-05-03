from rest_framework import serializers
from .models import (
    Assignment, AssignmentAttachment, AssignmentGroup, 
    Submission, SubmissionAttachment
)
from groups.serializers import GroupSerializer
from authentication.serializers import TeacherProfileSerializer, StudentProfileSerializer
from django.utils import timezone


class AssignmentAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор для вложений заданий."""
    class Meta:
        model = AssignmentAttachment
        fields = ['id', 'file', 'filename', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class AssignmentMinSerializer(serializers.ModelSerializer):
    """Минимальный сериализатор для заданий."""
    time_remaining = serializers.SerializerMethodField()
    is_deadline_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'status', 'deadline', 
            'is_deadline_expired', 'time_remaining'
        ]
    
    def get_time_remaining(self, obj):
        """Получение оставшегося времени в формате строки."""
        if not obj.time_remaining:
            return None
        
        td = obj.time_remaining
        days = td.days
        hours, remainder = divmod(td.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if days > 0:
            return f"{days}д {hours}ч"
        elif hours > 0:
            return f"{hours}ч {minutes}м"
        else:
            return f"{minutes}м {seconds}с"


class AssignmentSerializer(serializers.ModelSerializer):
    """Полный сериализатор для заданий."""
    created_by = TeacherProfileSerializer(read_only=True)
    attachments = AssignmentAttachmentSerializer(many=True, read_only=True)
    time_remaining = serializers.SerializerMethodField()
    is_deadline_expired = serializers.BooleanField(read_only=True)
    submission_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'created_by',
            'created_at', 'updated_at', 'status', 'deadline',
            'max_points', 'allow_late_submissions', 'late_penalty_percentage',
            'attachments', 'is_deadline_expired', 'time_remaining',
            'submission_count'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']
    
    def get_time_remaining(self, obj):
        """Получение оставшегося времени в формате строки."""
        if not obj.time_remaining:
            return None
        
        td = obj.time_remaining
        days = td.days
        hours, remainder = divmod(td.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if days > 0:
            return f"{days}д {hours}ч"
        elif hours > 0:
            return f"{hours}ч {minutes}м"
        else:
            return f"{minutes}м {seconds}с"
    
    def create(self, validated_data):
        """Создание задания с текущим преподавателем."""
        user = self.context['request'].user
        if not hasattr(user, 'teacher_profile'):
            raise serializers.ValidationError(
                "Только преподаватель может создавать задания."
            )
        
        validated_data['created_by'] = user.teacher_profile
        return super().create(validated_data)


class AssignmentGroupSerializer(serializers.ModelSerializer):
    """Сериализатор для связи заданий с группами."""
    assignment = AssignmentMinSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=Assignment.objects.all(),
        write_only=True
    )
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=GroupSerializer.Meta.model.objects.all(),
        write_only=True
    )
    effective_deadline = serializers.DateTimeField(read_only=True)
    custom_deadline = serializers.DateTimeField(required=False, allow_null=True)
    
    class Meta:
        model = AssignmentGroup
        fields = [
            'id', 'assignment', 'group', 'assignment_id', 'group_id',
            'assigned_at', 'custom_deadline', 'effective_deadline'
        ]
        read_only_fields = ['assigned_at']
    
    def create(self, validated_data):
        """Создание связи задания с группой."""
        assignment = validated_data.pop('assignment_id')
        group = validated_data.pop('group_id')
        assignment_group = AssignmentGroup.objects.create(
            assignment=assignment,
            group=group,
            **validated_data
        )
        return assignment_group


class SubmissionAttachmentSerializer(serializers.ModelSerializer):
    """Сериализатор для вложений ответов."""
    class Meta:
        model = SubmissionAttachment
        fields = ['id', 'file', 'filename', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class SubmissionSerializer(serializers.ModelSerializer):
    """Сериализатор для ответов на задания."""
    student = StudentProfileSerializer(read_only=True)
    graded_by = TeacherProfileSerializer(read_only=True)
    attachments = SubmissionAttachmentSerializer(many=True, read_only=True)
    assignment = AssignmentMinSerializer(read_only=True)
    assignment_id = serializers.PrimaryKeyRelatedField(
        queryset=Assignment.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'assignment_id', 'student', 
            'submitted_at', 'updated_at', 'comment', 'status',
            'points', 'is_late', 'feedback', 'graded_by',
            'graded_at', 'attachments'
        ]
        read_only_fields = [
            'student', 'submitted_at', 'updated_at', 
            'is_late', 'graded_by', 'graded_at'
        ]
    
    def create(self, validated_data):
        """Создание ответа с текущим студентом."""
        user = self.context['request'].user
        if not hasattr(user, 'student_profile'):
            raise serializers.ValidationError(
                "Только студент может отправлять ответы на задания."
            )
        
        assignment = validated_data.pop('assignment_id')
        
        # Проверка, назначено ли задание студенту через его группы
        student_groups = user.student_profile.group_memberships.filter(
            is_active=True
        ).values_list('group_id', flat=True)
        
        if not AssignmentGroup.objects.filter(
            assignment=assignment,
            group_id__in=student_groups
        ).exists():
            raise serializers.ValidationError(
                "Это задание не назначено ни одной из ваших групп."
            )
        
        # Проверка на повторную отправку
        if Submission.objects.filter(
            assignment=assignment,
            student=user.student_profile
        ).exists():
            raise serializers.ValidationError(
                "Вы уже отправили ответ на это задание."
            )
        
        submission = Submission.objects.create(
            assignment=assignment,
            student=user.student_profile,
            **validated_data
        )
        return submission


class SubmissionGradeSerializer(serializers.ModelSerializer):
    """Сериализатор для оценивания ответов."""
    class Meta:
        model = Submission
        fields = ['id', 'status', 'points', 'feedback']
    
    def update(self, instance, validated_data):
        """Обновление оценки ответа преподавателем."""
        user = self.context['request'].user
        if not hasattr(user, 'teacher_profile'):
            raise serializers.ValidationError(
                "Только преподаватель может оценивать ответы."
            )
        
        # Проверка, является ли преподаватель создателем задания или преподавателем группы
        assignment = instance.assignment
        student_groups = instance.student.group_memberships.filter(
            is_active=True
        ).values_list('group_id', flat=True)
        
        is_assignment_creator = assignment.created_by == user.teacher_profile
        is_group_teacher = assignment.assignment_groups.filter(
            group__teachers__teacher=user.teacher_profile,
            group__teachers__is_active=True,
            group_id__in=student_groups
        ).exists()
        
        if not (is_assignment_creator or is_group_teacher):
            raise serializers.ValidationError(
                "У вас нет прав для оценивания этого ответа."
            )
        
        # Обновление статуса и оценки
        instance.status = validated_data.get('status', instance.status)
        instance.points = validated_data.get('points', instance.points)
        instance.feedback = validated_data.get('feedback', instance.feedback)
        instance.graded_by = user.teacher_profile
        
        # Устанавливаем текущее время как время оценивания
        instance.graded_at = timezone.now()
        
        instance.save()
        return instance 