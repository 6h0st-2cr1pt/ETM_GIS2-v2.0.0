from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from app.models import TreeFamily, TreeGenus, TreeSpecies

class Command(BaseCommand):
    help = 'Insert taxonomy data into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            help='Username to associate the taxonomy data with. If not provided, uses the first user.',
        )
        parser.add_argument(
            '--all-users',
            action='store_true',
            help='Insert taxonomy data for all users in the database.',
        )

    def handle(self, *args, **options):
        # Get users
        if options['all_users']:
            users = User.objects.all()
            if not users.exists():
                self.stdout.write(self.style.ERROR('No users found in the database.'))
                return
            self.stdout.write(f'Inserting taxonomy data for {users.count()} user(s)...')
        elif options['username']:
            try:
                users = [User.objects.get(username=options['username'])]
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User "{options["username"]}" not found.'))
                return
        else:
            user = User.objects.first()
            if not user:
                self.stdout.write(self.style.ERROR('No users found in the database.'))
                return
            users = [user]
        
        total_families_created = 0
        total_genera_created = 0
        total_species_created = 0
        total_species_updated = 0

        # Taxonomy data
        taxonomy_data = [
            ('Yakal', 'Shorea astylosa', 'Dipterocarpaceae', 'Shorea'),
            ('Red Lauan', 'Shorea negrosensis', 'Dipterocarpaceae', 'Shorea'),
            ('White Lauan', 'Shorea contorta', 'Dipterocarpaceae', 'Shorea'),
            ('Tanguile', 'Shorea polysperma', 'Dipterocarpaceae', 'Shorea'),
            ('Almon', 'Shorea almon', 'Dipterocarpaceae', 'Shorea'),
            ('Mayapis', 'Shorea palosapis', 'Dipterocarpaceae', 'Shorea'),
            ('Palosapis', 'Anisoptera thurifera', 'Dipterocarpaceae', 'Anisoptera'),
            ('Bagtikan', 'Parashorea malaanonan', 'Dipterocarpaceae', 'Parashorea'),
            ('Guijo', 'Shorea guiso', 'Dipterocarpaceae', 'Shorea'),
            ('Manggachapui', 'Hopea acuminata', 'Dipterocarpaceae', 'Hopea'),
            ('Philippine Teak', 'Tectona philippinensis', 'Lamiaceae', 'Tectona'),
            ('Kamagong', 'Diospyros blancoi', 'Ebenaceae', 'Diospyros'),
            ('Bolong Eta', 'Diospyros pilosanthera', 'Ebenaceae', 'Diospyros'),
            ('Philippine Ironwood', 'Xanthostemon verdugonianus', 'Myrtaceae', 'Xanthostemon'),
            ('Banuyo', 'Wallaceodendron celebicum', 'Fabaceae', 'Wallaceodendron'),
            ('Katmon', 'Dillenia philippinensis', 'Dilleniaceae', 'Dillenia'),
            ('Malabayabas', 'Tristaniopsis decorticata', 'Myrtaceae', 'Tristaniopsis'),
            ('Tindalo', 'Afzelia rhomboidea', 'Fabaceae', 'Afzelia'),
            ('Kalantas', 'Toona calantas', 'Meliaceae', 'Toona'),
            ('Nato', 'Palaquium philippense', 'Sapotaceae', 'Palaquium'),
            ('Malasantol', 'Sandoricum vidalii', 'Meliaceae', 'Sandoricum'),
            ('Ipil', 'Intsia bijuga', 'Fabaceae', 'Intsia'),
            ('Batulinau', 'Diospyros ferrea', 'Ebenaceae', 'Diospyros'),
            ('Apitong', 'Dipterocarpus grandiflorus', 'Dipterocarpaceae', 'Dipterocarpus'),
            ('Panau', 'Dipterocarpus gracilis', 'Dipterocarpaceae', 'Dipterocarpus'),
            ('Malapapaya', 'Polyscias nodosa', 'Araliaceae', 'Polyscias'),
            ('Banaba', 'Lagerstroemia speciosa', 'Lythraceae', 'Lagerstroemia'),
            ('Almaciga', 'Agathis philippinensis', 'Araucariaceae', 'Agathis'),
            ('Udling', 'Astronia cumingiana', 'Melastomataceae', 'Astronia'),
            ('Bakan', 'Litsea philippinensis', 'Lauraceae', 'Litsea'),
            ('Celtis', 'Celtis philippensis', 'Cannabaceae', 'Celtis'),
            ('Balete', 'Ficus benjamina', 'Moraceae', 'Ficus'),
            ('Bitanghol', 'Calophyllum blancoi', 'Clusiaceae', 'Calophyllum'),
            ('Kalingag', 'Cinnamomum mercadoi', 'Lauraceae', 'Cinnamomum'),
            ('Bitaog', 'Calophyllum inophyllum', 'Clusiaceae', 'Calophyllum'),
            ('Clethra sp', 'Clethra sp.', 'Clethraceae', 'Clethra'),
        ]

        # Process each user
        for user in users:
            self.stdout.write(f'\nProcessing user: {user.username}')
            
            families_created = 0
            genera_created = 0
            species_created = 0
            species_updated = 0

            for common_name, scientific_name, family_name, genus_name in taxonomy_data:
                # Get or create family
                family, family_created = TreeFamily.objects.get_or_create(
                    name=family_name,
                    user=user,
                    defaults={'description': ''}
                )
                if family_created:
                    families_created += 1

                # Get or create genus
                genus, genus_created = TreeGenus.objects.get_or_create(
                    name=genus_name,
                    user=user,
                    defaults={'family': family, 'description': ''}
                )
                # Update family if it was different
                if genus.family != family:
                    genus.family = family
                    genus.save()
                if genus_created:
                    genera_created += 1

                # Get or create species
                species, species_created = TreeSpecies.objects.get_or_create(
                    scientific_name=scientific_name,
                    user=user,
                    defaults={
                        'common_name': common_name,
                        'genus': genus,
                        'is_endemic': True,
                        'description': ''
                    }
                )
                # Update if exists
                if not species_created:
                    if species.common_name != common_name or species.genus != genus:
                        species.common_name = common_name
                        species.genus = genus
                        species.save()
                        species_updated += 1
                else:
                    species_created += 1

            total_families_created += families_created
            total_genera_created += genera_created
            total_species_created += species_created
            total_species_updated += species_updated

            self.stdout.write(f'  Families created: {families_created}')
            self.stdout.write(f'  Genera created: {genera_created}')
            self.stdout.write(f'  Species created: {species_created}')
            self.stdout.write(f'  Species updated: {species_updated}')

        self.stdout.write(self.style.SUCCESS(
            f'\n=== Taxonomy data insertion completed! ===\n'
            f'Total families created: {total_families_created}\n'
            f'Total genera created: {total_genera_created}\n'
            f'Total species created: {total_species_created}\n'
            f'Total species updated: {total_species_updated}'
        ))

