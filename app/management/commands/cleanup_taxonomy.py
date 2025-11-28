from django.core.management.base import BaseCommand
from app.models import TreeSpecies, TreeGenus, TreeFamily, EndemicTree, Location


class Command(BaseCommand):
    help = 'Delete all orphaned taxonomy records (species, genus, family, locations) that are not referenced by any trees'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-all',
            action='store_true',
            help='Delete ALL taxonomy and location records regardless of whether they are referenced by trees (WARNING: This will break existing tree records!)',
        )
        parser.add_argument(
            '--yes',
            action='store_true',
            help='Skip confirmation prompt (use with --force-all)',
        )

    def handle(self, *args, **options):
        force_all = options['force_all']
        
        if force_all:
            self.stdout.write(self.style.WARNING(
                'WARNING: --force-all flag is set. This will delete ALL taxonomy and location records, '
                'which may break existing tree records if they reference these records!'
            ))
            if not options.get('yes', False):
                try:
                    confirm = input('Are you sure you want to continue? Type "yes" to confirm: ')
                    if confirm.lower() != 'yes':
                        self.stdout.write(self.style.ERROR('Operation cancelled.'))
                        return
                except (EOFError, KeyboardInterrupt):
                    self.stdout.write(self.style.ERROR('Operation cancelled (no input available).'))
                    self.stdout.write(self.style.WARNING('Use --yes flag to skip confirmation.'))
                    return
        
        # Get counts before deletion
        species_count_before = TreeSpecies.objects.count()
        genus_count_before = TreeGenus.objects.count()
        family_count_before = TreeFamily.objects.count()
        location_count_before = Location.objects.count()
        
        self.stdout.write(f'Initial counts:')
        self.stdout.write(f'  Species: {species_count_before}')
        self.stdout.write(f'  Genus: {genus_count_before}')
        self.stdout.write(f'  Family: {family_count_before}')
        self.stdout.write(f'  Locations: {location_count_before}')
        self.stdout.write('')
        
        if force_all:
            # Delete all taxonomy and location records
            deleted_species = TreeSpecies.objects.all().delete()
            deleted_genus = TreeGenus.objects.all().delete()
            deleted_family = TreeFamily.objects.all().delete()
            deleted_locations = Location.objects.all().delete()
            
            self.stdout.write(self.style.SUCCESS(
                f'Deleted all taxonomy and location records:'
            ))
            self.stdout.write(f'  Species: {deleted_species[0]} records')
            self.stdout.write(f'  Genus: {deleted_genus[0]} records')
            self.stdout.write(f'  Family: {deleted_family[0]} records')
            self.stdout.write(f'  Locations: {deleted_locations[0]} records')
        else:
            # Only delete orphaned records (not referenced by any trees)
            deleted_species_count = 0
            deleted_genus_count = 0
            deleted_family_count = 0
            deleted_location_count = 0
            
            # Delete orphaned species
            orphaned_species = TreeSpecies.objects.filter(trees__isnull=True)
            species_to_delete = list(orphaned_species)
            for species in species_to_delete:
                genus = species.genus
                species.delete()
                deleted_species_count += 1
                
                # Check if genus is now orphaned
                if genus and not genus.species.exists():
                    family = genus.family
                    genus.delete()
                    deleted_genus_count += 1
                    
                    # Check if family is now orphaned
                    if family and not family.genera.exists():
                        family.delete()
                        deleted_family_count += 1
            
            # Also check for any remaining orphaned genera
            orphaned_genera = TreeGenus.objects.filter(species__isnull=True)
            for genus in orphaned_genera:
                family = genus.family
                genus.delete()
                deleted_genus_count += 1
                
                # Check if family is now orphaned
                if family and not family.genera.exists():
                    family.delete()
                    deleted_family_count += 1
            
            # Also check for any remaining orphaned families
            orphaned_families = TreeFamily.objects.filter(genera__isnull=True)
            for family in orphaned_families:
                family.delete()
                deleted_family_count += 1
            
            # Delete orphaned locations (not referenced by any trees)
            orphaned_locations = Location.objects.filter(trees__isnull=True)
            for location in orphaned_locations:
                location.delete()
                deleted_location_count += 1
            
            self.stdout.write(self.style.SUCCESS(
                f'Deleted orphaned taxonomy and location records:'
            ))
            self.stdout.write(f'  Species: {deleted_species_count} records')
            self.stdout.write(f'  Genus: {deleted_genus_count} records')
            self.stdout.write(f'  Family: {deleted_family_count} records')
            self.stdout.write(f'  Locations: {deleted_location_count} records')
        
        # Get final counts
        species_count_after = TreeSpecies.objects.count()
        genus_count_after = TreeGenus.objects.count()
        family_count_after = TreeFamily.objects.count()
        location_count_after = Location.objects.count()
        
        self.stdout.write('')
        self.stdout.write(f'Final counts:')
        self.stdout.write(f'  Species: {species_count_after}')
        self.stdout.write(f'  Genus: {genus_count_after}')
        self.stdout.write(f'  Family: {family_count_after}')
        self.stdout.write(f'  Locations: {location_count_after}')
        
        if not force_all and (species_count_after > 0 or genus_count_after > 0 or family_count_after > 0 or location_count_after > 0):
            self.stdout.write('')
            self.stdout.write(self.style.WARNING(
                'Some taxonomy or location records remain because they are still referenced by tree records.'
            ))
            self.stdout.write(self.style.WARNING(
                'To delete ALL records (including those in use), use: python manage.py cleanup_taxonomy --force-all --yes'
            ))

