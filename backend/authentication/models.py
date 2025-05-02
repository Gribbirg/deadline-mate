from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


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
    
    class Meta:
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        
    def is_student(self):
        return self.role == self.ROLE_STUDENT
        
    def is_teacher(self):
        return self.role == self.ROLE_TEACHER 