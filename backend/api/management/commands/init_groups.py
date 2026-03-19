from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission

class Command(BaseCommand):
    help = 'Initialize default groups and permissions'

    def handle(self, *args, **options):
        groups = ['Admin', 'Teacher', 'Student', 'Parent', 'Parents', 'User Managers', 'Non-Teaching Staff', 'Visitors', 'Course Creators']
        
        for group_name in groups:
            group, created = Group.objects.get_or_create(name=group_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created group: {group_name}'))
            else:
                self.stdout.write(f'Group already exists: {group_name}')
        
        self.stdout.write(self.style.SUCCESS('Groups initialized successfully'))