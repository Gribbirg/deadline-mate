from rest_framework import serializers
from .models import Group, GroupMembership, GroupTeacher


class GroupSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Group с базовой информацией."""
    member_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'code', 'description', 'created_by', 
            'created_by_name', 'created_at', 'is_active', 'member_count',
            'teacher_count'
        ]
        read_only_fields = ['code', 'created_by', 'created_at', 'member_count', 'teacher_count']

    def get_member_count(self, obj):
        """Возвращает количество участников группы."""
        if hasattr(obj, '_member_count'):
            return obj._member_count
        return obj.get_member_count

    def get_teacher_count(self, obj):
        """Возвращает количество преподавателей группы."""
        if hasattr(obj, '_teacher_count'):
            return obj._teacher_count
        return obj.get_teacher_count

    def get_created_by_name(self, obj):
        """Возвращает имя создателя группы."""
        user = obj.created_by.user
        if user.get_full_name():
            return user.get_full_name()
        return user.username

    def create(self, validated_data):
        """
        Создает группу и устанавливает текущего пользователя как создателя.
        """
        user = self.context['request'].user
        if hasattr(user, 'teacher_profile'):
            validated_data['created_by'] = user.teacher_profile
            return super().create(validated_data)
        raise serializers.ValidationError(
            "Только преподаватели могут создавать группы"
        )


class GroupMembershipSerializer(serializers.ModelSerializer):
    """Базовый сериализатор для модели GroupMembership."""
    student_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupMembership
        fields = [
            'id', 'group', 'student', 'student_name', 
            'role', 'joined_at', 'is_active'
        ]
        read_only_fields = ['joined_at']

    def get_student_name(self, obj):
        """Возвращает имя студента."""
        user = obj.student.user
        if user.get_full_name():
            return user.get_full_name()
        return user.username


class GroupTeacherSerializer(serializers.ModelSerializer):
    """Сериализатор для модели GroupTeacher."""
    teacher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GroupTeacher
        fields = [
            'id', 'group', 'teacher', 'teacher_name', 
            'joined_at', 'is_active'
        ]
        read_only_fields = ['joined_at']

    def get_teacher_name(self, obj):
        """Возвращает имя преподавателя."""
        user = obj.teacher.user
        if user.get_full_name():
            return user.get_full_name()
        return user.username


class GroupDetailSerializer(serializers.ModelSerializer):
    """Расширенный сериализатор группы с информацией об участниках."""
    member_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'code', 'description', 'created_by',
            'created_by_name', 'created_at', 'updated_at',
            'is_active', 'member_count', 'members',
            'teacher_count', 'teachers'
        ]
        read_only_fields = [
            'code', 'created_by', 'created_at', 'updated_at', 
            'member_count', 'members', 'teacher_count', 'teachers'
        ]

    def get_member_count(self, obj):
        """Возвращает количество участников группы."""
        if hasattr(obj, '_member_count'):
            return obj._member_count
        return obj.get_member_count

    def get_teacher_count(self, obj):
        """Возвращает количество преподавателей группы."""
        if hasattr(obj, '_teacher_count'):
            return obj._teacher_count
        return obj.get_teacher_count

    def get_created_by_name(self, obj):
        user = obj.created_by.user
        if user.get_full_name():
            return user.get_full_name()
        return user.username

    def get_members(self, obj):
        """Возвращает список активных участников группы."""
        memberships = obj.memberships.filter(is_active=True)
        return GroupMembershipSerializer(memberships, many=True).data
    
    def get_teachers(self, obj):
        """Возвращает список преподавателей группы."""
        teachers = obj.teachers.filter(is_active=True)
        return GroupTeacherSerializer(teachers, many=True).data 