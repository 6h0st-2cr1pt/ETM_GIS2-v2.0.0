from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0025_location_address'),
    ]

    operations = [
        migrations.AddField(
            model_name='endemictree',
            name='diameter_cm',
            field=models.FloatField(blank=True, help_text='Diameter at breast height in centimeters', null=True),
        ),
        migrations.AddField(
            model_name='endemictree',
            name='height_meters',
            field=models.FloatField(blank=True, help_text='Tree height in meters', null=True),
        ),
    ]

