from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from api.models import Profile

User = get_user_model()

class GroupSyncTests(TestCase):
    def setUp(self):
        # ensure groups are created fresh each test
        Group.objects.all().delete()

    def test_signal_assigns_groups_on_profile_save(self):
        user = User.objects.create_user(username='bob', password='pwd')
        # profile should exist via post_save signal
        profile = Profile.objects.get(user=user)
        profile.role = 'teacher'
        profile.save()

        # teacher role maps to Course Creators, Grade Managers, Content Moderators
        names = set(g.name for g in user.groups.all())
        self.assertIn('Course Creators', names)
        self.assertIn('Grade Managers', names)
        self.assertIn('Content Moderators', names)

    def test_management_command_creates_groups_and_syncs(self):
        # create a user and profile with role student and teacher
        s = User.objects.create_user(username='s', password='p')
        t = User.objects.create_user(username='t', password='p')
        Profile.objects.filter(user=s).update(role='student')
        Profile.objects.filter(user=t).update(role='teacher')

        # run command without sync; groups should exist but no membership set
        call_command('init_groups')
        self.assertTrue(Group.objects.filter(name='Course Creators').exists())
        self.assertTrue(Group.objects.filter(name='Parents').exists())

        self.assertEqual(s.groups.count(), 0)
        self.assertEqual(t.groups.count(), 0)

        # run with sync_users flag
        call_command('init_groups', '--sync-users')
        # student still none
        self.assertEqual(s.groups.count(), 0)
        # teacher gets at least Course Creators
        self.assertTrue(t.groups.filter(name='Course Creators').exists())
