import pandas as pd
import json
import csv
import io
import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO

from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse, HttpResponseNotFound, HttpResponseServerError
from django.contrib import messages
from django.views.decorators.http import require_POST
from django.core.serializers import serialize
from django.db.models import Count, Sum, F, Q, Case, When, Value, IntegerField, Avg
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.utils import timezone

from .models import (
    EndemicTree, MapLayer, UserSetting, TreeFamily,
    TreeGenus, TreeSpecies, Location, PinStyle, TreeSeed
)
from .forms import (
    EndemicTreeForm, CSVUploadForm, ThemeSettingsForm,
    PinStyleForm, LocationForm
)


def get_setting(user, key, default=None):
    """Helper function to get a setting value"""
    if not user.is_authenticated:
        return default
    try:
        return UserSetting.objects.get(user=user, key=key).value
    except UserSetting.DoesNotExist:
        return default


def splash_screen(request):
    """
    Initial splash screen that redirects to dashboard
    """
    return render(request, 'app/splash.html')


def user_login(request):
    """
    Handle user login
    """
    if request.user.is_authenticated:
        return redirect('app:dashboard')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Specify the backend since we have multiple backends
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, f"Welcome back, {username}!")

            # Redirect to the page they were trying to access, or dashboard
            next_page = request.GET.get('next', 'app:dashboard')
            return redirect(next_page)
        else:
            return render(request, 'app/login.html', {
                'error_message': 'Invalid username or password',
                'theme': get_setting(request.user, 'theme', 'dark')
            })

    return render(request, 'app/login.html', {
        'theme': get_setting(request.user, 'theme', 'dark')
    })


def user_logout(request):
    """
    Handle user logout
    """
    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect('app:login')


@login_required(login_url='app:login')
def dashboard(request):
    """
    Main dashboard view
    """
    try:
        # Get basic stats for dashboard with proper null checks
        total_trees = EndemicTree.objects.filter(user=request.user).count()
        unique_species = TreeSpecies.objects.filter(user=request.user).count()
        tree_population = EndemicTree.objects.filter(user=request.user).aggregate(total_population=Sum('population'))['total_population'] or 0

        # Calculate health percentage (trees in good health or better)
        total_population = tree_population or 0  # Avoid division by zero
        if total_population > 0:
            good_health_population = EndemicTree.objects.filter(
                user=request.user,
                health_status__in=['good', 'very_good', 'excellent']
            ).aggregate(total=Sum('population'))['total'] or 0
            health_percentage = round((good_health_population / total_population) * 100)
        else:
            health_percentage = 0

        # Get health status distribution for chart
        health_data = list(EndemicTree.objects.filter(user=request.user).values('health_status').annotate(
            count=Sum('population')  # Changed from Count('id') to Sum('population')
        ).order_by('health_status'))

        # Get most recent data
        recent_trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location').all().order_by('-created_at')[:5]

        # Get species by family for chart with null checks
        species_by_family = list(TreeFamily.objects.filter(user=request.user).annotate(
            total_population=Sum('genera__species__trees__population')
        ).values('name', 'total_population').order_by('-total_population')[:10])

        # Get population by year with proper aggregation and null checks
        population_by_year = list(EndemicTree.objects.filter(user=request.user).values('year')
            .annotate(total=Sum('population'))
            .order_by('year'))

        # Prepare context with empty data handling
        context = {
            'active_page': 'dashboard',
            'total_trees': total_trees or 0,
            'unique_species': unique_species or 0,
            'tree_population': tree_population or 0,
            'health_percentage': health_percentage,
            'recent_trees': recent_trees,
            'species_by_family': json.dumps([{
                'name': item['name'],
                'count': item['total_population'] or 0
            } for item in (species_by_family or [])]),
            'population_by_year': json.dumps([{
                'year': item['year'],
                'total': item['total'] or 0
            } for item in (population_by_year or [])]),
            'health_data': json.dumps([{
                'status': item['health_status'],
                'count': item['count'] or 0
            } for item in (health_data or [])])
        }

        return render(request, 'app/dashboard.html', context)
    except Exception as e:
        print(f"Dashboard Error: {str(e)}")  # Add logging for debugging
        # Return empty data in case of error
        context = {
            'active_page': 'dashboard',
            'total_trees': 0,
            'unique_species': 0,
            'tree_population': 0,
            'health_percentage': 0,
            'recent_trees': [],
            'species_by_family': '[]',
            'population_by_year': '[]',
            'health_data': '[]'
        }
        return render(request, 'app/dashboard.html', context)


@login_required(login_url='app:login')
def gis(request):
    """
    GIS Map view
    """
    # Get all available map layers
    layers = MapLayer.objects.filter(user=request.user, is_active=True)

    # Get only tree species that have associated trees
    tree_species = TreeSpecies.objects.filter(
        user=request.user,
        trees__isnull=False  # Only species that have trees
    ).distinct().order_by('common_name')  # Remove duplicates and order by common name

    # Get default pin style
    try:
        default_pin = PinStyle.objects.get(user=request.user, is_default=True)
    except PinStyle.DoesNotExist:
        default_pin = None

    context = {
        'active_page': 'gis',
        'layers': layers,
        'tree_species': tree_species,
        'default_pin': default_pin,
    }
    return render(request, 'app/gis.html', context)


@login_required(login_url='app:login')
def analytics(request):
    """
    Analytics and visualization view
    """
    try:
        # Check if there's any data in the database
        if not EndemicTree.objects.filter(user=request.user).exists():
            return render(request, 'app/analytics.html', {
                'active_page': 'analytics',
                'population_data': '[]',
                'health_status_data': '[]',
                'family_data': '[]',
                'genus_data': '[]',
                'species_data': '[]',
                'growth_rate_by_year': '[]',
                'location_data': '[]',
                'health_by_year': '[]'
            })

        # Population by year with proper aggregation
        population_by_year = list(EndemicTree.objects.filter(user=request.user).values('year')
            .annotate(total=Sum('population'))
            .order_by('year'))

        # Health status distribution with population counts
        health_status_data = list(EndemicTree.objects.filter(user=request.user).values('health_status')
            .annotate(count=Sum('population'))
            .order_by('health_status'))

        # Family distribution data
        family_data = list(TreeFamily.objects.filter(user=request.user).annotate(
            total_population=Sum('genera__species__trees__population'),
            species_count=Count('genera__species', distinct=True)
        ).values('name', 'total_population', 'species_count')
        .order_by('-total_population')[:10])

        # Species distribution by genus
        genus_data = list(TreeGenus.objects.filter(user=request.user).annotate(
            total_population=Sum('species__trees__population'),
            species_count=Count('species', distinct=True)
        ).values('name', 'family__name', 'total_population', 'species_count')
        .order_by('-total_population')[:10])

        # Species data with population
        species_data = list(TreeSpecies.objects.filter(user=request.user).annotate(
            total_population=Sum('trees__population'),
            locations_count=Count('trees__location', distinct=True)
        ).values('common_name', 'scientific_name', 'total_population', 'locations_count')
        .order_by('-total_population')[:10])

        # Calculate growth rate
        growth_rate_by_year = []
        if len(population_by_year) > 1:
            for i in range(1, len(population_by_year)):
                current_year = population_by_year[i]
                prev_year = population_by_year[i - 1]
                
                if prev_year['total'] and prev_year['total'] > 0:
                    growth_rate = ((current_year['total'] - prev_year['total']) / prev_year['total']) * 100
                else:
                    growth_rate = 0
                
                growth_rate_by_year.append({
                    'year': current_year['year'],
                    'growth_rate': round(growth_rate, 2)
                })

        # Location-based distribution
        location_data = list(Location.objects.filter(user=request.user).annotate(
            total_trees=Sum('trees__population'),
            species_count=Count('trees__species', distinct=True)
        ).values('name', 'latitude', 'longitude', 'total_trees', 'species_count')
        .exclude(total_trees__isnull=True)
        .order_by('-total_trees'))

        # Health status by year
        health_by_year = list(EndemicTree.objects.filter(user=request.user).values('year', 'health_status')
            .annotate(population=Sum('population'))
            .order_by('year', 'health_status'))

        # Handle None values and convert Decimal to float for JSON serialization
        def clean_data(data):
            if isinstance(data, list):
                return [clean_data(item) for item in data]
            elif isinstance(data, dict):
                return {k: clean_data(v) if v is not None else 0 for k, v in data.items()}
            elif str(type(data)) == "<class 'decimal.Decimal'>":
                return float(data)
            return data

        # Clean and prepare all data for JSON serialization
        population_by_year = clean_data(population_by_year or [])
        health_status_data = clean_data(health_status_data or [])
        family_data = clean_data(family_data or [])
        genus_data = clean_data(genus_data or [])
        species_data = clean_data(species_data or [])
        growth_rate_by_year = clean_data(growth_rate_by_year or [])
        location_data = clean_data(location_data or [])
        health_by_year = clean_data(health_by_year or [])

        context = {
            'active_page': 'analytics',
            'population_data': json.dumps(population_by_year),
            'health_status_data': json.dumps(health_status_data),
            'family_data': json.dumps(family_data),
            'genus_data': json.dumps(genus_data),
            'species_data': json.dumps(species_data),
            'growth_rate_by_year': json.dumps(growth_rate_by_year),
            'location_data': json.dumps(location_data),
            'health_by_year': json.dumps(health_by_year)
        }

        return render(request, 'app/analytics.html', context)

    except Exception as e:
        print(f"Analytics Error: {str(e)}")  # Add logging for debugging
        # Return empty data in case of error
        context = {
            'active_page': 'analytics',
            'population_data': '[]',
            'health_status_data': '[]',
            'family_data': '[]',
            'genus_data': '[]',
            'species_data': '[]',
            'growth_rate_by_year': '[]',
            'location_data': '[]',
            'health_by_year': '[]'
        }
        return render(request, 'app/analytics.html', context)


@login_required(login_url='app:login')
def layers(request):
    """
    Layer control view
    """
    layers = MapLayer.objects.filter(user=request.user)

    context = {
        'active_page': 'layers',
        'layers': layers,
    }
    return render(request, 'app/layers.html', context)


@login_required(login_url='app:login')
def datasets(request):
    """
    Display and manage datasets
    """
    trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location').all()
    seeds = TreeSeed.objects.filter(user=request.user).select_related('species', 'location').all()
    species_list = TreeSpecies.objects.filter(user=request.user).all().order_by('common_name')

    context = {
        'active_page': 'datasets',
        'trees': trees,
        'seeds': seeds,
        'species_list': species_list,
    }
    return render(request, 'app/datasets.html', context)


@login_required(login_url='app:login')
def upload_data(request):
    """
    Handle file uploads and manual data entry
    """
    tree_form = EndemicTreeForm()
    csv_form = CSVUploadForm()

    if request.method == 'POST':
        if 'submit_csv' in request.POST:
            csv_form = CSVUploadForm(request.POST, request.FILES)
            if csv_form.is_valid():
                csv_file = request.FILES['csv_file']

                # Check if file is CSV
                if not csv_file.name.endswith('.csv'):
                    messages.error(request, 'File must be a CSV file')
                    return redirect('app:upload')

                # Process CSV file
                try:
                    df = pd.read_csv(csv_file)
                    required_columns = ['common_name', 'scientific_name', 'family', 'genus', 'population', 'hectares', 'latitude',
                                        'longitude', 'year']

                    # Check if all required columns exist
                    missing_columns = [col for col in required_columns if col not in df.columns]
                    if missing_columns:
                        messages.error(request, f'Missing required columns: {", ".join(missing_columns)}')
                        return redirect('app:upload')

                    # Process each row and save to database
                    success_count = 0
                    error_count = 0

                    for _, row in df.iterrows():
                        try:
                            # Get or create family
                            family, _ = TreeFamily.objects.get_or_create(
                                name=row['family'],
                                user=request.user
                            )

                            # Get or create genus
                            genus, _ = TreeGenus.objects.get_or_create(
                                name=row['genus'],
                                user=request.user,
                                defaults={'family': family}
                            )

                            # Get or create species
                            species, _ = TreeSpecies.objects.get_or_create(
                                scientific_name=row['scientific_name'],
                                user=request.user,
                                defaults={
                                    'common_name': row['common_name'],
                                    'genus': genus
                                }
                            )

                            # Get or create location
                            location, created = Location.objects.get_or_create(
                                latitude=row['latitude'],
                                longitude=row['longitude'],
                                user=request.user,
                                defaults={'name': f"{row['common_name']} location"}
                            )
                            
                            # Note: CSV upload doesn't support images - images must be uploaded via manual entry

                            # Create tree record
                            notes = row.get('notes', '')
                            health_status = row.get('health_status', 'good')
                            
                            # Get health distribution counts from CSV
                            healthy_count = int(row.get('healthy_count', 0))
                            good_count = int(row.get('good_count', 0))
                            bad_count = int(row.get('bad_count', 0))
                            deceased_count = int(row.get('deceased_count', 0))

                            # Get hectares from CSV (required). Accept both "hectares" and "hectars" headers.
                            hectares_value = row.get('hectares')
                            if hectares_value is None or pd.isna(hectares_value):
                                hectares_value = row.get('hectars')
                            if hectares_value is None or (isinstance(hectares_value, str) and not hectares_value.strip()) or pd.isna(hectares_value):
                                raise ValueError(f"Row {_ + 1}: hectares (hectars) is required")
                            try:
                                hectares = float(hectares_value)
                                if hectares < 0:
                                    raise ValueError(f"Row {_ + 1}: hectares must be non-negative")
                            except (ValueError, TypeError) as e:
                                if isinstance(e, ValueError) and "must be non-negative" in str(e):
                                    raise
                                raise ValueError(f"Row {_ + 1}: invalid hectares value: {hectares_value}")
                            
                            tree = EndemicTree(
                                species=species,
                                location=location,
                                population=row['population'],
                                year=row['year'],
                                health_status=health_status,
                                healthy_count=healthy_count,
                                good_count=good_count,
                                bad_count=bad_count,
                                deceased_count=deceased_count,
                                hectares=hectares,
                                notes=notes,
                                user=request.user
                            )
                            tree.save()
                            success_count += 1
                        except Exception as e:
                            error_count += 1
                            print(f"Error processing row: {str(e)}")

                    messages.success(request, f'Successfully imported {success_count} trees. {error_count} errors.')
                    # Redirect to GIS page to see the newly added data
                    return redirect('app:gis')
                except Exception as e:
                    messages.error(request, f'Error processing CSV file: {str(e)}')
                    return redirect('app:upload')

        elif 'submit_manual' in request.POST:
            try:
                # Get form data
                common_name = request.POST.get('common_name')
                scientific_name = request.POST.get('scientific_name')
                family_name = request.POST.get('family')
                genus_name = request.POST.get('genus')
                population = int(request.POST.get('population'))

                # Get health counts
                healthy_count = int(request.POST.get('healthy_count', 0))
                good_count = int(request.POST.get('good_count', 0))
                bad_count = int(request.POST.get('bad_count', 0))
                deceased_count = int(request.POST.get('deceased_count', 0))

                # Calculate overall health status based on the distribution
                total_count = healthy_count + good_count + bad_count + deceased_count
                if total_count != population:
                    raise ValueError("Health status counts do not match the total population")

                # Calculate percentages
                healthy_percent = (healthy_count / total_count) * 100
                good_percent = (good_count / total_count) * 100

                # Determine overall health status
                if healthy_percent >= 60:
                    health_status = 'excellent'
                elif healthy_percent >= 40 or (healthy_percent + good_percent) >= 70:
                    health_status = 'very_good'
                elif healthy_percent >= 20 or (healthy_percent + good_percent) >= 50:
                    health_status = 'good'
                elif deceased_count / total_count <= 0.3:
                    health_status = 'poor'
                else:
                    health_status = 'very_poor'

                latitude = float(request.POST.get('latitude'))
                longitude = float(request.POST.get('longitude'))
                year = int(request.POST.get('year'))
                # Get hectares (required)
                hectares_str = request.POST.get('hectares', '').strip()
                if not hectares_str:
                    messages.error(request, 'Hectares is required')
                    return redirect('app:upload')
                try:
                    hectares = float(hectares_str)
                    if hectares < 0:
                        messages.error(request, 'Hectares must be non-negative')
                        return redirect('app:upload')
                except (ValueError, TypeError):
                    messages.error(request, 'Invalid hectares value')
                    return redirect('app:upload')
                notes = request.POST.get('notes', '')

                # Get or create family
                family, created = TreeFamily.objects.get_or_create(name=family_name, user=request.user)

                # Get or create genus
                genus, created = TreeGenus.objects.get_or_create(
                    name=genus_name,
                    user=request.user,
                    defaults={'family': family}
                )

                # Get or create species
                species, created = TreeSpecies.objects.get_or_create(
                    scientific_name=scientific_name,
                    user=request.user,
                    defaults={
                        'common_name': common_name,
                        'genus': genus
                    }
                )

                # Get or create location
                location, created = Location.objects.get_or_create(
                    latitude=latitude,
                    longitude=longitude,
                    user=request.user,
                    defaults={'name': f"{common_name} Location"}
                )
                
                # Image sharing logic:
                # Images are shared ONLY when trees have:
                # - Same location (latitude + longitude)
                # - Same common_name (via species)
                # - Same scientific_name (via species)
                # 
                # If same common_name + scientific_name but different location = different images
                # If same location but different species = different images
                
                # Check if there's an existing tree with same location AND species
                # This ensures all trees with same location, common_name, and scientific_name share the same image
                existing_tree = EndemicTree.objects.filter(
                    species=species,  # Same common_name + scientific_name
                    location=location,  # Same location (latitude + longitude)
                    user=request.user
                ).exclude(image__isnull=True).exclude(image='').first()
                
                # Handle image upload
                image_file = None
                if 'location_image' in request.FILES:
                    image_file = request.FILES['location_image']
                
                # Determine which image to use:
                # 1. If new image uploaded, use it and update all existing trees with same location+species
                # 2. If existing tree has image and no new image, use existing image
                # 3. Otherwise, no image
                tree_image = None
                if image_file:
                    # New image uploaded - use it and update ONLY trees with same location AND species
                    # We need to copy the file for each tree, not just reference it
                    image_file.seek(0)  # Reset file pointer
                    from django.core.files.base import ContentFile
                    image_data = image_file.read()
                    # Create a ContentFile for the new tree
                    new_image_file = ContentFile(image_data, name=image_file.name)
                    tree_image = new_image_file
                    # Update all existing trees with same location AND species to use this image
                    # Note: Trees with same species but different location will NOT be updated
                    for existing_tree_obj in EndemicTree.objects.filter(
                        species=species,  # Same common_name + scientific_name
                        location=location,  # Same location
                        user=request.user
                    ):
                        # Create a new ContentFile for each existing tree
                        existing_image_file = ContentFile(image_data, name=image_file.name)
                        existing_tree_obj.image.save(
                            existing_image_file.name,
                            existing_image_file,
                            save=True
                        )
                elif existing_tree and existing_tree.image:
                    # Use existing image from another tree with same location AND species
                    tree_image = existing_tree.image

                # Create endemic tree record
                tree = EndemicTree(
                    species=species,
                    location=location,
                    population=population,
                    health_status=health_status,
                    healthy_count=healthy_count,
                    good_count=good_count,
                    bad_count=bad_count,
                    deceased_count=deceased_count,
                    year=year,
                    hectares=hectares,
                    notes=notes,
                    user=request.user
                )
                # Save tree first to get an ID
                tree.save()
                
                # Now assign and save the image if we have one
                if tree_image:
                    from django.core.files.base import ContentFile
                    if isinstance(tree_image, ContentFile):
                        tree.image.save(
                            tree_image.name,
                            tree_image,
                            save=True
                        )
                    else:
                        # If it's an existing ImageField, just assign it
                        tree.image = tree_image
                        tree.save()

                messages.success(request, f"Successfully added {common_name} record.")
                # Redirect to GIS page to see the newly added data
                return redirect('app:gis')
            except Exception as e:
                messages.error(request, f"Error adding record: {str(e)}")
                print(f"Error in manual entry: {str(e)}")
        elif 'submit_seed' in request.POST:
            try:
                # Get form data
                common_name = request.POST.get('seed_common_name')
                scientific_name = request.POST.get('seed_scientific_name')
                family_name = request.POST.get('seed_family')
                genus_name = request.POST.get('seed_genus')
                quantity = int(request.POST.get('seed_quantity'))
                planting_date = request.POST.get('seed_planting_date')
                germination_status = request.POST.get('seed_germination_status')
                germination_date = request.POST.get('seed_germination_date') or None
                survival_rate = request.POST.get('seed_survival_rate')
                if survival_rate:
                    survival_rate = float(survival_rate)
                else:
                    survival_rate = None
                expected_maturity_date = request.POST.get('seed_expected_maturity_date') or None
                # Get hectares (required)
                hectares_str = request.POST.get('seed_hectares', '').strip()
                if not hectares_str:
                    messages.error(request, 'Hectares is required')
                    return redirect('app:upload')
                try:
                    hectares = float(hectares_str)
                    if hectares < 0:
                        messages.error(request, 'Hectares must be non-negative')
                        return redirect('app:upload')
                except (ValueError, TypeError):
                    messages.error(request, 'Invalid hectares value')
                    return redirect('app:upload')
                latitude = float(request.POST.get('seed_latitude'))
                longitude = float(request.POST.get('seed_longitude'))
                notes = request.POST.get('seed_notes', '')

                # Get or create family and genus by name
                family, _ = TreeFamily.objects.get_or_create(name=family_name, user=request.user)
                genus, _ = TreeGenus.objects.get_or_create(
                    name=genus_name,
                    user=request.user,
                    defaults={'family': family}
                )

                # Get or create species
                species, created = TreeSpecies.objects.get_or_create(
                    scientific_name=scientific_name,
                    user=request.user,
                    defaults={
                        'common_name': common_name,
                        'genus': genus
                    }
                )

                # Get or create location
                location, created = Location.objects.get_or_create(
                    latitude=latitude,
                    longitude=longitude,
                    user=request.user,
                    defaults={'name': f"{common_name} Seed Planting Location"}
                )
                
                # Handle image upload for seed location - only update if new image is provided
                if 'seed_location_image' in request.FILES:
                    location.image = request.FILES['seed_location_image']
                    location.save()

                # Create tree seed record
                seed = TreeSeed.objects.create(
                    species=species,
                    location=location,
                    quantity=quantity,
                    planting_date=planting_date,
                    germination_status=germination_status,
                    germination_date=germination_date,
                    survival_rate=survival_rate,
                    hectares=hectares,
                    expected_maturity_date=expected_maturity_date,
                    notes=notes,
                    user=request.user
                )

                messages.success(request, f"Successfully added {common_name} seed planting record.")
                # Redirect to GIS page to see the newly added data
                return redirect('app:gis')
            except Exception as e:
                messages.error(request, f"Error adding seed record: {str(e)}")
                print(f"Error in seed entry: {str(e)}")

    # Get all families and genera for the form
    families = TreeFamily.objects.filter(user=request.user).all()
    genera = TreeGenus.objects.filter(user=request.user).all()

    context = {
        'active_page': 'upload',
        'tree_form': tree_form,
        'csv_form': csv_form,
        'families': families,
        'genera': genera,
    }
    return render(request, 'app/upload.html', context)


@login_required(login_url='app:login')
def settings(request):
    """
    Application settings
    """
    # Get all pin styles
    pin_styles = PinStyle.objects.filter(user=request.user).all()

    # Create a new pin style form
    pin_style_form = PinStyleForm()

    # Initialize form with current settings
    try:
        current_theme = UserSetting.objects.get(user=request.user, key='theme').value
    except UserSetting.DoesNotExist:
        current_theme = 'dark'  # Default

    try:
        current_map_style = UserSetting.objects.get(user=request.user, key='map_style').value
    except UserSetting.DoesNotExist:
        current_map_style = 'dark'  # Default

    try:
        current_pin_style = PinStyle.objects.get(user=request.user, is_default=True)
    except PinStyle.DoesNotExist:
        if pin_styles.exists():
            current_pin_style = pin_styles.first()
        else:
            # Create a default pin style if none exists
            current_pin_style = PinStyle.objects.create(
                name="Default Green Tree",
                icon_class="fa-tree",
                color="#4caf50",
                size=24,
                border_color="#ffffff",
                border_width=2,
                background_color="rgba(0, 0, 0, 0.6)",
                is_default=True,
                user=request.user
            )

    # Get other settings
    enable_animations = get_setting(request.user, 'enable_animations', 'true') == 'true'
    high_contrast = get_setting(request.user, 'high_contrast', 'false') == 'true'
    font_size = int(get_setting(request.user, 'font_size', '100'))
    default_zoom = int(get_setting(request.user, 'default_zoom', '9'))
    show_scientific_names = get_setting(request.user, 'show_scientific_names', 'true') == 'true'

    initial_data = {
        'theme': current_theme,
        'map_style': current_map_style,
        'pin_style': current_pin_style.id,
        'enable_animations': enable_animations,
        'high_contrast': high_contrast,
        'font_size': font_size,
        'default_zoom': default_zoom,
        'show_scientific_names': show_scientific_names,
    }

    form = ThemeSettingsForm(user=request.user, initial=initial_data)

    if request.method == 'POST':
        if 'save_settings' in request.POST:
            form = ThemeSettingsForm(request.POST, user=request.user)
            if form.is_valid():
                # Save all settings
                settings_to_save = {
                    'theme': form.cleaned_data['theme'],
                    'map_style': form.cleaned_data['map_style'],
                    'enable_animations': str(form.cleaned_data['enable_animations']).lower(),
                    'high_contrast': str(form.cleaned_data['high_contrast']).lower(),
                    'font_size': str(form.cleaned_data['font_size']),
                    'default_zoom': str(form.cleaned_data['default_zoom']),
                    'show_scientific_names': str(form.cleaned_data['show_scientific_names']).lower(),
                }

                for key, value in settings_to_save.items():
                    UserSetting.objects.update_or_create(
                        key=key,
                        user=request.user,
                        defaults={'value': value}
                    )

                # Set default pin style
                pin_style = form.cleaned_data['pin_style']
                pin_style.is_default = True
                pin_style.save()

                messages.success(request, 'Settings updated successfully!')
                return redirect('app:settings')

        elif 'add_pin_style' in request.POST:
            pin_style_form = PinStyleForm(request.POST)
            if pin_style_form.is_valid():
                pin_style = pin_style_form.save(commit=False)
                pin_style.user = request.user
                pin_style.save()
                messages.success(request, 'New pin style added successfully!')
                return redirect('app:settings')

    context = {
        'active_page': 'settings',
        'form': form,
        'pin_styles': pin_styles,
        'pin_style_form': pin_style_form,
    }
    return render(request, 'app/settings.html', context)


@login_required(login_url='app:login')
def about(request):
    """
    About page
    """
    context = {
        'active_page': 'about',
    }
    return render(request, 'app/about.html', context)


@login_required(login_url='app:login')
def reports(request):
    """View for generating reports."""
    # Get all species and locations for the filters - fresh from database
    species_list = TreeSpecies.objects.filter(user=request.user).all().order_by('common_name')
    location_list = Location.objects.filter(user=request.user).all().order_by('name')

    return render(request, 'app/reports.html', {
        'active_page': 'reports',
        'species_list': species_list,
        'location_list': location_list
    })


@login_required(login_url='app:login')
def api_species_list(request):
    """API endpoint to get current list of species for dropdown updates."""
    try:
        # Force fresh query from database - no caching
        species_list = TreeSpecies.objects.filter(user=request.user).all().order_by('common_name')
        species_data = [
            {
                'id': str(species.id),
                'common_name': species.common_name,
                'scientific_name': species.scientific_name
            }
            for species in species_list
        ]
        
        # Add timestamp to prevent caching
        response = JsonResponse({
            'success': True,
            'species': species_data,
            'timestamp': timezone.now().isoformat()
        })
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
def api_locations_list(request):
    """API endpoint to get current list of locations for dropdown updates."""
    try:
        # Force fresh query from database - no caching
        location_list = Location.objects.all().order_by('name')
        location_data = [
            {
                'id': str(location.id),
                'name': location.name,
                'latitude': float(location.latitude),
                'longitude': float(location.longitude)
            }
            for location in location_list
        ]
        
        # Add timestamp to prevent caching
        response = JsonResponse({
            'success': True,
            'locations': location_data,
            'timestamp': timezone.now().isoformat()
        })
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
def new_data(request):
    """View for inspecting and managing public tree photo submissions."""
    try:
        from public.models import TreePhotoSubmission
        
        # Fetch data from public app TreePhotoSubmission
        public_submissions = TreePhotoSubmission.objects.all().order_by('-created_at')
        
        # Convert to format similar to Supabase data for template compatibility
        public_data = []
        for submission in public_submissions:
            public_data.append({
                'id': submission.id,
                'tree_description': submission.tree_description,
                'person_name': submission.person_name,
                'latitude': submission.latitude,
                'longitude': submission.longitude,
                'image_url': f'/public-submission-image/{submission.id}/',  # URL to view image
                'created_at': submission.created_at,
                'image_format': submission.image_format,
            })
        
        print(f"Fetched {len(public_data)} records from public submissions")
        if public_data:
            print("Sample record:", public_data[0])
        
        # Get existing species and locations for reference
        species_list = TreeSpecies.objects.filter(user=request.user).all().order_by('common_name')
        location_list = Location.objects.filter(user=request.user).all().order_by('name')
        
        context = {
            'active_page': 'new_data',
            'supabase_data': public_data,  # Keep same key for template compatibility
            'species_list': species_list,
            'location_list': location_list,
        }
        return render(request, 'app/new_data.html', context)
        
    except Exception as e:
        print(f"Error fetching public submissions: {str(e)}")
        import traceback
        traceback.print_exc()
        context = {
            'active_page': 'new_data',
            'supabase_data': [],
            'species_list': [],
            'location_list': [],
            'error': f"Error fetching public submissions: {str(e)}"
        }
        return render(request, 'app/new_data.html', context)


@csrf_protect
def generate_report(request):
    """View for generating reports based on form data."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        # Get form data
        report_type = request.POST.get('report_type')
        time_range = request.POST.get('time_range')
        species_filter = request.POST.get('species_filter')
        location_filter = request.POST.get('location_filter')
        include_charts = request.POST.get('include_charts') == 'on'
        include_map = request.POST.get('include_map') == 'on'
        include_table = request.POST.get('include_table') == 'on'

        # Get the current date and time
        now = timezone.now()
        date_str = now.strftime('%B %d, %Y')
        time_str = now.strftime('%I:%M %p')

        # Get report title based on type
        report_titles = {
            'species_distribution': 'Species Distribution Report',
            'population_trends': 'Population Trends Report',
            'health_analysis': 'Health Status Analysis Report',
            'conservation_status': 'Conservation Status Report',
            'spatial_density': 'Spatial Density Report'
        }
        report_title = report_titles.get(report_type, 'Endemic Trees Report')

        # Build the report HTML
        html = f'''
        <div class="report-document">
            <div class="report-header">
                <h1 class="report-title">{report_title}</h1>
                <p class="report-subtitle">Endemic Trees Monitoring System</p>
                <p class="report-date">Generated on {date_str} at {time_str}</p>
            </div>

            <div class="report-section">
                <h2 class="report-section-title">Executive Summary</h2>
                <p>This report provides an analysis of endemic tree data collected by the Endemic Trees Monitoring System. 
                   The report includes information on tree species, population trends, health status, and spatial distribution.</p>
            </div>
        '''

        # Add charts section if included
        if include_charts:
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Data Visualization</h2>
                <div class="report-chart-container">
                    <canvas id="reportChart1"></canvas>
                </div>
                <div class="report-chart-container">
                    <canvas id="reportChart2"></canvas>
                </div>
            </div>
            '''

        # Add map section if included
        if include_map:
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Spatial Distribution</h2>
                <div class="report-map-container" id="reportMap"></div>
            </div>
            '''

        # Add data table if included
        if include_table:
            # Query the database for tree data
            trees = EndemicTree.objects.all()
            
            # Apply filters
            if species_filter and species_filter != 'all':
                trees = trees.filter(species_id=species_filter)
            if location_filter and location_filter != 'all':
                trees = trees.filter(location_id=location_filter)
            
            # Generate table HTML
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Data Table</h2>
                <div class="report-table-container">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Species</th>
                                <th>Location</th>
                                <th>Population</th>
                                <th>Health Status</th>
                            </tr>
                        </thead>
                        <tbody>
            '''
            
            # Add table rows
            for tree in trees[:10]:  # Limit to 10 rows for performance
                html += f'''
                <tr>
                    <td>{tree.species.common_name} ({tree.species.scientific_name})</td>
                    <td>{tree.location.name}</td>
                    <td>{tree.population}</td>
                    <td>{tree.health_status}</td>
                </tr>
                '''
            
            html += '''
                        </tbody>
                    </table>
                </div>
            </div>
            '''

        # Add conclusions
        html += '''
            <div class="report-section">
                <h2 class="report-section-title">Conclusions and Recommendations</h2>
                <p>Based on the data collected and analyzed in this report, the following conclusions can be drawn:</p>
                <ul>
                    <li>The overall population of endemic trees shows varying distributions across different locations.</li>
                    <li>Conservation efforts should be focused on areas with lower tree density.</li>
                    <li>Regular monitoring and assessment of tree health status is essential.</li>
                </ul>
            </div>
        </div>
        '''

        return JsonResponse({
            'reportContent': html,
            'success': True
        })

    except Exception as e:
        return JsonResponse({
            'error': str(e),
            'success': False
        }, status=500)


# API Views
def tree_data(request):
    """
    API endpoint for tree data in GeoJSON format
    """
    try:
        trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location').all()

        # No species-wide aggregation here. For the popup we return per-record distribution
        # derived strictly from the current row's health_status and population.

        # Log the count of trees for debugging
        tree_count = trees.count()
        print(f"Found {tree_count} trees in the database")

        # Get pin style
        try:
            pin_style = PinStyle.objects.get(is_default=True)
        except PinStyle.DoesNotExist:
            pin_style = None

        # Convert to GeoJSON format
        features = []
        for tree in trees:

            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [tree.location.longitude, tree.location.latitude]
                },
                'properties': {
                    'id': str(tree.id),
                    'species_id': str(tree.species.id),  # Add species_id for filtering
                    'location_id': str(tree.location.id),  # Add location_id for filtering
                    'common_name': tree.species.common_name,
                    'scientific_name': tree.species.scientific_name,
                    'family': tree.species.genus.family.name,
                    'genus': tree.species.genus.name,
                    'population': tree.population,
                    'health_status': tree.health_status,
                    'year': tree.year,
                    'location': tree.location.name,
                    'notes': tree.notes or '',
                    # Use actual stored health distribution
                    'healthy_count': tree.healthy_count,
                    'good_count': tree.good_count,
                    'bad_count': tree.bad_count,
                    'deceased_count': tree.deceased_count,
                    'hectares': tree.hectares,
                    # Include tree image URL if available (shared by trees with same location, common_name, scientific_name)
                    'image_url': tree.image.url if tree.image and tree.image.name else None,
                }
            }
            features.append(feature)

        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }

        # Add pin style to response
        if pin_style:
            geojson['pin_style'] = {
                'icon_class': pin_style.icon_class,
                'color': pin_style.color,
                'size': pin_style.size,
                'border_color': pin_style.border_color,
                'border_width': pin_style.border_width,
                'background_color': pin_style.background_color
            }

        return JsonResponse(geojson)
    except Exception as e:
        print(f"Error in tree_data API: {str(e)}")
        return JsonResponse({
            'type': 'FeatureCollection',
            'features': [],
            'error': str(e)
        }, status=500)


def seed_data(request):
    """
    API endpoint for seed data in GeoJSON format
    """
    try:
        seeds = TreeSeed.objects.filter(user=request.user).select_related('species', 'location').all()

        # Log the count of seeds for debugging
        seed_count = seeds.count()
        print(f"Found {seed_count} seed plantings in the database")

        # Convert to GeoJSON format
        features = []
        for seed in seeds:
            try:
                # Debug: Print seed information
                print(f"Processing seed: {seed.species.common_name} at {seed.location.name} ({seed.location.latitude}, {seed.location.longitude})")
                
                feature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [float(seed.location.longitude), float(seed.location.latitude)]
                    },
                    'properties': {
                        'id': str(seed.id),
                        'species_id': str(seed.species.id),
                        'common_name': seed.species.common_name,
                        'scientific_name': seed.species.scientific_name,
                        'family': seed.species.genus.family.name,
                        'genus': seed.species.genus.name,
                        'quantity': seed.quantity,
                        'planting_date': seed.planting_date.strftime('%Y-%m-%d'),
                        'germination_status': seed.germination_status,
                        'germination_date': seed.germination_date.strftime(
                            '%Y-%m-%d') if seed.germination_date else None,
                        'survival_rate': float(seed.survival_rate) if seed.survival_rate is not None else None,
                        'expected_maturity_date': seed.expected_maturity_date.strftime(
                            '%Y-%m-%d') if seed.expected_maturity_date else None,
                        'location': seed.location.name,
                        'notes': seed.notes or '',
                        'entity_type': 'seed'  # To distinguish from mature trees
                    }
                }
                features.append(feature)
            except Exception as e:
                print(f"Error processing seed {seed.id}: {str(e)}")
                continue

        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }

        print(f"Returning {len(features)} seed features")
        return JsonResponse(geojson)
    except Exception as e:
        print(f"Error in seed_data API: {str(e)}")
        return JsonResponse({
            'type': 'FeatureCollection',
            'features': [],
            'error': str(e)
        }, status=500)


def filter_trees(request, species_id):
    """
    API endpoint for filtered tree data
    """
    try:
        # Check if the species exists first
        species = get_object_or_404(TreeSpecies, id=species_id, user=request.user)

        # Get trees for this species
        trees = EndemicTree.objects.filter(species_id=species_id, user=request.user).select_related('species', 'location')

        # For filtered endpoint, still return per-record distribution (not species aggregate)

        # Get pin style
        try:
            pin_style = PinStyle.objects.get(user=request.user, is_default=True)
        except PinStyle.DoesNotExist:
            pin_style = None

        # Convert to GeoJSON format
        features = []
        for tree in trees:
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [tree.location.longitude, tree.location.latitude]
                },
                'properties': {
                    'id': str(tree.id),
                    'species_id': str(tree.species.id),
                    'location_id': str(tree.location.id),  # Add location_id for filtering
                    'common_name': tree.species.common_name,
                    'scientific_name': tree.species.scientific_name,
                    'family': tree.species.genus.family.name,
                    'genus': tree.species.genus.name,
                    'population': tree.population,
                    'health_status': tree.health_status,
                    'year': tree.year,
                    'location': tree.location.name,
                    'notes': tree.notes or '',
                    # Use actual stored health distribution
                    'healthy_count': tree.healthy_count,
                    'good_count': tree.good_count,
                    'bad_count': tree.bad_count,
                    'deceased_count': tree.deceased_count,
                    'hectares': tree.hectares,
                }
            }
            features.append(feature)

        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }

        # Add pin style to response
        if pin_style:
            geojson['pin_style'] = {
                'icon_class': pin_style.icon_class,
                'color': pin_style.color,
                'size': pin_style.size,
                'border_color': pin_style.border_color,
                'border_width': pin_style.border_width,
                'background_color': pin_style.background_color
            }

        return JsonResponse(geojson)
    except Exception as e:
        print(f"Error in filter_trees API: {str(e)}")
        return JsonResponse({
            'type': 'FeatureCollection',
            'features': [],
            'error': str(e)
        })


def analytics_data(request):
    """
    API endpoint for analytics data
    """
    # Species count
    species_count = list(TreeSpecies.objects.filter(user=request.user).annotate(
        count=Count('trees')
    ).values('common_name', 'count').order_by('-count')[:10])

    # Population by year
    population_by_year = list(EndemicTree.objects.filter(user=request.user).values('year').annotate(
        total=Sum('population')
    ).order_by('year'))

    # Population by family
    population_by_family = list(TreeFamily.objects.filter(user=request.user).annotate(
        total=Sum('genera__species__trees__population')
    ).values('name', 'total').order_by('-total')[:10])

    # Health status distribution with detailed counts
    health_status_data = list(EndemicTree.objects.filter(user=request.user).values('health_status').annotate(
        count=Count('id'),
        total_healthy=Sum('healthy_count'),
        total_good=Sum('good_count'),
        total_bad=Sum('bad_count'),
        total_deceased=Sum('deceased_count')
    ).order_by('health_status'))

    # Health status by year with detailed counts
    health_by_year_data = list(EndemicTree.objects.filter(user=request.user).values('year', 'health_status').annotate(
        count=Count('id'),
        total_healthy=Sum('healthy_count'),
        total_good=Sum('good_count'),
        total_bad=Sum('bad_count'),
        total_deceased=Sum('deceased_count')
    ).order_by('year', 'health_status'))

    # Calculate overall health metrics
    total_trees = EndemicTree.objects.filter(user=request.user).aggregate(
        total_healthy=Sum('healthy_count'),
        total_good=Sum('good_count'),
        total_bad=Sum('bad_count'),
        total_deceased=Sum('deceased_count')
    )

    total_count = sum(v for v in total_trees.values() if v is not None)

    if total_count > 0:
        health_metrics = {
            'healthy_percentage': (total_trees['total_healthy'] or 0) / total_count * 100,
            'good_percentage': (total_trees['total_good'] or 0) / total_count * 100,
            'bad_percentage': (total_trees['total_bad'] or 0) / total_count * 100,
            'deceased_percentage': (total_trees['total_deceased'] or 0) / total_count * 100,
        }
    else:
        health_metrics = {
            'healthy_percentage': 0,
            'good_percentage': 0,
            'bad_percentage': 0,
            'deceased_percentage': 0,
        }

    # Historical data analytics based on year
    # Get unique years
    years = EndemicTree.objects.filter(user=request.user).values('year').distinct().order_by('year')
    year_list = [item['year'] for item in years]

    # Species richness by year
    species_richness_by_year = []
    for year in year_list:
        species_count = TreeSpecies.objects.filter(user=request.user, trees__year=year).distinct().count()
        species_richness_by_year.append({
            'year': year,
            'richness': species_count
        })

    # Growth rate calculation between years
    growth_rate_by_year = []
    for i in range(1, len(population_by_year)):
        current_year = population_by_year[i]
        prev_year = population_by_year[i - 1]

        if prev_year['total'] > 0:  # Avoid division by zero
            growth_rate = ((current_year['total'] - prev_year['total']) / prev_year['total']) * 100
        else:
            growth_rate = 0

        growth_rate_by_year.append({
            'year': current_year['year'],
            'growth_rate': round(growth_rate, 2)
        })

    # Environmental metrics (simulated data)
    # In a real app, these would be calculated from actual data
    ecological_zones = [
        {'zone': 'Primary Forest', 'count': 45},
        {'zone': 'Secondary Forest', 'count': 27},
        {'zone': 'Riparian Zones', 'count': 15},
        {'zone': 'Forest Edge', 'count': 8},
        {'zone': 'Mountainous', 'count': 5},
    ]

    # Biodiversity indices (simulated data)
    biodiversity_indices = []
    for year in year_list:
        biodiversity_indices.append({
            'year': year,
            'shannon_index': round(3.0 + (year - min(year_list)) * 0.1, 2),  # Simulated data
            'simpson_index': round(0.8 + (year - min(year_list)) * 0.02, 2),  # Simulated data
        })

    # Top species by population (for charts fallback)
    species_population = list(TreeSpecies.objects.filter(user=request.user).annotate(
        total_population=Sum('trees__population'),
        locations_count=Count('trees__location', distinct=True)
    ).values('common_name', 'scientific_name', 'total_population', 'locations_count')
    .order_by('-total_population')[:10])

    # Add health metrics to the response
    data = {
        'species_count': species_count,
        'population_by_year': population_by_year,
        'population_by_family': population_by_family,
        'species_richness_by_year': species_richness_by_year,
        'growth_rate_by_year': growth_rate_by_year,
        'conservation_status': ecological_zones,
        'biodiversity_indices': biodiversity_indices,
        'health_status_data': health_status_data,
        'health_by_year_data': health_by_year_data,
        'health_metrics': health_metrics,
        'species_data': species_population,
    }

    return JsonResponse(data)


@require_POST
def set_theme(request):
    """
    API endpoint to set theme
    """
    theme = request.POST.get('theme')
    if theme in ['dark', 'light', 'nature']:
        UserSetting.objects.update_or_create(
            key='theme',
            user=request.user,
            defaults={'value': theme}
        )
        return JsonResponse({'status': 'success', 'theme': theme})

    return JsonResponse({'status': 'error', 'message': 'Invalid theme'}, status=400)


@require_POST
def set_map_style(request):
    """
    API endpoint to set map style
    """
    style = request.POST.get('style')
    if style in ['dark', 'normal', 'light', 'satellite', 'topographic']:
        UserSetting.objects.update_or_create(
            key='map_style',
            user=request.user,
            defaults={'value': style}
        )
        return JsonResponse({'status': 'success', 'style': style})

    return JsonResponse({'status': 'error', 'message': 'Invalid map style'}, status=400)


@require_POST
def set_pin_style(request):
    """
    API endpoint to set default pin style
    """
    pin_style_id = request.POST.get('pin_style_id')
    try:
        pin_style = PinStyle.objects.get(id=pin_style_id, user=request.user)
        pin_style.is_default = True
        pin_style.save()
        return JsonResponse({'status': 'success', 'pin_style_id': pin_style_id})
    except PinStyle.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Pin style not found'}, status=404)


@require_POST
def save_setting(request):
    """
    API endpoint to save a single setting
    """
    key = request.POST.get('key')
    value = request.POST.get('value')

    if key and value is not None:
        UserSetting.objects.update_or_create(
            key=key,
            user=request.user,
            defaults={'value': value}
        )
        return JsonResponse({'status': 'success', 'key': key, 'value': value})

    return JsonResponse({'status': 'error', 'message': 'Invalid key or value'}, status=400)


@login_required(login_url='app:login')
def edit_tree(request, tree_id):
    """View for editing a tree record."""
    try:
        tree = get_object_or_404(EndemicTree, id=tree_id, user=request.user)
        
        if request.method == 'POST':
            try:
                # Get form data
                species_id = request.POST.get('species')
                population = int(request.POST.get('population'))
                hectares_str = request.POST.get('hectares', '').strip()
                if not hectares_str:
                    return JsonResponse({
                        'success': False,
                        'error': 'Hectares is required'
                    }, status=400)
                try:
                    hectares = float(hectares_str)
                    if hectares < 0:
                        return JsonResponse({
                            'success': False,
                            'error': 'Hectares must be non-negative'
                        }, status=400)
                except (ValueError, TypeError):
                    return JsonResponse({
                        'success': False,
                        'error': 'Invalid hectares value'
                    }, status=400)
                year = int(request.POST.get('year'))
                health_status = request.POST.get('health_status')
                latitude = float(request.POST.get('latitude'))
                longitude = float(request.POST.get('longitude'))
                notes = request.POST.get('notes')

                # Validate data
                if not all([species_id, population, year, health_status, latitude, longitude]):
                    return JsonResponse({
                        'success': False,
                        'error': 'All required fields must be provided'
                    }, status=400)

                # Update tree record
                tree.species_id = species_id
                tree.population = population
                tree.hectares = hectares
                tree.year = year
                tree.health_status = health_status
                tree.notes = notes

                # Update location
                if not tree.location:
                    from .models import Location
                    tree.location = Location.objects.create(
                        latitude=latitude,
                        longitude=longitude,
                        user=request.user
                    )
                else:
                    tree.location.latitude = latitude
                    tree.location.longitude = longitude
                    tree.location.save()
                
                # Handle image upload
                if 'tree_image' in request.FILES:
                    image_file = request.FILES['tree_image']
                    tree.image = image_file
                    tree.save()
                    # Update all trees with same location and species to use this image
                    # We need to copy the file for each tree, not just reference it
                    for existing_tree in EndemicTree.objects.filter(
                        species=tree.species,
                        location=tree.location,
                        user=request.user
                    ).exclude(id=tree.id):
                        if not existing_tree.image:
                            # Read the image file and create a copy
                            image_file.seek(0)  # Reset file pointer
                            from django.core.files.base import ContentFile
                            image_data = image_file.read()
                            new_image_file = ContentFile(image_data, name=image_file.name)
                            existing_tree.image.save(
                                new_image_file.name,
                                new_image_file,
                                save=True
                            )

                tree.save()

                return JsonResponse({'success': True})
            except (ValueError, TypeError) as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid data format: {str(e)}'
                }, status=400)
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': str(e)
                }, status=500)
        
        elif request.method == 'GET':
            # GET request - return tree data for editing
            return JsonResponse({
                'id': str(tree.id),
                'species_id': str(tree.species.id),
                'population': tree.population,
                'hectares': tree.hectares,
                'year': tree.year,
                'health_status': tree.health_status,
                'latitude': tree.location.latitude,
                'longitude': tree.location.longitude,
                'notes': tree.notes or '',
                'image_url': tree.image.url if tree.image and tree.image.name else None
            })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error accessing tree record: {str(e)}'
        }, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


def cleanup_orphaned_taxonomy(species):
    """
    Helper function to clean up orphaned taxonomy records (species, genus, family)
    that are no longer referenced by any trees or seeds.
    """
    if not species:
        return
    
    # Check if species is still used by any trees or seeds
    if species.trees.exists() or species.seeds.exists():
        return  # Species is still in use, don't delete
    
    # Species is orphaned, get genus before deleting species
    genus = species.genus
    species.delete()
    
    # Check if genus is still used by any species
    if genus and not genus.species.exists():
        # Genus is orphaned, get family before deleting genus
        family = genus.family
        genus.delete()
        
        # Check if family is still used by any genera
        if family and not family.genera.exists():
            family.delete()


@login_required(login_url='app:login')
@require_POST
def delete_tree(request, tree_id):
    """View for deleting a tree record."""
    try:
        tree = get_object_or_404(EndemicTree, id=tree_id, user=request.user)
        location = tree.location
        species = tree.species  # Store species before deleting tree
        
        tree.delete()
        
        # Delete the location if it's not used by any other tree
        if location and not location.trees.exists():
            location.delete()
        
        # Clean up orphaned taxonomy (species, genus, family)
        cleanup_orphaned_taxonomy(species)
            
        return JsonResponse({'success': True})
    except EndemicTree.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Tree record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@require_POST
def delete_trees_bulk(request):
    """View for deleting multiple tree records."""
    try:
        data = json.loads(request.body)
        tree_ids = data.get('tree_ids', [])
        
        if not tree_ids:
            return JsonResponse({
                'success': False,
                'error': 'No tree IDs provided'
            }, status=400)
        
        # Get all trees to delete
        trees = EndemicTree.objects.filter(id__in=tree_ids, user=request.user)
        deleted_count = 0
        locations_to_check = []
        species_to_check = set()  # Use set to avoid duplicates
        
        for tree in trees:
            location = tree.location
            species = tree.species
            locations_to_check.append(location)
            if species:
                species_to_check.add(species)
            tree.delete()
            deleted_count += 1
        
        # Delete locations that are no longer used
        for location in locations_to_check:
            if location and not location.trees.exists():
                location.delete()
        
        # Clean up orphaned taxonomy records
        for species in species_to_check:
            cleanup_orphaned_taxonomy(species)
        
        return JsonResponse({
            'success': True,
            'deleted_count': deleted_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@require_POST
def delete_all_trees(request):
    """View for deleting all tree records."""
    try:
        # Get count before deletion
        total_count = EndemicTree.objects.filter(user=request.user).count()
        
        # Get all locations and species to check after deletion
        locations_to_check = list(Location.objects.filter(user=request.user, trees__isnull=False).distinct())
        species_to_check = set(TreeSpecies.objects.filter(user=request.user, trees__isnull=False).distinct())
        
        # Delete all trees
        EndemicTree.objects.filter(user=request.user).delete()
        
        # Delete locations that are no longer used
        for location in locations_to_check:
            if not location.trees.exists():
                location.delete()
        
        # Clean up all orphaned taxonomy records
        for species in species_to_check:
            cleanup_orphaned_taxonomy(species)
        
        return JsonResponse({
            'success': True,
            'deleted_count': total_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@require_POST
def delete_seed(request, seed_id):
    """View for deleting a seed record."""
    try:
        seed = get_object_or_404(TreeSeed, id=seed_id, user=request.user)
        location = seed.location
        species = seed.species
        seed.delete()
        
        # Delete the location if it's not used by any other tree or seed
        if location and not location.trees.exists() and not location.seeds.exists():
            location.delete()
        
        # Clean up orphaned taxonomy records
        cleanup_orphaned_taxonomy(species)
            
        return JsonResponse({'success': True})
    except TreeSeed.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Seed record not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@require_POST
def delete_seeds_bulk(request):
    """View for deleting multiple seed records."""
    try:
        data = json.loads(request.body)
        seed_ids = data.get('seed_ids', [])
        
        if not seed_ids:
            return JsonResponse({
                'success': False,
                'error': 'No seed IDs provided'
            }, status=400)
        
        # Get all seeds to delete
        seeds = TreeSeed.objects.filter(id__in=seed_ids, user=request.user)
        deleted_count = 0
        locations_to_check = []
        species_to_check = set()
        
        for seed in seeds:
            location = seed.location
            species = seed.species
            locations_to_check.append(location)
            if species:
                species_to_check.add(species)
            seed.delete()
            deleted_count += 1
        
        # Delete locations that are no longer used
        for location in locations_to_check:
            if location and not location.trees.exists() and not location.seeds.exists():
                location.delete()
        
        # Clean up orphaned taxonomy records
        for species in species_to_check:
            cleanup_orphaned_taxonomy(species)
        
        return JsonResponse({
            'success': True,
            'deleted_count': deleted_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@require_POST
def delete_all_seeds(request):
    """View for deleting all seed records."""
    try:
        # Get count before deletion
        total_count = TreeSeed.objects.filter(user=request.user).count()
        
        # Get all locations and species to check after deletion
        locations_to_check = list(Location.objects.filter(user=request.user, seeds__isnull=False).distinct())
        species_to_check = set(TreeSpecies.objects.filter(user=request.user, seeds__isnull=False).distinct())
        
        # Delete all seeds
        TreeSeed.objects.filter(user=request.user).delete()
        
        # Delete locations that are no longer used
        for location in locations_to_check:
            if not location.trees.exists() and not location.seeds.exists():
                location.delete()
        
        # Clean up all orphaned taxonomy records
        for species in species_to_check:
            cleanup_orphaned_taxonomy(species)
        
        return JsonResponse({
            'success': True,
            'deleted_count': total_count
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
def edit_seed(request, seed_id):
    """View for editing a seed record."""
    try:
        seed = get_object_or_404(TreeSeed, id=seed_id, user=request.user)
        
        if request.method == 'POST':
            try:
                # Get form data
                species_id = request.POST.get('species')
                quantity = int(request.POST.get('quantity'))
                planting_date = request.POST.get('planting_date')
                germination_status = request.POST.get('germination_status')
                germination_date = request.POST.get('germination_date') or None
                survival_rate = request.POST.get('survival_rate')
                if survival_rate:
                    survival_rate = float(survival_rate)
                else:
                    survival_rate = None
                # Get hectares (required)
                hectares_str = request.POST.get('hectares', '').strip()
                if not hectares_str:
                    return JsonResponse({
                        'success': False,
                        'error': 'Hectares is required'
                    }, status=400)
                try:
                    hectares = float(hectares_str)
                    if hectares < 0:
                        return JsonResponse({
                            'success': False,
                            'error': 'Hectares must be non-negative'
                        }, status=400)
                except (ValueError, TypeError):
                    return JsonResponse({
                        'success': False,
                        'error': 'Invalid hectares value'
                    }, status=400)
                expected_maturity_date = request.POST.get('expected_maturity_date') or None
                latitude = float(request.POST.get('latitude'))
                longitude = float(request.POST.get('longitude'))
                notes = request.POST.get('notes')
                
                # Validate data
                if not all([species_id, quantity, planting_date, germination_status, latitude, longitude]):
                    return JsonResponse({
                        'success': False,
                        'error': 'All required fields must be provided'
                    }, status=400)
                
                # Update seed record
                seed.species_id = species_id
                seed.quantity = quantity
                seed.planting_date = planting_date
                seed.germination_status = germination_status
                seed.germination_date = germination_date
                seed.survival_rate = survival_rate
                seed.hectares = hectares
                seed.expected_maturity_date = expected_maturity_date
                seed.notes = notes
                
                # Update location
                if not seed.location:
                    seed.location = Location.objects.create(
                        latitude=latitude,
                        longitude=longitude,
                        user=request.user
                    )
                else:
                    seed.location.latitude = latitude
                    seed.location.longitude = longitude
                    seed.location.save()
                
                seed.save()
                
                return JsonResponse({'success': True})
            except (ValueError, TypeError) as e:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid data format: {str(e)}'
                }, status=400)
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'error': str(e)
                }, status=500)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Error accessing seed record: {str(e)}'
        }, status=500)
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)


def api_layers(request):
    """API endpoint for managing map layers."""
    # Only require authentication for POST requests (creating/editing layers)
    if request.method == 'POST' and not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
        
    if request.method == 'GET':
        print("[DEBUG] API layers GET request received")
        layers = MapLayer.objects.all().order_by('-id')
        print(f"[DEBUG] Found {layers.count()} layers in database")
        layers_data = []
        for layer in layers:
            layer_data = {
                'id': str(layer.id),
                'name': layer.name,
                'description': layer.description,
                'layer_type': layer.layer_type,
                'url': layer.url,
                'attribution': layer.attribution,
                'is_active': layer.is_active,
                'is_default': layer.is_default,
                'z_index': layer.z_index
            }
            layers_data.append(layer_data)
            print(f"[DEBUG] Layer: {layer.name} (active: {layer.is_active})")
        
        response_data = {'layers': layers_data}
        print(f"[DEBUG] Returning response: {response_data}")
        return JsonResponse(response_data)
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(f"Received data: {data}")  # Debug logging
            print(f"Layer type: {data.get('layer_type')}")  # Debug logging
            print(f"URL: {data.get('url')}")  # Debug logging
            
            # Validate required fields
            if not data.get('name'):
                return JsonResponse({
                    'success': False,
                    'error': 'Layer name is required'
                }, status=400)
            
            if not data.get('layer_type'):
                return JsonResponse({
                    'success': False,
                    'error': 'Layer type is required'
                }, status=400)
            
            if not data.get('url'):
                return JsonResponse({
                    'success': False,
                    'error': 'Layer URL is required'
                }, status=400)
            
            # Validate layer_type choices
            valid_layer_types = ['topographic', 'satellite', 'street', 'heatmap', 'protected', 'landuse', 'soil', 'custom']
            if data.get('layer_type') not in valid_layer_types:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid layer type. Must be one of: {", ".join(valid_layer_types)}'
                }, status=400)
            
            # Create the layer
            layer = MapLayer.objects.create(
                name=data.get('name'),
                description=data.get('description', ''),
                layer_type=data.get('layer_type'),
                url=data.get('url'),
                attribution=data.get('attribution', ''),
                is_active=data.get('is_active', True),
                is_default=data.get('is_default', False)
            )
            print(f"Layer created successfully: {layer.id}")  # Debug logging
            return JsonResponse({
                'success': True,
                'layer': {
                    'id': str(layer.id),
                    'name': layer.name,
                    'description': layer.description,
                    'layer_type': layer.layer_type,
                    'url': layer.url,
                    'attribution': layer.attribution,
                    'is_active': layer.is_active,
                    'is_default': layer.is_default,
                    'z_index': layer.z_index
                }
            }, status=201)
        except Exception as e:
            print(f"Error creating layer: {str(e)}")  # Debug logging
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)


@login_required(login_url='app:login')
def api_layers_detail(request, layer_id):
    """API endpoint for managing individual map layers."""
    try:
        layer = MapLayer.objects.get(id=layer_id)
    except MapLayer.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Layer not found'
        }, status=404)
    
    if request.method == 'GET':
        return JsonResponse({
            'layer': {
                'id': str(layer.id),
                'name': layer.name,
                'description': layer.description,
                'layer_type': layer.layer_type,
                'url': layer.url,
                'attribution': layer.attribution,
                'is_active': layer.is_active,
                'is_default': layer.is_default,
                'z_index': layer.z_index
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print(f"PUT request data: {data}")  # Debug logging
            print(f"URL from data: {data.get('url')}")  # Debug logging
            
            layer.name = data.get('name', layer.name)
            layer.description = data.get('description', layer.description)
            layer.layer_type = data.get('layer_type', layer.layer_type)
            layer.url = data.get('url', layer.url)
            layer.attribution = data.get('attribution', layer.attribution)
            layer.is_active = data.get('is_active', layer.is_active)
            layer.is_default = data.get('is_default', layer.is_default)
            
            print(f"About to save layer with URL: {layer.url}")  # Debug logging
            layer.save()
            
            return JsonResponse({
                'success': True,
                'layer': {
                    'id': str(layer.id),
                    'name': layer.name,
                    'description': layer.description,
                    'layer_type': layer.layer_type,
                    'url': layer.url,
                    'attribution': layer.attribution,
                    'is_active': layer.is_active,
                    'is_default': layer.is_default,
                    'z_index': layer.z_index
                }
            })
        except Exception as e:
            print(f"Error updating layer: {str(e)}")  # Debug logging
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    elif request.method == 'DELETE':
        try:
            layer.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@login_required(login_url='app:login')
def api_supabase_data(request):
    """API endpoint for managing public tree photo submissions from the public app."""
    try:
        from public.models import TreePhotoSubmission
        
        if request.method == 'GET':
            # Fetch all data from public submissions
            submissions = TreePhotoSubmission.objects.all().order_by('-created_at')
            data = []
            for submission in submissions:
                data.append({
                    'id': submission.id,
                    'tree_description': submission.tree_description,
                    'person_name': submission.person_name,
                    'latitude': submission.latitude,
                    'longitude': submission.longitude,
                    'image_url': f'/public-submission-image/{submission.id}/',
                    'created_at': submission.created_at.isoformat(),
                    'image_format': submission.image_format,
                })
            return JsonResponse({
                'success': True,
                'data': data
            })
            
        elif request.method == 'POST':
            # Add new endemic tree to SQLite from form data
            data = json.loads(request.body)
            
            # Validate required fields (including health distribution)
            required_fields = [
                'common_name', 'scientific_name', 'family', 'genus',
                'latitude', 'longitude', 'population', 'year', 'health_status',
                'healthy_count', 'good_count', 'bad_count', 'deceased_count'
            ]
            missing_fields = [field for field in required_fields if data.get(field) in [None, "", []]]
            
            if missing_fields:
                return JsonResponse({
                    'success': False,
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=400)
            
            # Server-side validation: health distribution must match population
            try:
                pop = int(data.get('population'))
                healthy = int(data.get('healthy_count'))
                good = int(data.get('good_count'))
                bad = int(data.get('bad_count'))
                deceased = int(data.get('deceased_count'))
            except (TypeError, ValueError):
                return JsonResponse({
                    'success': False,
                    'error': 'Health counts and population must be integers.'
                }, status=400)
            total_health = healthy + good + bad + deceased
            if total_health != pop:
                return JsonResponse({
                    'success': False,
                    'error': f'Health status total ({total_health}) must equal the total population ({pop}).'
                }, status=400)
            
            # Create or get family
            family_name = data.get('family')
            family, _ = TreeFamily.objects.get_or_create(name=family_name, user=request.user)
            
            # Create or get genus
            genus_name = data.get('genus')
            genus, _ = TreeGenus.objects.get_or_create(
                name=genus_name,
                user=request.user,
                defaults={'family': family}
            )
            
            # Create or get species
            scientific_name = data.get('scientific_name')
            common_name = data.get('common_name')
            species, _ = TreeSpecies.objects.get_or_create(
                scientific_name=scientific_name,
                user=request.user,
                defaults={
                    'common_name': common_name,
                    'genus': genus
                }
            )
            
            # Create or get location
            latitude = float(data.get('latitude'))
            longitude = float(data.get('longitude'))
            location_name = data.get('location_name', f"{common_name} Location")
            
            location, _ = Location.objects.get_or_create(
                latitude=latitude,
                longitude=longitude,
                user=request.user,
                defaults={'name': location_name}
            )
            
            # Get health distribution counts
            healthy_count = int(data.get('healthy_count', 0))
            good_count = int(data.get('good_count', 0))
            bad_count = int(data.get('bad_count', 0))
            deceased_count = int(data.get('deceased_count', 0))
            
            # Get hectares (required)
            hectares = data.get('hectares')
            if hectares is None:
                return JsonResponse({'success': False, 'error': 'hectares is required'}, status=400)
            try:
                hectares = float(hectares)
                if hectares < 0:
                    return JsonResponse({'success': False, 'error': 'hectares must be non-negative'}, status=400)
            except (ValueError, TypeError):
                return JsonResponse({'success': False, 'error': 'invalid hectares value'}, status=400)
            
            # Check if there's an existing tree with same location and species
            existing_tree = EndemicTree.objects.filter(
                species=species,
                location=location,
                user=request.user
            ).exclude(image__isnull=True).exclude(image='').first()
            
            # Get image from public submission if submission_id is provided
            from django.core.files.base import ContentFile
            tree_image = None
            submission_id = data.get('supabase_id')
            # Convert to int if it's a string
            if submission_id:
                try:
                    submission_id = int(submission_id)
                except (ValueError, TypeError):
                    print(f"Warning: Invalid submission_id format: {submission_id}")
                    submission_id = None
            print(f"DEBUG: Import request - submission_id: {submission_id}, data keys: {list(data.keys())}")
            if submission_id:
                try:
                    submission = TreePhotoSubmission.objects.get(id=submission_id)
                    # Convert binary data to Django ImageField-compatible format
                    
                    # Get binary image data
                    image_data = submission.tree_image
                    if isinstance(image_data, memoryview):
                        image_data = bytes(image_data)
                    elif not isinstance(image_data, bytes):
                        image_data = bytes(image_data)
                    
                    # Validate image data
                    if not image_data or len(image_data) == 0:
                        print(f"Warning: Submission {submission_id} has empty image data")
                    else:
                        # Create a ContentFile from binary data
                        extension = 'jpg' if submission.image_format == 'JPEG' else 'png'
                        image_file = ContentFile(image_data, name=f'submission_{submission_id}.{extension}')
                        tree_image = image_file
                        print(f"Created ContentFile for submission {submission_id}: {len(image_data)} bytes, extension: {extension}")
                except TreePhotoSubmission.DoesNotExist:
                    print(f"Submission {submission_id} not found")
                    pass
                except Exception as e:
                    print(f"Error copying image from submission {submission_id}: {str(e)}")
                    import traceback
                    traceback.print_exc()
            elif existing_tree and existing_tree.image:
                # Use existing image if available
                tree_image = existing_tree.image
            
            # Create endemic tree record (without image first if we need to handle it separately)
            tree = EndemicTree(
                species=species,
                location=location,
                population=int(data.get('population')),
                year=int(data.get('year')),
                health_status=data.get('health_status'),
                healthy_count=healthy_count,
                good_count=good_count,
                bad_count=bad_count,
                deceased_count=deceased_count,

                hectares=hectares,
                notes=data.get('notes', f"Imported from public submission - ID: {data.get('supabase_id', 'Unknown')}"),
                user=request.user
            )
            
            # Save tree first to get an ID
            tree.save()
            
            # Now assign and save the image if we have one
            if tree_image:
                # If tree_image is a ContentFile (from submission), we need to save it properly
                if isinstance(tree_image, ContentFile):
                    # Reset file pointer to beginning
                    tree_image.seek(0)
                    try:
                        tree.image.save(
                            tree_image.name,
                            tree_image,
                            save=True
                        )
                        # Refresh from database to ensure image is saved
                        tree.refresh_from_db()
                        print(f"Successfully saved image for tree {tree.id}: {tree.image.name}")
                    except Exception as e:
                        print(f"Error saving image for tree {tree.id}: {str(e)}")
                else:
                    # If it's an existing ImageField, just assign it
                    tree.image = tree_image
                    tree.save()
                    print(f"Assigned existing image to tree {tree.id}: {tree.image.name if tree.image else None}")
                
                # If we imported a new image, update all trees with same location and species
                if submission_id:
                    try:
                        submission = TreePhotoSubmission.objects.get(id=submission_id)
                        # Get binary image data from submission
                        image_data = submission.tree_image
                        if isinstance(image_data, memoryview):
                            image_data = bytes(image_data)
                        elif not isinstance(image_data, bytes):
                            image_data = bytes(image_data)
                        
                        extension = 'jpg' if submission.image_format == 'JPEG' else 'png'
                        for existing in EndemicTree.objects.filter(species=species, location=location, user=request.user).exclude(id=tree.id):
                            if not existing.image:
                                # Create a new ContentFile for each existing tree
                                new_image_file = ContentFile(image_data, name=f'submission_{submission_id}_{existing.id}.{extension}')
                                existing.image.save(
                                    new_image_file.name,
                                    new_image_file,
                                    save=True
                                )
                    except TreePhotoSubmission.DoesNotExist:
                        pass
                    except Exception as e:
                        print(f"Error copying image to existing trees: {str(e)}")
            else:
                print(f"No image to save for tree {tree.id}")
            
            return JsonResponse({
                'success': True,
                'message': f'Successfully added {common_name} to database',
                'tree_id': str(tree.id)
            })
            
        elif request.method == 'DELETE':
            # Delete data from public submissions
            data = json.loads(request.body)
            submission_id = data.get('supabase_id')  # Keep same key for JS compatibility
            
            if not submission_id:
                return JsonResponse({
                    'success': False,
                    'error': 'Submission ID is required'
                }, status=400)
            
            try:
                # Delete from public submissions
                submission = TreePhotoSubmission.objects.get(id=submission_id)
                submission.delete()
                
                return JsonResponse({
                    'success': True,
                    'message': 'Successfully deleted public submission'
                })
                    
            except TreePhotoSubmission.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': 'Submission not found'
                }, status=404)
            except Exception as e:
                print(f"Error deleting public submission: {str(e)}")
                return JsonResponse({
                    'success': False,
                    'error': f'Failed to delete submission: {str(e)}'
                }, status=500)
            
    except Exception as e:
        print(f"Error in public submissions API: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
def public_submission_image(request, submission_id):
    """Serve image from public TreePhotoSubmission as HTTP response."""
    try:
        from public.models import TreePhotoSubmission
        
        submission = TreePhotoSubmission.objects.get(id=submission_id)
        
        # Get binary data - BinaryField returns bytes
        image_data = submission.tree_image
        if isinstance(image_data, memoryview):
            image_data = bytes(image_data)
        elif not isinstance(image_data, bytes):
            image_data = bytes(image_data)
        
        # Determine content type based on image format
        if submission.image_format == 'JPEG':
            content_type = 'image/jpeg'
        elif submission.image_format == 'PNG':
            content_type = 'image/png'
        else:
            content_type = 'image/jpeg'  # Default
        
        # Create response with proper headers
        response = HttpResponse(image_data, content_type=content_type)
        response['Content-Length'] = len(image_data)
        response['Cache-Control'] = 'public, max-age=3600'
        
        return response
        
    except TreePhotoSubmission.DoesNotExist:
        return HttpResponseNotFound("Image not found")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return HttpResponseServerError(f"Error serving image: {str(e)}")
