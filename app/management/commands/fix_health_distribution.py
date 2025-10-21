from django.core.management.base import BaseCommand
from app.models import EndemicTree


class Command(BaseCommand):
    help = 'Fix health distribution for existing tree records that have zero values'

    def handle(self, *args, **options):
        # Find all trees with zero health distribution counts
        trees_to_fix = EndemicTree.objects.filter(
            healthy_count=0,
            good_count=0,
            bad_count=0,
            deceased_count=0
        )
        
        updated_count = 0
        
        for tree in trees_to_fix:
            # Set health distribution based on the existing health_status and population
            if tree.health_status in ('excellent', 'very_good'):
                tree.healthy_count = tree.population
                tree.good_count = 0
                tree.bad_count = 0
                tree.deceased_count = 0
            elif tree.health_status == 'good':
                tree.healthy_count = 0
                tree.good_count = tree.population
                tree.bad_count = 0
                tree.deceased_count = 0
            elif tree.health_status in ('poor', 'very_poor'):
                tree.healthy_count = 0
                tree.good_count = 0
                tree.bad_count = tree.population
                tree.deceased_count = 0
            else:
                # Default to good if unknown status
                tree.healthy_count = 0
                tree.good_count = tree.population
                tree.bad_count = 0
                tree.deceased_count = 0
            
            tree.save()
            updated_count += 1
            
            self.stdout.write(
                f"Updated {tree.species.common_name} at {tree.location.name} "
                f"({tree.year}) - Health: {tree.healthy_count}, Good: {tree.good_count}, "
                f"Bad: {tree.bad_count}, Deceased: {tree.deceased_count}"
            )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} tree records')
        )
