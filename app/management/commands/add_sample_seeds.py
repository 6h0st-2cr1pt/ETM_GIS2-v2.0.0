from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from app.models import TreeFamily, TreeGenus, TreeSpecies, Location, TreeSeed


class Command(BaseCommand):
    help = 'Add sample seed planting data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Adding sample seed planting data...')

        # Create sample families if they don't exist
        families_data = [
            {'name': 'Fabaceae', 'description': 'Legume family'},
            {'name': 'Dipterocarpaceae', 'description': 'Dipterocarp family'},
            {'name': 'Myrtaceae', 'description': 'Myrtle family'},
        ]

        for family_data in families_data:
            family, created = TreeFamily.objects.get_or_create(
                name=family_data['name'],
                defaults={'description': family_data['description']}
            )
            if created:
                self.stdout.write(f'Created family: {family.name}')

        # Create sample genera
        genera_data = [
            {'name': 'Afzelia', 'family_name': 'Fabaceae'},
            {'name': 'Shorea', 'family_name': 'Dipterocarpaceae'},
            {'name': 'Eucalyptus', 'family_name': 'Myrtaceae'},
        ]

        for genus_data in genera_data:
            family = TreeFamily.objects.get(name=genus_data['family_name'])
            genus, created = TreeGenus.objects.get_or_create(
                name=genus_data['name'],
                defaults={'family': family}
            )
            if created:
                self.stdout.write(f'Created genus: {genus.name}')

        # Create sample species
        species_data = [
            {
                'common_name': 'Tindalo',
                'scientific_name': 'Afzelia rhomboidea',
                'genus_name': 'Afzelia'
            },
            {
                'common_name': 'White Lauan',
                'scientific_name': 'Shorea contorta',
                'genus_name': 'Shorea'
            },
            {
                'common_name': 'Rainbow Eucalyptus',
                'scientific_name': 'Eucalyptus deglupta',
                'genus_name': 'Eucalyptus'
            },
        ]

        for species_data_item in species_data:
            genus = TreeGenus.objects.get(name=species_data_item['genus_name'])
            species, created = TreeSpecies.objects.get_or_create(
                scientific_name=species_data_item['scientific_name'],
                defaults={
                    'common_name': species_data_item['common_name'],
                    'genus': genus
                }
            )
            if created:
                self.stdout.write(f'Created species: {species.common_name}')

        # Create sample locations
        locations_data = [
            {'name': 'Negros Occidental Forest', 'latitude': 10.4234, 'longitude': 123.1234},
            {'name': 'Bacolod City Park', 'latitude': 10.6718, 'longitude': 122.9553},
            {'name': 'Mount Kanlaon Area', 'latitude': 10.4111, 'longitude': 123.1322},
        ]

        for location_data in locations_data:
            location, created = Location.objects.get_or_create(
                latitude=location_data['latitude'],
                longitude=location_data['longitude'],
                defaults={'name': location_data['name']}
            )
            if created:
                self.stdout.write(f'Created location: {location.name}')

        # Create sample seed plantings
        seeds_data = [
            {
                'species_name': 'Afzelia rhomboidea',
                'location_name': 'Negros Occidental Forest',
                'quantity': 50,
                'planting_date': date.today() - timedelta(days=30),
                'germination_status': 'germinating',
                'germination_date': date.today() - timedelta(days=15),
                'survival_rate': 85.5,
                'expected_maturity_date': date.today() + timedelta(days=365*5),
                'notes': 'First batch of Tindalo seeds showing good germination rates'
            },
            {
                'species_name': 'Shorea contorta',
                'location_name': 'Bacolod City Park',
                'quantity': 30,
                'planting_date': date.today() - timedelta(days=45),
                'germination_status': 'partially_germinated',
                'germination_date': date.today() - timedelta(days=20),
                'survival_rate': 73.2,
                'expected_maturity_date': date.today() + timedelta(days=365*8),
                'notes': 'White Lauan seeds adapting well to urban environment'
            },
            {
                'species_name': 'Eucalyptus deglupta',
                'location_name': 'Mount Kanlaon Area',
                'quantity': 25,
                'planting_date': date.today() - timedelta(days=60),
                'germination_status': 'fully_germinated',
                'germination_date': date.today() - timedelta(days=25),
                'survival_rate': 92.0,
                'expected_maturity_date': date.today() + timedelta(days=365*3),
                'notes': 'Rainbow Eucalyptus seeds thriving in mountain climate'
            },
            {
                'species_name': 'Afzelia rhomboidea',
                'location_name': 'Mount Kanlaon Area',
                'quantity': 40,
                'planting_date': date.today() - timedelta(days=10),
                'germination_status': 'not_germinated',
                'germination_date': None,
                'survival_rate': None,
                'expected_maturity_date': date.today() + timedelta(days=365*5),
                'notes': 'Recent planting, monitoring germination progress'
            },
            {
                'species_name': 'Shorea contorta',
                'location_name': 'Negros Occidental Forest',
                'quantity': 35,
                'planting_date': date.today() - timedelta(days=90),
                'germination_status': 'failed',
                'germination_date': None,
                'survival_rate': 0.0,
                'expected_maturity_date': None,
                'notes': 'Failed germination due to poor soil conditions'
            },
        ]

        for seed_data in seeds_data:
            species = TreeSpecies.objects.get(scientific_name=seed_data['species_name'])
            location = Location.objects.get(name=seed_data['location_name'])
            
            seed, created = TreeSeed.objects.get_or_create(
                species=species,
                location=location,
                planting_date=seed_data['planting_date'],
                defaults={
                    'quantity': seed_data['quantity'],
                    'germination_status': seed_data['germination_status'],
                    'germination_date': seed_data['germination_date'],
                    'survival_rate': seed_data['survival_rate'],
                    'expected_maturity_date': seed_data['expected_maturity_date'],
                    'notes': seed_data['notes']
                }
            )
            if created:
                self.stdout.write(f'Created seed planting: {species.common_name} at {location.name}')

        self.stdout.write(
            self.style.SUCCESS('Successfully added sample seed planting data!')
        )
