from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.crypto import get_random_string
from authentication.models import TeacherProfile, StudentProfile


class Group(models.Model):
    """Модель для учебных групп студентов."""
    name = models.CharField(max_length=100, verbose_name=_('Название группы'))
    code = models.CharField(max_length=10, unique=True, verbose_name=_('Код группы'))
    description = models.TextField(blank=True, verbose_name=_('Описание'))
    created_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='created_groups',
        verbose_name=_('Создатель')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата обновления'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активна'))

    class Meta:
        verbose_name = _('Группа')
        verbose_name_plural = _('Группы')
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Автоматически генерировать код группы, если он не указан
        if not self.code:
            self.code = self._generate_unique_code()
        super().save(*args, **kwargs)

    def _generate_unique_code(self):
        """Генерирует уникальный код для группы."""
        code = get_random_string(length=6, allowed_chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
        while Group.objects.filter(code=code).exists():
            code = get_random_string(length=6, allowed_chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
        return code
    
    @property
    def get_member_count(self):
        """Возвращает количество активных участников группы."""
        return self.memberships.filter(is_active=True).count()
    
    @property
    def get_teacher_count(self):
        """Возвращает количество преподавателей группы."""
        return self.teachers.filter(is_active=True).count()


class GroupMembership(models.Model):
    """Модель для связи студентов с группами."""
    ROLE_MEMBER = 'member'
    ROLE_MONITOR = 'monitor'  # староста группы
    
    ROLE_CHOICES = [
        (ROLE_MEMBER, _('Участник')),
        (ROLE_MONITOR, _('Староста')),
    ]
    
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='memberships',
        verbose_name=_('Группа')
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='group_memberships',
        verbose_name=_('Студент')
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_MEMBER,
        verbose_name=_('Роль в группе')
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата присоединения'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активен'))

    class Meta:
        verbose_name = _('Участие в группе')
        verbose_name_plural = _('Участия в группах')
        unique_together = ['group', 'student']
        ordering = ['group', 'joined_at']

    def __str__(self):
        return f"{self.student} - {self.group}"


class GroupTeacher(models.Model):
    """Модель для связи преподавателей с группами."""
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='teachers',
        verbose_name=_('Группа')
    )
    teacher = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='teaching_groups',
        verbose_name=_('Преподаватель')
    )
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата присоединения'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активен'))

    class Meta:
        verbose_name = _('Преподаватель группы')
        verbose_name_plural = _('Преподаватели групп')
        unique_together = ['group', 'teacher']
        ordering = ['group', 'joined_at']

    def __str__(self):
        return f"{self.teacher} - {self.group}" 