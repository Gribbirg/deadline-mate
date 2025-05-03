from django.contrib import admin
from .models import Group, GroupMembership, GroupTeacher


class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    extra = 0
    fields = ['student', 'role', 'joined_at', 'is_active']
    readonly_fields = ['joined_at']
    autocomplete_fields = ['student']
    can_delete = False


class GroupTeacherInline(admin.TabularInline):
    model = GroupTeacher
    extra = 0
    readonly_fields = ('joined_at',)


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_by', 'created_at', 'is_active', 'get_member_count', 'get_teacher_count']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['code', 'created_at', 'updated_at']
    autocomplete_fields = ['created_by']
    inlines = [GroupMembershipInline, GroupTeacherInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'code', 'description', 'created_by', 'is_active')
        }),
        ('Информация о создании', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_member_count(self, obj):
        return obj.get_member_count
    get_member_count.short_description = 'Количество участников'
    
    def get_teacher_count(self, obj):
        return obj.get_teacher_count
    get_teacher_count.short_description = 'Количество преподавателей'


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ['group', 'student', 'role', 'joined_at', 'is_active']
    list_filter = ['is_active', 'role', 'joined_at', 'group']
    search_fields = ['student__user__username', 'student__user__first_name', 
                     'student__user__last_name', 'group__name', 'group__code']
    autocomplete_fields = ['group', 'student']
    readonly_fields = ['joined_at']
    fieldsets = (
        (None, {
            'fields': ('group', 'student', 'role', 'is_active')
        }),
        ('Информация о присоединении', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(GroupTeacher)
class GroupTeacherAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'group', 'joined_at', 'is_active')
    list_filter = ('is_active', 'joined_at')
    search_fields = ('teacher__user__username', 'teacher__user__first_name', 'teacher__user__last_name', 'group__name')
    readonly_fields = ('joined_at',)
    fieldsets = (
        (None, {
            'fields': ('teacher', 'group', 'is_active')
        }),
        ('Информация о присоединении', {
            'fields': ('joined_at',),
            'classes': ('collapse',)
        }),
    ) 