from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssignmentViewSet, AssignmentAttachmentViewSet,
    AssignmentGroupViewSet, SubmissionViewSet,
    SubmissionAttachmentViewSet
)


# Create a custom router that doesn't enforce trailing slashes
class NoTrailingSlashRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = ""


router = NoTrailingSlashRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'attachments', AssignmentAttachmentViewSet, basename='assignment-attachment')
router.register(r'assignment-groups', AssignmentGroupViewSet, basename='assignment-group')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'submission-attachments', SubmissionAttachmentViewSet, basename='submission-attachment')

urlpatterns = [
    path('', include(router.urls)),
]