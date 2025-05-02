from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, StudentProfile, TeacherProfile


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = _('Профиль студента')
    fk_name = 'user'


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    can_delete = False
    verbose_name_plural = _('Профиль преподавателя')
    fk_name = 'user'


class CustomUserAdmin(UserAdmin):
    """Админка для кастомной модели пользователя с профилями."""
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Permissions'), {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            ),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
        (_('Custom fields'), {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'role', 'groups')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    def get_inlines(self, request, obj=None):
        if obj:
            if obj.is_student():
                return [StudentProfileInline]
            elif obj.is_teacher():
                return [TeacherProfileInline]
        return []


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'student_id', 'major', 'year_of_study')
    search_fields = ('user__username', 'user__email', 'student_id')
    list_filter = ('year_of_study',)


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'department', 'academic_degree')
    search_fields = ('user__username', 'user__email', 'department')
    list_filter = ('position', 'department')


admin.site.register(CustomUser, CustomUserAdmin) 