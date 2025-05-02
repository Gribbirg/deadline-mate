import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from authentication.models import StudentProfile, TeacherProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds the database with test users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--students',
            type=int,
            default=10,
            help='Number of student users to create'
        )
        parser.add_argument(
            '--teachers',
            type=int,
            default=5,
            help='Number of teacher users to create'
        )

    def handle(self, *args, **options):
        num_students = options['students']
        num_teachers = options['teachers']
        
        self.stdout.write(self.style.SUCCESS(
            f'Creating {num_students} students and {num_teachers} teachers...'
        ))
        
        # Создаем преподавателей
        self._create_teachers(num_teachers)
        
        # Создаем студентов
        self._create_students(num_students)
        
        self.stdout.write(self.style.SUCCESS('Successfully created test users!'))
    
    def _create_teachers(self, count):
        """Создает тестовых преподавателей."""
        positions = ['Профессор', 'Доцент', 'Старший преподаватель', 'Ассистент']
        departments = ['Компьютерные науки', 'Математика', 'Физика', 'Информатика']
        degrees = ['Доктор наук', 'Кандидат наук', 'Магистр', 'PhD']
        
        for i in range(count):
            username = f'teacher{i+1}'
            # Проверяем, существует ли уже пользователь
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'User {username} already exists, skipping')
                continue
                
            user = User.objects.create_user(
                username=username,
                email=f'teacher{i+1}@example.com',
                password='Test1234',
                first_name=f'Name{i+1}',
                last_name=f'Teacher{i+1}',
                role=User.ROLE_TEACHER
            )
            
            # Обновляем профиль
            profile = user.teacher_profile
            profile.position = random.choice(positions)
            profile.department = random.choice(departments)
            profile.academic_degree = random.choice(degrees)
            profile.bio = f'Преподаватель {profile.position.lower()} кафедры {profile.department.lower()}'
            profile.save()
            
            self.stdout.write(f'Created teacher: {user.username}')
    
    def _create_students(self, count):
        """Создает тестовых студентов."""
        majors = ['Программная инженерия', 'Информационные системы', 
                 'Компьютерная безопасность', 'Прикладная математика']
        years = [1, 2, 3, 4, 5]
        
        for i in range(count):
            username = f'student{i+1}'
            # Проверяем, существует ли уже пользователь
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'User {username} already exists, skipping')
                continue
                
            user = User.objects.create_user(
                username=username,
                email=f'student{i+1}@example.com',
                password='Test1234',
                first_name=f'Name{i+1}',
                last_name=f'Student{i+1}',
                role=User.ROLE_STUDENT
            )
            
            # Обновляем профиль
            profile = user.student_profile
            profile.major = random.choice(majors)
            profile.year_of_study = random.choice(years)
            profile.student_id = f'S{100000+i}'
            profile.bio = f'Студент {profile.year_of_study} курса направления {profile.major.lower()}'
            profile.save()
            
            self.stdout.write(f'Created student: {user.username}') 