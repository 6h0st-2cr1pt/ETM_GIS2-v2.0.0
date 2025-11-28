"""
Management command to delete all tree data from the database
while preserving user accounts and user profiles.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from app.models import (
    EndemicTree, TreeSeed, TreeSpecies, TreeGenus, 
    TreeFamily, Location, User, UserProfile
)


class Command(BaseCommand):
    help = 'Delete all tree data (EndemicTree, TreeSeed) and clean up orphaned taxonomy and locations. Preserves User accounts and UserProfile records.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required to actually delete data)',
        )
        parser.add_argument(
            '--keep-taxonomy',
            action='store_true',
            help='Keep TreeSpecies, TreeGenus, TreeFamily even if orphaned',
        )
        parser.add_argument(
            '--keep-locations',
            action='store_true',
            help='Keep Location records even if orphaned',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  This command will delete ALL tree data from the database!\n'
                    '⚠️  User accounts and profiles will be preserved.\n\n'
                    'To proceed, run with --confirm flag:\n'
                    '  python manage.py delete_all_tree_data --confirm'
                )
            )
            return

        self.stdout.write(self.style.WARNING('Starting deletion of all tree data...\n'))

        with transaction.atomic():
            # Count records before deletion
            tree_count = EndemicTree.objects.count()
            seed_count = TreeSeed.objects.count()
            species_count = TreeSpecies.objects.count()
            genus_count = TreeGenus.objects.count()
            family_count = TreeFamily.objects.count()
            location_count = Location.objects.count()
            user_count = User.objects.count()
            profile_count = UserProfile.objects.count()

            self.stdout.write(f'Current counts:')
            self.stdout.write(f'  - EndemicTree records: {tree_count}')
            self.stdout.write(f'  - TreeSeed records: {seed_count}')
            self.stdout.write(f'  - TreeSpecies records: {species_count}')
            self.stdout.write(f'  - TreeGenus records: {genus_count}')
            self.stdout.write(f'  - TreeFamily records: {family_count}')
            self.stdout.write(f'  - Location records: {location_count}')
            self.stdout.write(f'  - User accounts: {user_count} (will be preserved)')
            self.stdout.write(f'  - UserProfile records: {profile_count} (will be preserved)\n')

            # Step 1: Delete all EndemicTree records
            self.stdout.write('Step 1: Deleting all EndemicTree records...')
            deleted_trees = EndemicTree.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Deleted {deleted_trees[0]} EndemicTree records')
            )

            # Step 2: Delete all TreeSeed records
            self.stdout.write('Step 2: Deleting all TreeSeed records...')
            deleted_seeds = TreeSeed.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS(f'  ✓ Deleted {deleted_seeds[0]} TreeSeed records')
            )

            # Step 3: Clean up orphaned taxonomy (if not keeping)
            if not options['keep_taxonomy']:
                self.stdout.write('Step 3: Cleaning up orphaned taxonomy...')
                
                # Delete TreeSpecies that have no trees or seeds
                orphaned_species = TreeSpecies.objects.filter(
                    trees__isnull=True,
                    seeds__isnull=True
                )
                species_deleted = orphaned_species.count()
                orphaned_species.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Deleted {species_deleted} orphaned TreeSpecies records')
                )

                # Delete TreeGenus that have no species
                orphaned_genera = TreeGenus.objects.filter(
                    species__isnull=True
                )
                genera_deleted = orphaned_genera.count()
                orphaned_genera.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Deleted {genera_deleted} orphaned TreeGenus records')
                )

                # Delete TreeFamily that have no genera
                orphaned_families = TreeFamily.objects.filter(
                    genera__isnull=True
                )
                families_deleted = orphaned_families.count()
                orphaned_families.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Deleted {families_deleted} orphaned TreeFamily records')
                )
            else:
                self.stdout.write('Step 3: Skipping taxonomy cleanup (--keep-taxonomy flag set)')

            # Step 4: Clean up orphaned locations (if not keeping)
            if not options['keep_locations']:
                self.stdout.write('Step 4: Cleaning up orphaned locations...')
                orphaned_locations = Location.objects.filter(
                    trees__isnull=True,
                    seeds__isnull=True
                )
                locations_deleted = orphaned_locations.count()
                orphaned_locations.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ Deleted {locations_deleted} orphaned Location records')
                )
            else:
                self.stdout.write('Step 4: Skipping location cleanup (--keep-locations flag set)')

            # Verify user accounts are preserved
            final_user_count = User.objects.count()
            final_profile_count = UserProfile.objects.count()

            self.stdout.write('\n' + '='*60)
            self.stdout.write(self.style.SUCCESS('✓ Deletion completed successfully!'))
            self.stdout.write('='*60)
            self.stdout.write(f'\nFinal counts:')
            self.stdout.write(f'  - EndemicTree records: {EndemicTree.objects.count()}')
            self.stdout.write(f'  - TreeSeed records: {TreeSeed.objects.count()}')
            self.stdout.write(f'  - TreeSpecies records: {TreeSpecies.objects.count()}')
            self.stdout.write(f'  - TreeGenus records: {TreeGenus.objects.count()}')
            self.stdout.write(f'  - TreeFamily records: {TreeFamily.objects.count()}')
            self.stdout.write(f'  - Location records: {Location.objects.count()}')
            self.stdout.write(f'  - User accounts: {final_user_count} (preserved)')
            self.stdout.write(f'  - UserProfile records: {final_profile_count} (preserved)')

            if final_user_count != user_count:
                self.stdout.write(
                    self.style.ERROR(
                        f'\n⚠️  WARNING: User count changed from {user_count} to {final_user_count}!'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'\n✓ All {user_count} user accounts preserved successfully!')
                )

