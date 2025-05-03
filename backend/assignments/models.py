from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from authentication.models import TeacherProfile, StudentProfile
from groups.models import Group


class Assignment(models.Model):
    """Модель для учебных заданий."""
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_ARCHIVED = 'archived'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, _('Черновик')),
        (STATUS_PUBLISHED, _('Опубликовано')),
        (STATUS_ARCHIVED, _('Архивировано')),
    ]
    
    title = models.CharField(max_length=255, verbose_name=_('Название задания'))
    description = models.TextField(verbose_name=_('Описание задания'))
    created_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.CASCADE,
        related_name='created_assignments',
        verbose_name=_('Создатель')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата создания'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата обновления'))
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        verbose_name=_('Статус')
    )
    deadline = models.DateTimeField(verbose_name=_('Срок сдачи'))
    max_points = models.PositiveIntegerField(default=100, verbose_name=_('Максимальное количество баллов'))
    allow_late_submissions = models.BooleanField(default=True, verbose_name=_('Разрешить сдачу после дедлайна'))
    late_penalty_percentage = models.PositiveIntegerField(
        default=0, 
        verbose_name=_('Процент штрафа за позднюю сдачу')
    )
    
    groups = models.ManyToManyField(
        Group,
        through='AssignmentGroup',
        related_name='assignments',
        verbose_name=_('Назначенные группы')
    )

    class Meta:
        verbose_name = _('Задание')
        verbose_name_plural = _('Задания')
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
    @property
    def is_deadline_expired(self):
        """Проверяет, истек ли срок сдачи задания."""
        return timezone.now() > self.deadline
    
    @property
    def time_remaining(self):
        """Возвращает оставшееся время до дедлайна."""
        if self.is_deadline_expired:
            return None
        return self.deadline - timezone.now()
    
    @property
    def submission_count(self):
        """Возвращает количество ответов на задание."""
        return self.submissions.count()


class AssignmentAttachment(models.Model):
    """Модель для файлов, прикрепленных к заданию."""
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('Задание')
    )
    file = models.FileField(upload_to='assignments/attachments/', verbose_name=_('Файл'))
    filename = models.CharField(max_length=255, verbose_name=_('Имя файла'))
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата загрузки'))

    class Meta:
        verbose_name = _('Вложение задания')
        verbose_name_plural = _('Вложения заданий')

    def __str__(self):
        return f"{self.filename} - {self.assignment.title}"


class AssignmentGroup(models.Model):
    """Модель связи заданий с группами."""
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='assignment_groups',
        verbose_name=_('Задание')
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='group_assignments',
        verbose_name=_('Группа')
    )
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата назначения'))
    custom_deadline = models.DateTimeField(null=True, blank=True, verbose_name=_('Индивидуальный дедлайн'))

    class Meta:
        verbose_name = _('Назначение задания группе')
        verbose_name_plural = _('Назначения заданий группам')
        unique_together = ['assignment', 'group']

    def __str__(self):
        return f"{self.assignment.title} - {self.group.name}"
    
    @property
    def effective_deadline(self):
        """Возвращает действующий дедлайн для группы."""
        return self.custom_deadline or self.assignment.deadline


class Submission(models.Model):
    """Модель для ответов студентов на задания."""
    STATUS_SUBMITTED = 'submitted'
    STATUS_GRADED = 'graded'
    STATUS_RETURNED = 'returned'
    
    STATUS_CHOICES = [
        (STATUS_SUBMITTED, _('Отправлено')),
        (STATUS_GRADED, _('Оценено')),
        (STATUS_RETURNED, _('Возвращено на доработку')),
    ]
    
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name=_('Задание')
    )
    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name=_('Студент')
    )
    submitted_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата отправки'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата обновления'))
    comment = models.TextField(blank=True, verbose_name=_('Комментарий'))
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default=STATUS_SUBMITTED,
        verbose_name=_('Статус')
    )
    points = models.PositiveIntegerField(null=True, blank=True, verbose_name=_('Оценка'))
    is_late = models.BooleanField(default=False, verbose_name=_('Сдано после дедлайна'))
    feedback = models.TextField(blank=True, verbose_name=_('Обратная связь от преподавателя'))
    graded_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_submissions',
        verbose_name=_('Оценил')
    )
    graded_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Дата оценивания'))

    class Meta:
        verbose_name = _('Ответ на задание')
        verbose_name_plural = _('Ответы на задания')
        ordering = ['-submitted_at']
        unique_together = ['assignment', 'student']

    def __str__(self):
        return f"{self.student} - {self.assignment.title}"
    
    def save(self, *args, **kwargs):
        # Проверяем, сдано ли после дедлайна
        assignment_group = AssignmentGroup.objects.filter(
            assignment=self.assignment,
            group__memberships__student=self.student,
            group__memberships__is_active=True
        ).first()
        
        if assignment_group:
            deadline = assignment_group.effective_deadline
            self.is_late = timezone.now() > deadline
            
        # Если это новая запись (первая сдача)
        if not self.pk and self.is_late and self.assignment.allow_late_submissions:
            # Применяем штраф за позднюю сдачу
            max_points = self.assignment.max_points
            penalty = self.assignment.late_penalty_percentage / 100
            self.points = int(max_points * (1 - penalty))
            
        super().save(*args, **kwargs)


class SubmissionAttachment(models.Model):
    """Модель для файлов, прикрепленных к ответу на задание."""
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('Ответ')
    )
    file = models.FileField(upload_to='submissions/attachments/', verbose_name=_('Файл'))
    filename = models.CharField(max_length=255, verbose_name=_('Имя файла'))
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата загрузки'))

    class Meta:
        verbose_name = _('Вложение ответа')
        verbose_name_plural = _('Вложения ответов')

    def __str__(self):
        return f"{self.filename} - {self.submission}" 