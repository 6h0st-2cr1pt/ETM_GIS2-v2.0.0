"""
Management command to create superuser from environment variables.
This is useful for platforms like Render that don't provide shell access.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import IntegrityError


class Command(BaseCommand):
    help = 'Create superuser from environment variables (for platforms without shell access)'

    def handle(self, *args, **options):
        import os
        
        # Get superuser credentials from environment variables
        admin_username = os.getenv('DJANGO_SUPERUSER_USERNAME')
        admin_email = os.getenv('DJANGO_SUPERUSER_EMAIL')
        admin_password = os.getenv('DJANGO_SUPERUSER_PASSWORD')
        
        # Check if all required variables are set
        if not all([admin_username, admin_email, admin_password]):
            self.stdout.write(
                self.style.WARNING(
                    'Superuser not created. Missing environment variables:\n'
                    '  - DJANGO_SUPERUSER_USERNAME\n'
                    '  - DJANGO_SUPERUSER_EMAIL\n'
                    '  - DJANGO_SUPERUSER_PASSWORD\n\n'
                    'Set these in Render dashboard to create superuser automatically.'
                )
            )
            return
        
        # Check if superuser already exists
        if User.objects.filter(username=admin_username).exists():
            self.stdout.write(
                self.style.SUCCESS(f'Superuser "{admin_username}" already exists. Skipping creation.')
            )
            return
        
        # Create superuser
        try:
            User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created superuser "{admin_username}"'
                )
            )
        except IntegrityError:
            self.stdout.write(
                self.style.WARNING(
                    f'Superuser "{admin_username}" already exists.'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating superuser: {str(e)}')
            )

