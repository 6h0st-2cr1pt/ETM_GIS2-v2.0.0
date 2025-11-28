from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from collections import defaultdict


class Command(BaseCommand):
    help = 'Clean up duplicate SocialApp entries for the same provider and site'

    def add_arguments(self, parser):
        parser.add_argument(
            '--provider',
            type=str,
            help='Specific provider to clean up (e.g., "google"). If not specified, all providers will be checked.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting anything',
        )
        parser.add_argument(
            '--keep-first',
            action='store_true',
            default=True,
            help='Keep the first app and delete duplicates (default: True)',
        )

    def handle(self, *args, **options):
        provider_filter = options.get('provider')
        dry_run = options.get('dry_run', False)
        keep_first = options.get('keep_first', True)

        # Get all social apps
        apps = SocialApp.objects.all()
        if provider_filter:
            apps = apps.filter(provider=provider_filter)
            self.stdout.write(f'Checking SocialApp entries for provider: {provider_filter}')
        else:
            self.stdout.write('Checking all SocialApp entries...')

        # Group apps by provider and sites
        app_groups = defaultdict(list)
        for app in apps:
            # Create a key based on provider and associated sites
            sites = tuple(sorted(app.sites.values_list('id', flat=True)))
            key = (app.provider, sites)
            app_groups[key].append(app)

        total_duplicates = 0
        apps_to_delete = []

        for (provider, sites), app_list in app_groups.items():
            if len(app_list) > 1:
                total_duplicates += len(app_list) - 1
                self.stdout.write('')
                self.stdout.write(self.style.WARNING(
                    f'Found {len(app_list)} SocialApp entries for provider "{provider}" '
                    f'with sites {sites}:'
                ))
                
                # Sort by ID to keep the first (oldest) one
                app_list_sorted = sorted(app_list, key=lambda x: x.id)
                
                for idx, app in enumerate(app_list_sorted):
                    site_names = ', '.join(app.sites.values_list('domain', flat=True))
                    status = 'KEEP' if idx == 0 and keep_first else 'DELETE'
                    self.stdout.write(
                        f'  [{status}] ID: {app.id}, Name: "{app.name}", '
                        f'Client ID: {app.client_id[:20]}..., Sites: {site_names}'
                    )
                    if idx > 0 or not keep_first:
                        apps_to_delete.append(app)

        if total_duplicates == 0:
            self.stdout.write(self.style.SUCCESS('No duplicate SocialApp entries found.'))
            return

        self.stdout.write('')
        self.stdout.write(f'Total duplicates found: {total_duplicates}')

        if dry_run:
            self.stdout.write(self.style.WARNING(
                'DRY RUN: No changes were made. Remove --dry-run to actually delete duplicates.'
            ))
        else:
            if apps_to_delete:
                self.stdout.write('')
                self.stdout.write(self.style.WARNING(
                    f'About to delete {len(apps_to_delete)} duplicate SocialApp entries...'
                ))
                
                for app in apps_to_delete:
                    app_name = app.name
                    app_provider = app.provider
                    app.delete()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Deleted SocialApp: ID {app.id}, Name: "{app_name}", Provider: {app_provider}'
                        )
                    )
                
                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS(
                    f'Successfully deleted {len(apps_to_delete)} duplicate SocialApp entries.'
                ))
                self.stdout.write(self.style.SUCCESS(
                    'The Google OAuth login should now work correctly.'
                ))

