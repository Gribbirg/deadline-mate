from rest_framework import permissions


class IsTeacherOrReadOnly(permissions.BasePermission):
    """
    Разрешает создание групп только преподавателям.
    Для остальных операций разрешает только чтение.
    """
    
    def has_permission(self, request, view):
        # Разрешаем GET, HEAD, OPTIONS запросы всем пользователям
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Разрешаем POST, PUT, DELETE только преподавателям
        return request.user.is_authenticated and request.user.is_teacher()


class IsTeacherGroupOwnerOrReadOnly(permissions.BasePermission):
    """
    Разрешает изменение групп любым преподавателям.
    Для остальных операций разрешает только чтение.
    """
    
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD, OPTIONS запросы всем пользователям
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Разрешаем доступ любому преподавателю
        return (request.user.is_authenticated and request.user.is_teacher())


class IsGroupMember(permissions.BasePermission):
    """
    Разрешает доступ участникам группы, а также всем преподавателям.
    """
    
    def has_object_permission(self, request, view, obj):
        # Всегда разрешаем любому преподавателю
        if (request.user.is_authenticated and request.user.is_teacher()):
            return True
        
        # Для студентов проверяем членство в группе
        if (request.user.is_authenticated and 
            request.user.is_student() and 
            hasattr(request.user, 'student_profile')):
            return obj.memberships.filter(
                student=request.user.student_profile,
                is_active=True
            ).exists()
        
        return False 