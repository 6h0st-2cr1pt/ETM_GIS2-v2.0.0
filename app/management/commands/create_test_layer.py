from django.core.management.base import BaseCommand
from app.models import MapLayer


class Command(BaseCommand):
    help = 'Create a sample map layer for testing'

    def handle(self, *args, **options):
        # Check if test layer already exists
        if MapLayer.objects.filter(name='Test OpenStreetMap Layer').exists():
            self.stdout.write(
                self.style.WARNING('Test layer already exists!')
            )
            return

        # Create a test layer
        test_layer = MapLayer.objects.create(
            name='Test OpenStreetMap Layer',
            description='A sample OpenStreetMap layer for testing',
            url='https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            layer_type='street',
            is_active=True,
            is_default=False,
            attribution='© OpenStreetMap contributors'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created test layer: {test_layer.name}')
        )
