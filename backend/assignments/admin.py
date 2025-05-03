from django.contrib import admin
from .models import (
    Assignment, AssignmentAttachment, AssignmentGroup,
    Submission, SubmissionAttachment
)


class AssignmentAttachmentInline(admin.TabularInline):
    model = AssignmentAttachment
    extra = 1


class AssignmentGroupInline(admin.TabularInline):
    model = AssignmentGroup
    extra = 1
    autocomplete_fields = ['group']


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'status', 'deadline', 'is_deadline_expired')
    list_filter = ('status', 'created_at', 'deadline')
    search_fields = ('title', 'description')
    readonly_fields = ('created_at', 'updated_at', 'is_deadline_expired', 'submission_count')
    date_hierarchy = 'created_at'
    inlines = [AssignmentAttachmentInline, AssignmentGroupInline]
    
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'created_by', 'status')
        }),
        ('Временные рамки', {
            'fields': ('deadline', 'is_deadline_expired')
        }),
        ('Оценивание', {
            'fields': ('max_points', 'allow_late_submissions', 'late_penalty_percentage')
        }),
        ('Информация', {
            'fields': ('created_at', 'updated_at', 'submission_count')
        })
    )


class SubmissionAttachmentInline(admin.TabularInline):
    model = SubmissionAttachment
    extra = 1


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'student', 'status', 'points', 'submitted_at', 'is_late')
    list_filter = ('status', 'is_late', 'submitted_at')
    search_fields = ('assignment__title', 'student__user__username', 'comment')
    readonly_fields = ('submitted_at', 'updated_at', 'is_late')
    date_hierarchy = 'submitted_at'
    inlines = [SubmissionAttachmentInline]
    
    fieldsets = (
        (None, {
            'fields': ('assignment', 'student', 'status')
        }),
        ('Комментарии', {
            'fields': ('comment', 'feedback')
        }),
        ('Оценивание', {
            'fields': ('points', 'graded_by', 'graded_at')
        }),
        ('Информация', {
            'fields': ('submitted_at', 'updated_at', 'is_late')
        })
    )


@admin.register(AssignmentGroup)
class AssignmentGroupAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'group', 'assigned_at', 'custom_deadline')
    list_filter = ('assigned_at',)
    search_fields = ('assignment__title', 'group__name')
    readonly_fields = ('assigned_at', 'effective_deadline')
    date_hierarchy = 'assigned_at'
    
    fieldsets = (
        (None, {
            'fields': ('assignment', 'group')
        }),
        ('Временные рамки', {
            'fields': ('assigned_at', 'custom_deadline', 'effective_deadline')
        })
    ) 