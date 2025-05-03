from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import EmailValidator, MinLengthValidator
import re

from .models import StudentProfile, TeacherProfile

User = get_user_model()


class BasicUserSerializer(serializers.ModelSerializer):
    """Базовый сериализатор для пользователя с основной информацией."""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для профиля студента."""
    user = BasicUserSerializer(read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'student_id', 'major', 'year_of_study', 'bio', 'avatar']


class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ['position', 'department', 'academic_degree', 'bio', 'avatar']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[MinLengthValidator(8)],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    # Профиль студента
    student_profile = StudentProfileSerializer(required=False)
    
    # Профиль преподавателя
    teacher_profile = TeacherProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'password', 'password_confirm',
            'student_profile', 'teacher_profile'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True, 'validators': [EmailValidator()]},
        }
    
    def validate_password(self, value):
        """Валидирует сложность пароля."""
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                _("Пароль должен содержать хотя бы одну заглавную букву.")
            )
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                _("Пароль должен содержать хотя бы одну строчную букву.")
            )
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError(
                _("Пароль должен содержать хотя бы одну цифру.")
            )
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password_confirm": _("Пароли не совпадают.")}
            )
        
        # Проверяем соответствие профиля и роли
        role = attrs.get('role')
        student_profile = attrs.get('student_profile')
        teacher_profile = attrs.get('teacher_profile')
        
        if role == User.ROLE_STUDENT and teacher_profile:
            raise serializers.ValidationError(
                {"teacher_profile": _("Профиль преподавателя не может быть указан для студента.")}
            )
        elif role == User.ROLE_TEACHER and student_profile:
            raise serializers.ValidationError(
                {"student_profile": _("Профиль студента не может быть указан для преподавателя.")}
            )
            
        return attrs
    
    def create(self, validated_data):
        # Извлекаем данные профилей
        student_profile_data = validated_data.pop('student_profile', None)
        teacher_profile_data = validated_data.pop('teacher_profile', None)
        password_confirm = validated_data.pop('password_confirm', None)
        
        # Создаем пользователя
        user = User.objects.create_user(**validated_data)
        
        # Обновляем профиль, если предоставлены данные
        if student_profile_data and user.is_student():
            StudentProfile.objects.filter(user=user).update(**student_profile_data)
        elif teacher_profile_data and user.is_teacher():
            TeacherProfile.objects.filter(user=user).update(**teacher_profile_data)
            
        return user


class UserProfileDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детального отображения профиля пользователя."""
    student_profile = StudentProfileSerializer(read_only=True)
    teacher_profile = TeacherProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'date_joined', 'student_profile', 'teacher_profile'
        ]
        read_only_fields = ['id', 'username', 'role', 'date_joined']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор для обновления профиля пользователя."""
    student_profile = StudentProfileSerializer(required=False)
    teacher_profile = TeacherProfileSerializer(required=False)
    current_password = serializers.CharField(
        write_only=True,
        required=False,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=False,
        validators=[MinLengthValidator(8)],
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name',
            'student_profile', 'teacher_profile',
            'current_password', 'new_password'
        ]
    
    def validate_new_password(self, value):
        """Валидирует сложность нового пароля."""
        if value:
            if not re.search(r'[A-Z]', value):
                raise serializers.ValidationError(
                    _("Пароль должен содержать хотя бы одну заглавную букву.")
                )
            if not re.search(r'[a-z]', value):
                raise serializers.ValidationError(
                    _("Пароль должен содержать хотя бы одну строчную букву.")
                )
            if not re.search(r'[0-9]', value):
                raise serializers.ValidationError(
                    _("Пароль должен содержать хотя бы одну цифру.")
                )
        return value
    
    def validate(self, attrs):
        # Если передан новый пароль, проверяем текущий
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        
        if new_password and not current_password:
            raise serializers.ValidationError(
                {"current_password": _("Для смены пароля необходимо указать текущий пароль.")}
            )
            
        if current_password and not self.instance.check_password(current_password):
            raise serializers.ValidationError(
                {"current_password": _("Неверный текущий пароль.")}
            )
            
        return attrs
    
    def update(self, instance, validated_data):
        # Извлекаем данные профилей и пароли
        student_profile_data = validated_data.pop('student_profile', None)
        teacher_profile_data = validated_data.pop('teacher_profile', None)
        current_password = validated_data.pop('current_password', None)
        new_password = validated_data.pop('new_password', None)
        
        # Обновляем базовые поля пользователя
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Если указан новый пароль, меняем его
        if new_password:
            instance.set_password(new_password)
            
        instance.save()
        
        # Обновляем профиль, если предоставлены данные
        if student_profile_data and instance.is_student():
            for attr, value in student_profile_data.items():
                setattr(instance.student_profile, attr, value)
            instance.student_profile.save()
        elif teacher_profile_data and instance.is_teacher():
            for attr, value in teacher_profile_data.items():
                setattr(instance.teacher_profile, attr, value)
            instance.teacher_profile.save()
            
        return instance 