from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.db.models.signals import post_save
from django.dispatch import receiver


class CustomUser(AbstractUser):
    """Пользовательская модель пользователя с дополнительными полями."""
    
    ROLE_STUDENT = 'student'
    ROLE_TEACHER = 'teacher'
    
    ROLE_CHOICES = [
        (ROLE_STUDENT, _('Студент')),
        (ROLE_TEACHER, _('Преподаватель')),
    ]
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_STUDENT,
        verbose_name=_('Роль пользователя')
    )
    
    email = models.EmailField(_('email address'), unique=True)
    
    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        
    def is_student(self):
        return self.role == self.ROLE_STUDENT
        
    def is_teacher(self):
        return self.role == self.ROLE_TEACHER
    
    def get_profile(self):
        """Возвращает соответствующий профиль пользователя в зависимости от его роли."""
        if self.is_student():
            return hasattr(self, 'student_profile') and self.student_profile or None
        elif self.is_teacher():
            return hasattr(self, 'teacher_profile') and self.teacher_profile or None
        return None


class BaseProfile(models.Model):
    """Базовая модель профиля с общими полями."""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата обновления'))
    bio = models.TextField(blank=True, verbose_name=_('О себе'))
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name=_('Аватар'))
    
    class Meta:
        abstract = True


class StudentProfile(BaseProfile):
    """Профиль студента с дополнительными полями."""
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='student_profile',
        verbose_name=_('Пользователь')
    )
    student_id = models.CharField(max_length=20, blank=True, verbose_name=_('Студенческий билет'))
    major = models.CharField(max_length=100, blank=True, verbose_name=_('Специальность'))
    year_of_study = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_('Год обучения'))
    
    class Meta:
        verbose_name = _('Профиль студента')
        verbose_name_plural = _('Профили студентов')
    
    def __str__(self):
        return f"{self.user.username} - {self.user.get_full_name() or self.user.email}"


class TeacherProfile(BaseProfile):
    """Профиль преподавателя с дополнительными полями."""
    user = models.OneToOneField(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='teacher_profile',
        verbose_name=_('Пользователь')
    )
    position = models.CharField(max_length=100, blank=True, verbose_name=_('Должность'))
    department = models.CharField(max_length=100, blank=True, verbose_name=_('Кафедра'))
    academic_degree = models.CharField(max_length=100, blank=True, verbose_name=_('Учёная степень'))
    
    class Meta:
        verbose_name = _('Профиль преподавателя')
        verbose_name_plural = _('Профили преподавателей')
    
    def __str__(self):
        return f"{self.user.username} - {self.user.get_full_name() or self.user.email}"


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Создает профиль пользователя при его регистрации."""
    if created:
        if instance.is_student():
            StudentProfile.objects.create(user=instance)
        elif instance.is_teacher():
            TeacherProfile.objects.create(user=instance)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """Сохраняет профиль пользователя при сохранении пользователя."""
    if instance.is_student() and hasattr(instance, 'student_profile'):
        instance.student_profile.save()
    elif instance.is_teacher() and hasattr(instance, 'teacher_profile'):
        instance.teacher_profile.save() 