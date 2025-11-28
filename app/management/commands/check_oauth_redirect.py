from django.core.management.base import BaseCommand
from django.test import RequestFactory
from django.contrib.sites.models import Site


class Command(BaseCommand):
    help = 'Check what redirect URI your application is using for Google OAuth'

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            type=str,
            default='127.0.0.1:8000',
            help='Host to check redirect URI for (default: 127.0.0.1:8000)',
        )

    def handle(self, *args, **options):
        host = options['host']
        
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.SUCCESS('Google OAuth Redirect URI Checker'))
        self.stdout.write('=' * 60)
        self.stdout.write('')
        
        # Get current site
        try:
            site = Site.objects.get_current()
            self.stdout.write(f'Current Site: {site.domain} (ID: {site.id})')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not get current site: {e}'))
            site = None
        
        self.stdout.write('')
        
        # Construct the redirect URI
        # django-allauth uses: /accounts/{provider}/login/callback/
        redirect_uri = f'http://{host}/accounts/google/login/callback/'
        
        self.stdout.write(self.style.SUCCESS('Expected Redirect URI:'))
        self.stdout.write(f'  {redirect_uri}')
        self.stdout.write('')
        
        self.stdout.write('=' * 60)
        self.stdout.write(self.style.WARNING('ACTION REQUIRED:'))
        self.stdout.write('=' * 60)
        self.stdout.write('')
        self.stdout.write('Make sure this EXACT URI is added to your Google Cloud Console:')
        self.stdout.write('')
        self.stdout.write('1. Go to: https://console.cloud.google.com/')
        self.stdout.write('2. Navigate to: APIs & Services → Credentials')
        self.stdout.write('3. Click on your OAuth 2.0 Client ID')
        self.stdout.write('4. Under "Authorized redirect URIs", add:')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'   {redirect_uri}'))
        self.stdout.write('')
        
        # Also suggest localhost variant
        if '127.0.0.1' in host:
            localhost_uri = redirect_uri.replace('127.0.0.1', 'localhost')
            self.stdout.write('   And also add (recommended):')
            self.stdout.write(self.style.SUCCESS(f'   {localhost_uri}'))
            self.stdout.write('')
        
        self.stdout.write('5. Click "Save"')
        self.stdout.write('6. Wait 2-5 minutes for changes to propagate')
        self.stdout.write('7. Try logging in again')
        self.stdout.write('')
        self.stdout.write('=' * 60)

