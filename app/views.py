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
from django.contrib.sessions.models import Session
from django.urls import reverse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.utils import timezone

from .models import (
    EndemicTree, MapLayer, UserSetting, TreeFamily,
    TreeGenus, TreeSpecies, Location, PinStyle, TreeSeed, UserProfile, History
)
from .forms import (
    EndemicTreeForm, CSVUploadForm, ThemeSettingsForm,
    PinStyleForm, LocationForm
)
from .utils import geocode_location, get_address_from_coordinates
from django.views.decorators.http import require_http_methods


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


def get_user_type(user):
    """Helper function to get user type from profile"""
    try:
        return user.profile.user_type
    except (AttributeError, UserProfile.DoesNotExist):
        # Default to app_user if no profile exists
        return 'app_user'


def user_login(request):
    """
    Handle user login - only for app users
    """
    if request.user.is_authenticated:
        return redirect('app:dashboard')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Check user type - only allow app_user
            user_type = get_user_type(user)
            if user_type != 'app_user':
                return render(request, 'app/login.html', {
                    'error_message': 'This account is not authorized to access the app. Please use the correct login portal.',
                    'theme': get_setting(request.user, 'theme', 'dark')
                })
            
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
    # Check user type
    user_type = get_user_type(request.user)
    if user_type != 'app_user':
        messages.error(request, 'You do not have permission to access this page.')
        return redirect('app:login')
    
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
        
        # Get unique years for filter
        years = sorted(list(EndemicTree.objects.filter(user=request.user).values_list('year', flat=True).distinct()))
        
        # Get unique areas for filter (from addresses)
        def parse_administrative_area(address):
            if not address:
                return None
            parts = [p.strip() for p in address.split(',')]
            if len(parts) >= 2:
                return f"{parts[-2]}, {parts[-1]}"
            elif len(parts) == 1:
                return parts[0]
            return None
        
        locations = Location.objects.filter(user=request.user).exclude(address__isnull=True).exclude(address='')
        areas = set()
        for loc in locations:
            area = parse_administrative_area(loc.address)
            if area:
                areas.add(area)
        areas = sorted(list(areas))
        
        # Get species list for filter
        species_list = list(TreeSpecies.objects.filter(user=request.user)
            .order_by('common_name')
            .values('id', 'common_name', 'scientific_name'))

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
            } for item in (health_data or [])]),
            'years': years,
            'areas': areas,
            'species_list': species_list
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

    # Get only tree species that have actual tree records (not all taxonomy entries)
    # Manage Taxonomy is for autocomplete/suggestions only, not for display in GIS
    tree_species = TreeSpecies.objects.filter(
        user=request.user,
        trees__isnull=False  # Only species that have associated tree records
    ).distinct().order_by('common_name')  # Remove duplicates and order by common name

    # Get unique years from trees
    unique_years = EndemicTree.objects.filter(user=request.user).values_list('year', flat=True).distinct().order_by('-year')

    # Get default pin style
    try:
        default_pin = PinStyle.objects.get(user=request.user, is_default=True)
    except PinStyle.DoesNotExist:
        default_pin = None

    context = {
        'active_page': 'gis',
        'layers': layers,
        'tree_species': tree_species,
        'unique_years': unique_years,
        'default_pin': default_pin,
    }
    return render(request, 'app/gis.html', context)


@login_required(login_url='app:login')
def analytics(request):
    """
    Analytics and visualization view - Population by Address with Species Breakdown
    """
    try:
        # Check if there's any data in the database
        if not EndemicTree.objects.filter(user=request.user).exists():
            return render(request, 'app/analytics.html', {
                'active_page': 'analytics',
                'address_species_data': '[]',
                'health_by_species': '[]',
                'heights': '[]',
                'diameters': '[]',
                'total_healthy': 0,
                'total_not_healthy': 0,
                'tree_coordinates': '[]',
                'seed_sources': '[]',
                'unique_species': []
            })

        # Get all trees for analytics (including those without addresses for scatter plot)
        all_trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location')
        
        # Get population by address and species (for existing charts)
        trees = all_trees.exclude(location__address__isnull=True).exclude(location__address='')

        # Group by address and species
        address_species_map = {}
        
        for tree in trees:
            address = tree.location.address if tree.location and tree.location.address else 'Unknown'
            species_name = tree.species.common_name if tree.species else 'Unknown'
            species_id = tree.species.id if tree.species else None
            
            if address not in address_species_map:
                address_species_map[address] = {}
            
            if species_name not in address_species_map[address]:
                address_species_map[address][species_name] = {
                    'species_id': species_id,
                    'species_name': species_name,
                    'population': 0
                }
            
            address_species_map[address][species_name]['population'] += tree.population
        
        # Collect data for new charts
        # 1. Health status per species (for stacked bar chart)
        health_by_species = {}
        # 2. Height and diameter data (for histogram)
        heights = []
        diameters = []
        # 3. Total healthy vs not healthy (for pie chart)
        total_healthy = 0
        total_not_healthy = 0
        # 4. Tree coordinates with health/species (for scatter plot)
        tree_coordinates = []
        
        for tree in all_trees:
            species_name = tree.species.common_name if tree.species else 'Unknown'
            
            # Health status per species
            if species_name not in health_by_species:
                health_by_species[species_name] = {'healthy': 0, 'not_healthy': 0}
            
            # Determine healthy count
            is_healthy = tree.is_healthy if tree.is_healthy is not None else True
            healthy_count = tree.healthy_count if tree.healthy_count else (tree.population if is_healthy else 0)
            not_healthy_count = (tree.bad_count or 0) + (tree.deceased_count or 0)
            if not_healthy_count == 0 and not is_healthy:
                not_healthy_count = tree.population
            
            health_by_species[species_name]['healthy'] += healthy_count
            health_by_species[species_name]['not_healthy'] += not_healthy_count
            
            # Total healthy vs not healthy
            total_healthy += healthy_count
            total_not_healthy += not_healthy_count
            
            # Height and diameter data
            if tree.height_meters is not None:
                heights.append(float(tree.height_meters))
            if tree.diameter_cm is not None:
                diameters.append(float(tree.diameter_cm))
            
            # Coordinates for scatter plot
            if tree.location and tree.location.latitude and tree.location.longitude:
                tree_coordinates.append({
                    'latitude': float(tree.location.latitude),
                    'longitude': float(tree.location.longitude),
                    'species': species_name,
                    'is_healthy': is_healthy,
                    'health_status': 'Healthy' if is_healthy else 'Not Healthy'
                })

        # Convert to list format for chart
        address_species_data = []
        for address, species_dict in address_species_map.items():
            address_species_data.append({
                'address': address,
                'species': list(species_dict.values())
            })

        # Sort addresses by total population (descending)
        address_species_data.sort(
            key=lambda x: sum(s['population'] for s in x['species']),
            reverse=True
        )

        # Calculate low population trees based on IUCN Regional Red List Guidelines
        # IUCN thresholds for regional assessments:
        # Critically Endangered (CR): < 50 mature individuals
        # Endangered (EN): 50-250 mature individuals
        # Vulnerable (VU): 250-1,000 mature individuals
        # Near Threatened (NT): 1,000-2,500 mature individuals
        
        # Group trees by species to get total population per species
        species_population_map = {}
        for tree in all_trees:
            if tree.species:
                species_name = tree.species.common_name or 'Unknown'
                scientific_name = tree.species.scientific_name or 'Unknown'
                species_key = f"{species_name}|{scientific_name}"
                
                if species_key not in species_population_map:
                    species_population_map[species_key] = {
                        'common_name': species_name,
                        'scientific_name': scientific_name,
                        'total_population': 0,
                        'locations': set(),
                        'addresses': set()
                    }
                
                species_population_map[species_key]['total_population'] += tree.population or 0
                if tree.location:
                    if tree.location.address:
                        species_population_map[species_key]['addresses'].add(tree.location.address)
                    if tree.location.latitude and tree.location.longitude:
                        species_population_map[species_key]['locations'].add(
                            (float(tree.location.latitude), float(tree.location.longitude))
                        )
        
        # Identify trees with low population based on IUCN criteria
        low_population_trees = []
        for species_key, data in species_population_map.items():
            total_pop = data['total_population']
            
            # Determine IUCN conservation status based on population
            if total_pop < 50:
                iucn_status = 'Critically Endangered (CR)'
                iucn_code = 'CR'
            elif total_pop < 250:
                iucn_status = 'Endangered (EN)'
                iucn_code = 'EN'
            elif total_pop < 1000:
                iucn_status = 'Vulnerable (VU)'
                iucn_code = 'VU'
            elif total_pop < 2500:
                iucn_status = 'Near Threatened (NT)'
                iucn_code = 'NT'
            else:
                continue  # Skip species with adequate population
            
            # Get addresses as list
            addresses_list = sorted(list(data['addresses'])) if data['addresses'] else ['Unknown']
            addresses_display = " / ".join(addresses_list[:5])  # Show up to 5 addresses
            if len(addresses_list) > 5:
                addresses_display += f" (+{len(addresses_list) - 5} more)"
            
            low_population_trees.append({
                'common_name': data['common_name'],
                'scientific_name': data['scientific_name'],
                'total_population': int(total_pop),
                'locations_count': len(data['locations']),
                'addresses': addresses_display,
                'iucn_status': iucn_status,
                'iucn_code': iucn_code
            })
        
        # Sort by population (ascending - lowest first) and then by IUCN code priority
        iucn_priority = {'CR': 1, 'EN': 2, 'VU': 3, 'NT': 4}
        low_population_trees.sort(key=lambda x: (iucn_priority.get(x['iucn_code'], 5), x['total_population']))
        
        print(f"[Analytics] Total low population species found: {len(low_population_trees)}")
        
        # Keep seed_sources for backward compatibility but use low_population_trees
        seed_sources = low_population_trees

        # Handle None values and convert Decimal to float for JSON serialization
        def clean_data(data):
            if isinstance(data, list):
                return [clean_data(item) for item in data]
            elif isinstance(data, dict):
                return {k: clean_data(v) if v is not None else 0 for k, v in data.items()}
            elif str(type(data)) == "<class 'decimal.Decimal'>":
                return float(data)
            return data

        # Clean and prepare data for JSON serialization
        address_species_data = clean_data(address_species_data or [])
        # Clean low population trees data
        seed_sources = clean_data(seed_sources or [])
        
        # Prepare new chart data
        health_by_species_list = [{'species': k, 'healthy': v['healthy'], 'not_healthy': v['not_healthy']} 
                                   for k, v in health_by_species.items()]
        health_by_species_list.sort(key=lambda x: x['healthy'] + x['not_healthy'], reverse=True)

        # Get unique species for filter dropdown
        unique_species = list(TreeSpecies.objects.filter(
            user=request.user,
            trees__isnull=False
        ).distinct().values_list('common_name', flat=True).order_by('common_name'))
        
        context = {
            'active_page': 'analytics',
            'address_species_data': json.dumps(address_species_data),
            'seed_sources': json.dumps(seed_sources),
            'health_by_species': json.dumps(health_by_species_list),
            'heights': json.dumps(heights),
            'diameters': json.dumps(diameters),
            'total_healthy': total_healthy,
            'total_not_healthy': total_not_healthy,
            'tree_coordinates': json.dumps(tree_coordinates),
            'unique_species': unique_species
        }

        return render(request, 'app/analytics.html', context)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Analytics Error: {str(e)}")
        # Return empty data in case of error
        context = {
            'active_page': 'analytics',
            'address_species_data': '[]',
            'seed_sources': '[]',
            'health_by_species': '[]',
            'heights': '[]',
            'diameters': '[]',
            'total_healthy': 0,
            'total_not_healthy': 0,
            'tree_coordinates': '[]'
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
    trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location', 'species__genus', 'species__genus__family').all()
    species_list = TreeSpecies.objects.filter(user=request.user).select_related('genus', 'genus__family').all().order_by('common_name')

    # Expand aggregated trees into individual tree rows (each row = 1 tree)
    expanded_trees = []
    for tree in trees:
        total_trees = tree.population
        
        # Get health counts
        healthy_count = tree.healthy_count or 0
        not_healthy_count = tree.bad_count or 0
        
        # Determine planted vs existing based on is_planted flag
        # If is_planted=True, all trees are planted; otherwise all are existing
        is_planted_flag = tree.is_planted if hasattr(tree, 'is_planted') else False
        
        # Create individual tree rows
        for i in range(total_trees):
            # Determine if this tree is healthy or not healthy
            # First healthy_count trees are healthy, rest are not healthy
            is_healthy_tree = i < healthy_count
            
            # Set planted/existing values
            if is_planted_flag:
                planted_value = 1
                existing_value = 0
            else:
                planted_value = 0
                existing_value = 1
            
            # Set healthy/not healthy values
            if is_healthy_tree:
                healthy_value = 1
                not_healthy_value = 0
            else:
                healthy_value = 0
                not_healthy_value = 1
            
            expanded_trees.append({
                'id': tree.id,
                'common_name': tree.species.common_name,
                'scientific_name': tree.species.scientific_name,
                'family': tree.species.genus.family.name if tree.species.genus and tree.species.genus.family else '',
                'genus': tree.species.genus.name if tree.species.genus else '',
                'hectars': tree.hectares,
                'planted': planted_value,
                'existing': existing_value,
                'height': tree.height_meters,
                'diameter_breast': tree.diameter_cm,
                'healthy': healthy_value,
                'not_healthy': not_healthy_value,
                'latitude': tree.location.latitude,
                'longitude': tree.location.longitude,
                'address': tree.location.address or '',
                'year': tree.year,
            })

    # Get unique values for filters
    unique_common_names = sorted(set(tree['common_name'] for tree in expanded_trees if tree['common_name']))
    unique_addresses = sorted(set(tree['address'] for tree in expanded_trees if tree['address']))
    unique_years = sorted(set(tree['year'] for tree in expanded_trees if tree['year']), reverse=True)

    context = {
        'active_page': 'datasets',
        'trees': expanded_trees,
        'species_list': species_list,
        'unique_common_names': unique_common_names,
        'unique_addresses': unique_addresses,
        'unique_years': unique_years,
    }
    return render(request, 'app/datasets.html', context)


@login_required(login_url='app:login')
def upload_species_images(request):
    """
    Display all species (with and without images) and allow uploading/changing images for them
    """
    # Get all species for the user
    all_species = TreeSpecies.objects.filter(user=request.user)
    
    # Track unique combinations of common_name and scientific_name
    species_data = []
    seen_combinations = set()
    
    # Process all species (both with and without images)
    for species in all_species.order_by('common_name', 'scientific_name'):
        key = (species.common_name.lower(), species.scientific_name.lower())
        
        # Skip if we've already seen this combination
        if key in seen_combinations:
            continue
        
        seen_combinations.add(key)
        
        # Get count of trees for this species combination
        tree_count = EndemicTree.objects.filter(
            species__common_name=species.common_name,
            species__scientific_name=species.scientific_name,
            user=request.user
        ).count()
        
        if tree_count > 0:  # Only show if there are trees
            # Check if this species has an image (check any species with same common_name and scientific_name)
            has_image = TreeSpecies.objects.filter(
                common_name=species.common_name,
                scientific_name=species.scientific_name,
                user=request.user,
                image__isnull=False
            ).exists()
            
            # Get the species instance that has the image (if any)
            species_with_image = None
            if has_image:
                species_with_image = TreeSpecies.objects.filter(
                    common_name=species.common_name,
                    scientific_name=species.scientific_name,
                    user=request.user,
                    image__isnull=False
                ).first()
            
            species_data.append({
                'species': species_with_image if species_with_image else species,
                'tree_count': tree_count,
                'common_name': species.common_name,
                'scientific_name': species.scientific_name,
                'has_image': has_image,
            })
    
    context = {
        'active_page': 'datasets',  # Show as part of datasets section
        'species_data': species_data,
    }
    return render(request, 'app/upload_species_images.html', context)


@login_required(login_url='app:login')
def upload_species_image_api(request):
    """
    API endpoint to upload image for a species
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Only POST method allowed'}, status=405)
    
    try:
        species_id = request.POST.get('species_id')
        if not species_id:
            return JsonResponse({'success': False, 'error': 'species_id is required'}, status=400)
        
        # Get species
        try:
            species = TreeSpecies.objects.get(id=species_id, user=request.user)
        except TreeSpecies.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Species not found'}, status=404)
        
        # Check if image file is provided
        if 'image' not in request.FILES:
            return JsonResponse({'success': False, 'error': 'No image file provided'}, status=400)
        
        image_file = request.FILES['image']
        
        # Read image as binary
        image_file.seek(0)
        image_data = image_file.read()
        
        # Determine and store image format
        content_type = image_file.content_type
        if 'jpeg' in content_type or 'jpg' in content_type:
            image_format = 'JPEG'
        elif 'png' in content_type:
            image_format = 'PNG'
        else:
            return JsonResponse({'success': False, 'error': 'Unsupported image format. Only JPEG and PNG are allowed.'}, status=400)
        
        # Store binary data in species (update if exists, create if not)
        species.image = image_data
        species.image_format = image_format
        species.save()
        
        # Update all species with same common_name and scientific_name to have the same image
        TreeSpecies.objects.filter(
            common_name=species.common_name,
            scientific_name=species.scientific_name,
            user=request.user
        ).update(image=image_data, image_format=image_format)
        
        return JsonResponse({
            'success': True,
            'message': f'Image uploaded successfully for {species.common_name} ({species.scientific_name})'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


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
                    # Initialize progress tracking FIRST, before processing
                    # This ensures the progress API can return status immediately
                    request.session['csv_upload_progress'] = {
                        'total': 0,
                        'processed': 0,
                        'geocoded': 0,
                        'status': 'initializing'
                    }
                    request.session.save()
                    
                    df = pd.read_csv(csv_file)
                    
                    # Normalize column names (case-insensitive, strip whitespace, remove trailing colons)
                    df.columns = df.columns.str.strip().str.rstrip(':').str.strip().str.lower()
                    
                    # Map various column name formats to standard names
                    column_mapping = {
                        'common name': 'common_name',
                        'common_name': 'common_name',
                        'scientific name': 'scientific_name',
                        'scientific_name': 'scientific_name',
                        'family': 'family',
                        'genus': 'genus',
                        'hectars': 'hectares',
                        'hectares': 'hectares',
                        'planted': 'planted',
                        'existing': 'existing',
                        'height': 'height',
                        'height_meters': 'height',
                        'diameter breast': 'diameter_cm',
                        'diameter breast height': 'diameter_cm',
                        'diameter_breast': 'diameter_cm',
                        'dbh': 'diameter_cm',
                        'diameter_cm': 'diameter_cm',
                        'healthy': 'healthy',
                        'not healthy': 'not_healthy',
                        'not_healthy': 'not_healthy',
                        'latitude': 'latitude',
                        'longitude': 'longitude',
                        'address': 'address',
                        'year': 'year',
                    }
                    
                    # Apply column mapping
                    df.rename(columns=column_mapping, inplace=True)
                    
                    # Required columns - each row represents 1 tree
                    required_columns = ['common_name', 'scientific_name', 'family', 'genus', 'latitude', 'longitude', 'year']
                    
                    # Check for hectares or hectars
                    if 'hectares' not in df.columns and 'hectars' not in df.columns:
                        required_columns.append('hectares')

                    # Check if all required columns exist
                    missing_columns = [col for col in required_columns if col not in df.columns]
                    if missing_columns:
                        request.session['csv_upload_progress'] = {
                            'status': 'failed',
                            'error': f'Missing required columns: {", ".join(missing_columns)}'
                        }
                        request.session.save()
                        messages.error(request, f'Missing required columns: {", ".join(missing_columns)}')
                        return redirect('app:upload')

                    # Update progress with actual total
                    total_rows = len(df)
                    request.session['csv_upload_progress'] = {
                        'total': total_rows,
                        'processed': 0,
                        'geocoded': 0,
                        'status': 'processing'
                    }
                    request.session.save()
                    
                    # Process each row - each row represents one tree
                    # Create individual tree records (no aggregation)
                    success_count = 0
                    error_count = 0
                    
                    # Track details for logging
                    uploaded_species = {}  # {species_name: count}
                    total_hectares = 0
                    years_uploaded = set()
                    
                    # Process each row and create individual tree records
                    for idx, row in df.iterrows():
                        # Check for cancellation flag
                        if request.session.get('csv_upload_cancelled'):
                            # Clear cancellation flag
                            request.session['csv_upload_cancelled'] = False
                            request.session['csv_upload_progress'] = {
                                'status': 'cancelled',
                                'processed': success_count + error_count,
                                'total': total_rows,
                                'success': success_count,
                                'errors': error_count
                            }
                            request.session.save()
                            messages.warning(request, f'Upload cancelled. {success_count} trees were imported before cancellation.')
                            return redirect('app:upload')
                        
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

                            # Get location coordinates
                            lat = float(row['latitude'])
                            lon = float(row['longitude'])
                            
                            # Get address from CSV if provided
                            address_from_csv = row.get('address', '')
                            if pd.notna(address_from_csv) and str(address_from_csv).strip():
                                address_value = str(address_from_csv).strip()
                            else:
                                address_value = ''  # Leave empty if not provided in CSV
                            
                            # Get or create location with address from CSV if provided
                            location, created = Location.objects.get_or_create(
                                latitude=lat,
                                longitude=lon,
                                user=request.user,
                                defaults={
                                    'name': f"{row['common_name']} location",
                                    'address': address_value
                                }
                            )
                            
                            # If location exists and CSV has address, update it
                            if address_value and not location.address:
                                location.address = address_value
                                location.save(update_fields=['address'])
                            
                            # Note: CSV upload doesn't support images - images must be uploaded via manual entry

                            # Create tree record
                            notes = row.get('notes', '')
                            
                            # Handle PLANTED/EXISTING - each row represents 1 tree
                            planted_value = row.get('planted', '')
                            existing_value = row.get('existing', '')
                            
                            # Each row = 1 tree, so population is always 1
                            population = 1
                            
                            # Determine if planted or existing based on which field has a value
                            if pd.notna(planted_value) and str(planted_value).strip():
                                planted_str = str(planted_value).strip().lower()
                                if planted_str in ['true', '1', 'yes', 'y', 'planted']:
                                    is_planted = True
                                else:
                                    try:
                                        val = float(planted_value)
                                        is_planted = val > 0
                                    except (ValueError, TypeError):
                                        is_planted = False
                            elif pd.notna(existing_value) and str(existing_value).strip():
                                existing_str = str(existing_value).strip().lower()
                                if existing_str in ['true', '1', 'yes', 'y', 'existing']:
                                    is_planted = False
                                else:
                                    try:
                                        val = float(existing_value)
                                        is_planted = val == 0
                                    except (ValueError, TypeError):
                                        is_planted = False
                            else:
                                # Default to existing if neither is specified
                                is_planted = False
                            
                            # Handle boolean fields: HEALTHY/NOT HEALTHY
                            # Convert to string first to handle both numeric and string values
                            healthy_raw = row.get('healthy', '')
                            if pd.notna(healthy_raw) and healthy_raw != '':
                                healthy_value = str(healthy_raw).strip().lower()
                            else:
                                healthy_value = ''
                            
                            not_healthy_raw = row.get('not_healthy', '')
                            if pd.notna(not_healthy_raw) and not_healthy_raw != '':
                                not_healthy_value = str(not_healthy_raw).strip().lower()
                            else:
                                not_healthy_value = ''
                            
                            # Each row = 1 tree, so health counts are either 1 or 0
                            if healthy_value in ['true', '1', 'yes', 'y', 'healthy']:
                                is_healthy = True
                                health_status = 'excellent'
                                healthy_count = 1  # This row = 1 healthy tree
                                good_count = 0
                                bad_count = 0
                                deceased_count = 0
                            elif not_healthy_value in ['true', '1', 'yes', 'y', 'not healthy', 'not_healthy']:
                                is_healthy = False
                                health_status = 'poor'
                                healthy_count = 0
                                good_count = 0
                                bad_count = 1  # This row = 1 not healthy tree
                                deceased_count = 0
                            else:
                                # Default: assume healthy if neither is specified
                                is_healthy = True
                                health_status = 'good'
                                healthy_count = 1
                                good_count = 0
                                bad_count = 0
                                deceased_count = 0

                            # Optional physical measurements - handle HEIGHT and DIAMETER BREAST
                            height_meters = row.get('height') or row.get('height_meters')
                            if pd.notna(height_meters) and height_meters != '':
                                try:
                                    height_meters = float(height_meters)
                                except (ValueError, TypeError):
                                    height_meters = None
                            else:
                                height_meters = None

                            diameter_cm = row.get('diameter_cm') or row.get('diameter breast')
                            if pd.notna(diameter_cm) and diameter_cm != '':
                                try:
                                    diameter_cm = float(diameter_cm)
                                except (ValueError, TypeError):
                                    diameter_cm = None
                            else:
                                diameter_cm = None

                            # Get hectares from CSV (required). Accept both "hectares" and "hectars" headers.
                            hectares_value = row.get('hectares')
                            if hectares_value is None or pd.isna(hectares_value):
                                hectares_value = row.get('hectars')
                            if hectares_value is None or (isinstance(hectares_value, str) and not hectares_value.strip()) or pd.isna(hectares_value):
                                raise ValueError(f"Row {idx + 1}: hectares (hectars) is required")
                            try:
                                hectares = float(hectares_value)
                                if hectares < 0:
                                    raise ValueError(f"Row {idx + 1}: hectares must be non-negative")
                            except (ValueError, TypeError) as e:
                                if isinstance(e, ValueError) and "must be non-negative" in str(e):
                                    raise
                                raise ValueError(f"Row {idx + 1}: invalid hectares value: {hectares_value}")
                            
                            # Get year
                            year = int(row['year'])
                            
                            # Create individual tree record (each row = 1 tree)
                            # Duplicates with same species, location, and year are allowed
                            tree = EndemicTree(
                                species=species,
                                location=location,
                                year=year,
                                population=population,  # Always 1 for each row
                                health_status=health_status,
                                healthy_count=healthy_count,
                                good_count=good_count,
                                bad_count=bad_count,
                                deceased_count=deceased_count,
                                hectares=hectares,
                                height_meters=height_meters,
                                diameter_cm=diameter_cm,
                                is_healthy=is_healthy,
                                is_planted=is_planted,
                                notes=notes,
                                user=request.user
                            )
                            tree.save()
                            
                            # Track details for logging
                            species_name = row['common_name'] if 'common_name' in row else 'Unknown'
                            uploaded_species[species_name] = uploaded_species.get(species_name, 0) + 1
                            total_hectares += hectares
                            years_uploaded.add(year)
                            
                            success_count += 1
                            
                            # Update progress frequently
                            request.session['csv_upload_progress']['processed'] = success_count + error_count
                            request.session['csv_upload_progress']['status'] = 'processing'
                            # Save session every 5 rows for better responsiveness
                            if (success_count + error_count) % 5 == 0:
                                request.session.save()
                        except Exception as e:
                            error_count += 1
                            import traceback
                            error_msg = f"Error processing row {idx + 1}: {str(e)}"
                            print(error_msg)
                            traceback.print_exc()
                            
                            # Update progress even on error
                            request.session['csv_upload_progress']['processed'] = success_count + error_count
                            request.session['csv_upload_progress']['last_error'] = error_msg
                            if (success_count + error_count) % 10 == 0:
                                request.session.save()

                    # Mark upload as completed
                    request.session['csv_upload_progress'] = {
                        'status': 'completed', 
                        'success': success_count, 
                        'errors': error_count,
                        'total': total_rows,
                        'processed': success_count + error_count,
                    }
                    request.session.save()
                    
                    if success_count > 0:
                        # Get CSV file name for logging
                        csv_file_name = csv_file.name if csv_file else 'Unknown file'
                        
                        # Build detailed description using tracked data
                        details = []
                        details.append(f"File: {csv_file_name}")
                        details.append(f"Count: {success_count} tree(s)")
                        if uploaded_species:
                            species_list = ", ".join([f"{name} ({count})" for name, count in sorted(uploaded_species.items())[:10]])
                            if len(uploaded_species) > 10:
                                species_list += f" and {len(uploaded_species) - 10} more species"
                            details.append(f"Species: {species_list}")
                        if total_hectares > 0:
                            details.append(f"Total Hectares: {total_hectares:.2f}")
                        if years_uploaded:
                            years_str = ", ".join(sorted([str(y) for y in years_uploaded])[:10])
                            if len(years_uploaded) > 10:
                                years_str += f" and {len(years_uploaded) - 10} more years"
                            details.append(f"Years: {years_str}")
                        if error_count > 0:
                            details.append(f"Errors: {error_count}")
                        
                        description = " | ".join(details)
                        
                        # Log CSV upload activity
                        History.objects.create(
                            user=request.user,
                            action='csv_upload',
                            description=f'CSV Upload: {description}'
                        )
                        
                        messages.success(request, f'Successfully imported {success_count} tree records. {error_count} errors occurred.')
                        # Redirect to GIS page to see the newly added data
                        return redirect('app:gis')
                    else:
                        messages.error(request, f'No trees were imported. {error_count} errors occurred.')
                        return redirect('app:upload')
                except Exception as e:
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"CSV processing error: {error_trace}")
                    
                    # Mark progress as failed
                    request.session['csv_upload_progress'] = {
                        'status': 'failed',
                        'error': str(e)
                    }
                    request.session.save()
                    
                    messages.error(request, f'Error processing CSV file: {str(e)}')
                    return redirect('app:upload')

        elif 'submit_manual' in request.POST:
            try:
                # Get form data
                common_name = request.POST.get('common_name', '').strip()
                scientific_name = request.POST.get('scientific_name', '').strip()
                family_name = request.POST.get('family', '').strip()
                genus_name = request.POST.get('genus', '').strip()
                # Each manual entry represents one tree, so population is always 1
                population = 1

                # Validate all required fields (except Notes)
                missing_fields = []
                if not common_name:
                    missing_fields.append('Common Name')
                if not scientific_name:
                    missing_fields.append('Scientific Name')
                if not family_name:
                    missing_fields.append('Family')
                if not genus_name:
                    missing_fields.append('Genus')
                
                # Get tree health and type from radio buttons
                tree_health = request.POST.get('tree_health')
                tree_type = request.POST.get('tree_type')
                
                if not tree_health:
                    missing_fields.append('Tree Health Status')
                if not tree_type:
                    missing_fields.append('Tree Type (Planted/Existing)')
                
                # Validate numeric fields
                latitude_str = request.POST.get('latitude', '').strip()
                longitude_str = request.POST.get('longitude', '').strip()
                year_str = request.POST.get('year', '').strip()
                hectares_str = request.POST.get('hectares', '').strip()
                
                if not latitude_str:
                    missing_fields.append('Latitude')
                if not longitude_str:
                    missing_fields.append('Longitude')
                if not year_str:
                    missing_fields.append('Year')
                if not hectares_str:
                    missing_fields.append('Hectares')
                
                # If any required fields are missing, return error
                if missing_fields:
                    messages.error(request, f'Please fill in all required fields: {", ".join(missing_fields)}')
                    return redirect('app:upload')
                
                # Validate that common name exists in taxonomy (to ensure it was selected from dropdown)
                try:
                    # Check if the common name exists in the user's taxonomy
                    species_check = TreeSpecies.objects.filter(
                        user=request.user,
                        common_name__iexact=common_name
                    ).first()
                    if not species_check:
                        messages.error(request, f'Common Name "{common_name}" not found in taxonomy. Please select from the dropdown suggestions.')
                        return redirect('app:upload')
                except Exception as e:
                    messages.error(request, f'Error validating Common Name: {str(e)}')
                    return redirect('app:upload')

                # Convert to boolean values
                is_healthy = (tree_health == 'healthy')
                is_planted = (tree_type == 'planted')

                # Map tree health to health_status (for backward compatibility)
                # Since each entry is one tree, health counts are 1 or 0
                if tree_health == 'healthy':
                    health_status = 'excellent'
                    healthy_count = 1
                    good_count = 0
                    bad_count = 0
                    deceased_count = 0
                else:  # not_healthy
                    health_status = 'poor'
                    healthy_count = 0
                    good_count = 0
                    bad_count = 1
                    deceased_count = 0

                # Optional physical measurements
                height_meters_str = request.POST.get('height_meters', '').strip()
                diameter_cm_str = request.POST.get('diameter_cm', '').strip()
                height_meters = float(height_meters_str) if height_meters_str else None
                diameter_cm = float(diameter_cm_str) if diameter_cm_str else None

                # Validate and convert numeric fields
                try:
                    latitude = float(latitude_str)
                except (ValueError, TypeError):
                    messages.error(request, 'Invalid latitude value')
                    return redirect('app:upload')
                
                try:
                    longitude = float(longitude_str)
                except (ValueError, TypeError):
                    messages.error(request, 'Invalid longitude value')
                    return redirect('app:upload')
                
                try:
                    year = int(year_str)
                except (ValueError, TypeError):
                    messages.error(request, 'Invalid year value')
                    return redirect('app:upload')
                
                # Validate hectares
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

                # Get address from form if provided
                address = request.POST.get('address', '').strip()
                
                # Get or create location
                location, created = Location.objects.get_or_create(
                    latitude=latitude,
                    longitude=longitude,
                    user=request.user,
                    defaults={'name': f"{common_name} Location"}
                )
                
                # Save address if provided from form, otherwise geocode
                if address:
                    location.address = address
                    location.save(update_fields=['address'])
                else:
                    # Geocode location to get address if not provided
                    try:
                        geocode_location(location)
                    except Exception as e:
                        # Don't fail the entire operation if geocoding fails
                        print(f"Geocoding failed for location {location.id}: {str(e)}")
                
                # Image sharing logic:
                # Images are shared ONLY when trees have:
                # - Same location (latitude + longitude)
                # - Same common_name (via species)
                # - Same scientific_name (via species)
                # 
                # If same common_name + scientific_name but different location = different images
                # If same location but different species = different images
                
                # Check if there's an existing tree with same location AND species
                # Images are now stored at species level, so we check if species has an image
                existing_tree = EndemicTree.objects.filter(
                    species=species,  # Same common_name + scientific_name
                    location=location,  # Same location (latitude + longitude)
                    user=request.user
                ).first()
                
                # Handle image upload
                image_file = None
                if 'location_image' in request.FILES:
                    image_file = request.FILES['location_image']
                
                # Handle image upload - save to species level (shared by all trees with same common_name and scientific_name)
                if image_file:
                    # Check if species already has an image
                    if species.image:
                        messages.warning(request, f"Image already exists for {common_name} ({scientific_name}). The existing image will be used. To update the image, please edit the species in the admin panel.")
                    else:
                        # Read image as binary
                        image_file.seek(0)  # Reset file pointer
                        image_data = image_file.read()
                        
                        # Store binary data in species
                        species.image = image_data
                        
                        # Determine and store image format
                        content_type = image_file.content_type
                        if 'jpeg' in content_type or 'jpg' in content_type:
                            species.image_format = 'JPEG'
                        elif 'png' in content_type:
                            species.image_format = 'PNG'
                        
                        # Save species with image
                        species.save()
                        messages.success(request, f"Image uploaded successfully for {common_name} ({scientific_name}).")

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
                    height_meters=height_meters,
                    diameter_cm=diameter_cm,
                    is_healthy=is_healthy,
                    is_planted=is_planted,
                    notes=notes,
                    user=request.user
                )
                # Save tree
                tree.save()

                # Log manual entry activity
                History.objects.create(
                    user=request.user,
                    action='manual_entry',
                    description=f'Manual entry: Added {common_name} ({scientific_name}) at {address or f"Lat: {latitude}, Lng: {longitude}"}'
                )

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
                
                # Geocode location to get address
                try:
                    geocode_location(location)
                except Exception as e:
                    # Don't fail the entire operation if geocoding fails
                    print(f"Geocoding failed for location {location.id}: {str(e)}")
                
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
def history(request):
    """
    History page - displays activity logs for data uploads and deletions
    """
    # Get base queryset
    history_queryset = History.objects.filter(user=request.user).order_by('-created_at')
    
    # Calculate statistics before slicing
    total_count = history_queryset.count()
    csv_count = history_queryset.filter(action='csv_upload').count()
    manual_count = history_queryset.filter(action='manual_entry').count()
    edit_count = history_queryset.filter(action='edit_tree').count()
    delete_count = history_queryset.filter(action__in=['delete_tree', 'delete_trees_bulk', 'delete_all_trees']).count()
    
    # Get limited history logs for display (most recent 100)
    history_logs = history_queryset[:100]
    
    context = {
        'active_page': 'history',
        'history_logs': history_logs,
        'total_count': total_count,
        'csv_count': csv_count,
        'manual_count': manual_count,
        'edit_count': edit_count,
        'delete_count': delete_count,
    }
    return render(request, 'app/history.html', context)


@login_required(login_url='app:login')
def reports(request):
    """View for generating reports."""
    # Get all endemic trees with species information
    trees = EndemicTree.objects.filter(
        user=request.user,
        species__isnull=False
    ).select_related('species', 'location').order_by('species__common_name', 'year')
    
    # Get unique addresses from locations (no duplicates)
    unique_addresses = Location.objects.filter(
        user=request.user,
        address__isnull=False
    ).exclude(address='').values_list('address', flat=True).distinct().order_by('address')
    
    # Create tree list with common name, scientific name, and addresses
    # Show only unique species (prevent duplicates)
    # Collect all addresses where each species exists
    tree_list = []
    species_data = {}  # Track species data: {species_key: {id, common_name, scientific_name, addresses: set}}
    
    for tree in trees:
        if tree.species:
            species_key = (tree.species.common_name, tree.species.scientific_name)
            address = tree.location.address if tree.location and tree.location.address else ''
            
            if species_key not in species_data:
                # First time seeing this species
                species_data[species_key] = {
                    'id': str(tree.species.id),
                    'common_name': tree.species.common_name,
                    'scientific_name': tree.species.scientific_name,
                    'addresses': set()
                }
            
            # Add address to the set (will automatically handle duplicates)
            if address:
                species_data[species_key]['addresses'].add(address)
    
    # Convert to list format with comma-separated addresses
    for species_key, data in species_data.items():
        # Join all addresses with a special separator for JavaScript filtering
        addresses_str = '|'.join(sorted(data['addresses']))  # Use | as separator
        tree_list.append({
            'id': data['id'],
            'common_name': data['common_name'],
            'scientific_name': data['scientific_name'],
            'address': addresses_str,  # Store all addresses separated by |
        })

    return render(request, 'app/reports.html', {
        'active_page': 'reports',
        'tree_list': tree_list,
        'address_list': list(unique_addresses)
    })


@login_required(login_url='app:login')
def api_dashboard_data(request):
    """API endpoint to get comprehensive dashboard data with filters."""
    try:
        # Get filter parameters
        year_filter = request.GET.get('year', None)
        area_filter = request.GET.get('area', None)
        species_filter = request.GET.get('species_id', None)
        
        # Base query
        trees_query = EndemicTree.objects.filter(user=request.user).select_related('species', 'location', 'species__genus', 'species__genus__family')
        
        # Apply filters
        if year_filter and year_filter != 'all':
            try:
                trees_query = trees_query.filter(year=int(year_filter))
            except (ValueError, TypeError):
                pass
        
        if species_filter and species_filter != 'all':
            try:
                trees_query = trees_query.filter(species_id=int(species_filter))
            except (ValueError, TypeError):
                pass
        
        # Get all trees
        trees = trees_query.exclude(location__address__isnull=True).exclude(location__address='')
        
        # Helper function to parse administrative area from address
        def parse_administrative_area(address):
            """Parse address to extract administrative area (City/Municipality, Province)"""
            if not address:
                return None
            parts = [p.strip() for p in address.split(',')]
            if len(parts) >= 2:
                return f"{parts[-2]}, {parts[-1]}"
            elif len(parts) == 1:
                return parts[0]
            return None
        
        # Aggregate by administrative area
        area_data = {}
        all_heights = []
        all_diameters = []
        all_health_statuses = []
        species_distribution = {}
        
        total_trees = 0
        total_hectares = 0
        total_healthy = 0
        total_not_healthy = 0
        total_planted = 0
        total_existing = 0
        
        for tree in trees:
            if not tree.location or not tree.location.address:
                continue
                
            area = parse_administrative_area(tree.location.address)
            if area_filter and area_filter != 'all' and area != area_filter:
                continue
            
            if not area:
                continue
            
            # Update totals
            total_trees += tree.population
            total_hectares += tree.hectares or 0
            total_healthy += tree.healthy_count or 0
            total_not_healthy += tree.bad_count or 0
            if tree.is_planted:
                total_planted += tree.population
            else:
                total_existing += tree.population
            
            # Aggregate by area
            if area not in area_data:
                area_data[area] = {
                    'area': area,
                    'total_trees': 0,
                    'total_hectares': 0,
                    'healthy_count': 0,
                    'not_healthy_count': 0,
                    'heights': [],
                    'diameters': [],
                    'health_statuses': []
                }
            
            area_data[area]['total_trees'] += tree.population
            area_data[area]['total_hectares'] += tree.hectares or 0
            area_data[area]['healthy_count'] += tree.healthy_count or 0
            area_data[area]['not_healthy_count'] += tree.bad_count or 0
            
            # Collect height and diameter data
            if tree.height_meters:
                for _ in range(tree.population):
                    area_data[area]['heights'].append(float(tree.height_meters))
                    all_heights.append(float(tree.height_meters))
            
            if tree.diameter_cm:
                for _ in range(tree.population):
                    area_data[area]['diameters'].append(float(tree.diameter_cm))
                    all_diameters.append(float(tree.diameter_cm))
            
            # Collect health status data for scatter plot
            if tree.height_meters and tree.diameter_cm:
                health_status = 'healthy' if tree.is_healthy else 'not_healthy'
                for _ in range(tree.population):
                    area_data[area]['health_statuses'].append({
                        'height': float(tree.height_meters),
                        'diameter': float(tree.diameter_cm),
                        'health': health_status
                    })
                    all_health_statuses.append({
                        'height': float(tree.height_meters),
                        'diameter': float(tree.diameter_cm),
                        'health': health_status
                    })
            
            # Species distribution
            species_key = tree.species.common_name
            if species_key not in species_distribution:
                species_distribution[species_key] = {
                    'name': species_key,
                    'scientific_name': tree.species.scientific_name,
                    'count': 0
                }
            species_distribution[species_key]['count'] += tree.population
        
        # Calculate metrics
        avg_trees_per_hectare = total_trees / total_hectares if total_hectares > 0 else 0
        health_ratio = total_healthy / (total_healthy + total_not_healthy) if (total_healthy + total_not_healthy) > 0 else 0
        
        # Process area data
        area_list = []
        for area, data in area_data.items():
            trees_per_hectare = data['total_trees'] / data['total_hectares'] if data['total_hectares'] > 0 else 0
            total_health = data['healthy_count'] + data['not_healthy_count']
            area_health_ratio = data['healthy_count'] / total_health if total_health > 0 else 0
            
            area_list.append({
                'area': area,
                'total_trees': data['total_trees'],
                'total_hectares': round(data['total_hectares'], 2),
                'trees_per_hectare': round(trees_per_hectare, 2),
                'healthy_count': data['healthy_count'],
                'not_healthy_count': data['not_healthy_count'],
                'health_ratio': round(area_health_ratio, 3),
                'heights': data['heights'],
                'diameters': data['diameters'],
                'health_statuses': data['health_statuses']
            })
        
        # Sort areas by trees per hectare (for ranked chart)
        area_list.sort(key=lambda x: x['trees_per_hectare'], reverse=True)
        
        # Identify critical areas (low density or poor health)
        critical_areas = []
        if area_list:
            # Calculate thresholds
            all_densities = [a['trees_per_hectare'] for a in area_list]
            all_health_ratios = [a['health_ratio'] for a in area_list]
            
            density_threshold = sum(all_densities) / len(all_densities) * 0.5 if all_densities else 0  # Below 50% of average
            health_threshold = 0.5  # Below 50% health ratio
            
            for area in area_list:
                is_critical = False
                issues = []
                
                if area['trees_per_hectare'] < density_threshold:
                    is_critical = True
                    issues.append('low_density')
                
                if area['health_ratio'] < health_threshold:
                    is_critical = True
                    issues.append('poor_health')
                
                if is_critical:
                    critical_areas.append({
                        'area': area['area'],
                        'trees_per_hectare': area['trees_per_hectare'],
                        'health_ratio': area['health_ratio'],
                        'total_trees': area['total_trees'],
                        'issues': issues
                    })
        
        # Sort species distribution
        species_list = sorted(species_distribution.values(), key=lambda x: x['count'], reverse=True)
        
        return JsonResponse({
            'success': True,
            'kpis': {
                'total_trees': total_trees,
                'avg_trees_per_hectare': round(avg_trees_per_hectare, 2),
                'total_healthy': total_healthy,
                'total_not_healthy': total_not_healthy,
                'health_ratio': round(health_ratio, 3),
                'total_planted': total_planted,
                'total_existing': total_existing
            },
            'area_data': area_list,
            'critical_areas': critical_areas,
            'species_distribution': species_list,
            'all_heights': all_heights,
            'all_diameters': all_diameters,
            'all_health_statuses': all_health_statuses
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
def api_analytics_by_area(request):
    """API endpoint to get analytics data aggregated by administrative area."""
    try:
        species_id = request.GET.get('species_id', None)
        
        # Base query
        trees_query = EndemicTree.objects.filter(user=request.user).select_related('location', 'species')
        
        # Filter by species if provided
        if species_id and species_id != 'all':
            try:
                species_id_int = int(species_id)
                trees_query = trees_query.filter(species_id=species_id_int)
            except (ValueError, TypeError):
                pass
        
        # Get all trees with addresses
        trees = trees_query.exclude(location__address__isnull=True).exclude(location__address='')
        
        # Helper function to parse administrative area from address
        def parse_administrative_area(address):
            """Parse address to extract administrative area (City/Municipality, Province)"""
            if not address:
                return None
            # Address format: "Barangay, City or Municipality, Province"
            parts = [p.strip() for p in address.split(',')]
            if len(parts) >= 2:
                # Return City/Municipality, Province
                return f"{parts[-2]}, {parts[-1]}"
            elif len(parts) == 1:
                return parts[0]
            return None
        
        # Aggregate by administrative area
        area_data = {}
        
        for tree in trees:
            if not tree.location or not tree.location.address:
                continue
                
            area = parse_administrative_area(tree.location.address)
            if not area:
                continue
            
            if area not in area_data:
                area_data[area] = {
                    'area': area,
                    'total_trees': 0,
                    'total_hectares': 0,
                    'healthy_count': 0,
                    'not_healthy_count': 0,
                    'heights': [],
                    'diameters': [],
                    'health_statuses': []
                }
            
            area_data[area]['total_trees'] += tree.population
            area_data[area]['total_hectares'] += tree.hectares or 0
            area_data[area]['healthy_count'] += tree.healthy_count or 0
            area_data[area]['not_healthy_count'] += tree.bad_count or 0
            
            # Collect height and diameter data for histograms
            if tree.height_meters:
                # Add multiple entries based on population
                for _ in range(tree.population):
                    area_data[area]['heights'].append(float(tree.height_meters))
            
            if tree.diameter_cm:
                # Add multiple entries based on population
                for _ in range(tree.population):
                    area_data[area]['diameters'].append(float(tree.diameter_cm))
            
            # Collect health status data for scatter plot
            if tree.height_meters and tree.diameter_cm:
                health_status = 'healthy' if tree.is_healthy else 'not_healthy'
                for _ in range(tree.population):
                    area_data[area]['health_statuses'].append({
                        'height': float(tree.height_meters),
                        'diameter': float(tree.diameter_cm),
                        'health': health_status
                    })
        
        # Calculate metrics for each area
        result = []
        for area, data in area_data.items():
            trees_per_hectare = data['total_trees'] / data['total_hectares'] if data['total_hectares'] > 0 else 0
            total_health = data['healthy_count'] + data['not_healthy_count']
            health_ratio = data['healthy_count'] / total_health if total_health > 0 else 0
            
            result.append({
                'area': area,
                'total_trees': data['total_trees'],
                'total_hectares': round(data['total_hectares'], 2),
                'trees_per_hectare': round(trees_per_hectare, 2),
                'healthy_count': data['healthy_count'],
                'not_healthy_count': data['not_healthy_count'],
                'health_ratio': round(health_ratio, 3),
                'heights': data['heights'],
                'diameters': data['diameters'],
                'health_statuses': data['health_statuses']
            })
        
        # Sort by trees per hectare (descending) for ranked chart
        result.sort(key=lambda x: x['trees_per_hectare'], reverse=True)
        
        return JsonResponse({
            'success': True,
            'data': result
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


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


def api_endemic_trees_list(request):
    """API endpoint to get endemic trees data for auto-population from database."""
    try:
        # Get taxonomy from database (TreeSpecies)
        trees_data = []
        if request.user.is_authenticated:
            species_list = TreeSpecies.objects.filter(user=request.user).select_related('genus', 'genus__family').all()
            for species in species_list:
                trees_data.append({
                    'common_name': species.common_name,
                    'scientific_name': species.scientific_name,
                    'family': species.genus.family.name if species.genus and species.genus.family else '',
                    'genus': species.genus.name if species.genus else ''
                })
        
        # Fallback to hardcoded data if no database entries
        if not trees_data:
            trees_data = [
            {'common_name': 'Yakal', 'scientific_name': 'Shorea astylosa', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'Red Lauan', 'scientific_name': 'Shorea negrosensis', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'White Lauan', 'scientific_name': 'Shorea contorta', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'Tanguile', 'scientific_name': 'Shorea polysperma', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'Almon', 'scientific_name': 'Shorea almon', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'Mayapis', 'scientific_name': 'Shorea palosapis', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'Palosapis', 'scientific_name': 'Anisoptera thurifera', 'family': 'Dipterocarpaceae', 'genus': 'Anisoptera'},
            {'common_name': 'Bagtikan', 'scientific_name': 'Parashorea malaanonan', 'family': 'Dipterocarpaceae', 'genus': 'Parashorea'},
            {'common_name': 'Guijo', 'scientific_name': 'Shorea guiso', 'family': 'Dipterocarpaceae', 'genus': 'Shorea'},
            {'common_name': 'Manggachapui', 'scientific_name': 'Hopea acuminata', 'family': 'Dipterocarpaceae', 'genus': 'Hopea'},
            {'common_name': 'Philippine Teak', 'scientific_name': 'Tectona philippinensis', 'family': 'Lamiaceae', 'genus': 'Tectona'},
            {'common_name': 'Kamagong', 'scientific_name': 'Diospyros blancoi', 'family': 'Ebenaceae', 'genus': 'Diospyros'},
            {'common_name': 'Bolong Eta', 'scientific_name': 'Diospyros pilosanthera', 'family': 'Ebenaceae', 'genus': 'Diospyros'},
            {'common_name': 'Philippine Ironwood', 'scientific_name': 'Xanthostemon verdugonianus', 'family': 'Myrtaceae', 'genus': 'Xanthostemon'},
            {'common_name': 'Banuyo', 'scientific_name': 'Wallaceodendron celebicum', 'family': 'Fabaceae', 'genus': 'Wallaceodendron'},
            {'common_name': 'Katmon', 'scientific_name': 'Dillenia philippinensis', 'family': 'Dilleniaceae', 'genus': 'Dillenia'},
            {'common_name': 'Malabayabas', 'scientific_name': 'Tristaniopsis decorticata', 'family': 'Myrtaceae', 'genus': 'Tristaniopsis'},
            {'common_name': 'Tindalo', 'scientific_name': 'Afzelia rhomboidea', 'family': 'Fabaceae', 'genus': 'Afzelia'},
            {'common_name': 'Kalantas', 'scientific_name': 'Toona calantas', 'family': 'Meliaceae', 'genus': 'Toona'},
            {'common_name': 'Nato', 'scientific_name': 'Palaquium philippense', 'family': 'Sapotaceae', 'genus': 'Palaquium'},
            {'common_name': 'Malasantol', 'scientific_name': 'Sandoricum vidalii', 'family': 'Meliaceae', 'genus': 'Sandoricum'},
            {'common_name': 'Ipil', 'scientific_name': 'Intsia bijuga', 'family': 'Fabaceae', 'genus': 'Intsia'},
            {'common_name': 'Batulinau', 'scientific_name': 'Diospyros ferrea', 'family': 'Ebenaceae', 'genus': 'Diospyros'},
            {'common_name': 'Apitong', 'scientific_name': 'Dipterocarpus grandiflorus', 'family': 'Dipterocarpaceae', 'genus': 'Dipterocarpus'},
            {'common_name': 'Panau', 'scientific_name': 'Dipterocarpus gracilis', 'family': 'Dipterocarpaceae', 'genus': 'Dipterocarpus'},
            {'common_name': 'Malapapaya', 'scientific_name': 'Polyscias nodosa', 'family': 'Araliaceae', 'genus': 'Polyscias'},
            {'common_name': 'Banaba', 'scientific_name': 'Lagerstroemia speciosa', 'family': 'Lythraceae', 'genus': 'Lagerstroemia'},
            {'common_name': 'Almaciga', 'scientific_name': 'Agathis philippinensis', 'family': 'Araucariaceae', 'genus': 'Agathis'},
            {'common_name': 'Udling', 'scientific_name': 'Astronia cumingiana', 'family': 'Melastomataceae', 'genus': 'Astronia'},
            {'common_name': 'Bakan', 'scientific_name': 'Litsea philippinensis', 'family': 'Lauraceae', 'genus': 'Litsea'},
            {'common_name': 'Celtis', 'scientific_name': 'Celtis philippensis', 'family': 'Cannabaceae', 'genus': 'Celtis'},
            {'common_name': 'Balete', 'scientific_name': 'Ficus benjamina', 'family': 'Moraceae', 'genus': 'Ficus'},
            {'common_name': 'Bitanghol', 'scientific_name': 'Calophyllum blancoi', 'family': 'Clusiaceae', 'genus': 'Calophyllum'},
            {'common_name': 'Kalingag', 'scientific_name': 'Cinnamomum mercadoi', 'family': 'Lauraceae', 'genus': 'Cinnamomum'},
            {'common_name': 'Bitaog', 'scientific_name': 'Calophyllum inophyllum', 'family': 'Clusiaceae', 'genus': 'Calophyllum'},
            {'common_name': 'Clethra sp', 'scientific_name': 'Clethra sp.', 'family': 'Clethraceae', 'genus': 'Clethra L.'},
        ]
        
        print(f"[API] Loaded {len(trees_data)} trees for autocomplete")
        response = JsonResponse({
            'success': True,
            'trees': trees_data
        })
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        # Allow CORS for local development
        response['Access-Control-Allow-Origin'] = '*'
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[API] Error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
def api_locations_list(request):
    """API endpoint to get current list of locations for dropdown updates."""
    try:
        # Force fresh query from database - no caching (only user's locations)
        location_list = Location.objects.filter(user=request.user).order_by('name')
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
@require_http_methods(["GET"])
def api_geocode(request):
    """API endpoint to geocode latitude/longitude to address using Nominatim."""
    try:
        latitude = request.GET.get('lat')
        longitude = request.GET.get('lon')
        
        if not latitude or not longitude:
            return JsonResponse({
                'success': False,
                'error': 'Latitude and longitude are required'
            }, status=400)
        
        try:
            lat = float(latitude)
            lon = float(longitude)
        except ValueError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid latitude or longitude format'
            }, status=400)
        
        # Call geocoding utility
        address = get_address_from_coordinates(lat, lon)
        
        if address:
            return JsonResponse({
                'success': True,
                'address': address
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Could not geocode coordinates'
            }, status=404)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@csrf_protect
def api_csv_upload_progress(request):
    """API endpoint to check CSV upload progress and handle cancellation."""
    try:
        if request.method == 'POST':
            # Handle cancel request
            import json
            try:
                data = json.loads(request.body)
                if data.get('cancel'):
                    request.session['csv_upload_cancelled'] = True
                    request.session.save()
                    return JsonResponse({
                        'success': True,
                        'message': 'Upload cancellation requested'
                    })
            except json.JSONDecodeError:
                pass
        
        # Check for cancellation flag
        if request.session.get('csv_upload_cancelled'):
            request.session['csv_upload_cancelled'] = False  # Reset flag
            request.session.save()
            return JsonResponse({
                'success': True,
                'progress': {'status': 'cancelled'}
            })
        
        progress = request.session.get('csv_upload_progress', {})
        return JsonResponse({
            'success': True,
            'progress': progress
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@login_required(login_url='app:login')
@csrf_protect
def generate_report(request):
    """View for generating reports based on form data."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)

    try:
        # Get selected trees and address
        selected_trees = request.POST.getlist('selected_trees')
        # Handle both dropdown (single value) and checkbox (multiple values) formats
        selected_address = request.POST.get('selected_address', '')
        selected_addresses = request.POST.getlist('selected_addresses')
        
        # If dropdown is used, convert single value to list
        # Treat "all" the same as empty string (include all addresses)
        if selected_address and selected_address != 'all':
            selected_addresses = [selected_address]
        # If "all" is selected or no address selected, allow all addresses (empty list means no filter)
        
        if not selected_trees:
            return JsonResponse({'success': False, 'error': 'Please select at least one tree.'}, status=400)
        
        # Address is optional - if empty, show all addresses

        # Get the current date and time in local timezone
        from django.utils.timezone import localtime
        now = localtime(timezone.now())
        date_str = now.strftime('%B %d, %Y')
        time_str = now.strftime('%I:%M %p')

        report_title = 'Endemic Trees Report'
        
        # Initialize address list variable
        all_addresses_in_report = []

        # Get actual data statistics based on selected trees and addresses
        try:
            # Convert selected species IDs to get all trees for those species
            # TreeSpecies uses integer IDs (BigAutoField), not UUIDs
            species_ids = []
            for species_id in selected_trees:
                try:
                    # Try to convert string to integer (species IDs are integers)
                    species_ids.append(int(species_id))
                except (ValueError, TypeError):
                    # If conversion fails, skip this ID and log error
                    import traceback
                    traceback.print_exc()
                    continue
            
            if not species_ids:
                return JsonResponse({'success': False, 'error': 'Invalid tree selection. No valid species IDs found.'}, status=400)
            
            # Filter trees by selected species IDs (get all trees for selected species)
            trees_query = EndemicTree.objects.filter(
                user=request.user,
                species__id__in=species_ids
            ).select_related('species', 'location')
            
            # Filter by selected address if provided
            if selected_addresses:
                trees_query = trees_query.filter(
                    location__address__in=selected_addresses
                )
            
            # Calculate actual statistics with error handling
            total_trees = trees_query.count()
            total_population = trees_query.aggregate(total=Sum('population'))['total'] or 0
            
            # Get unique counts safely
            try:
                unique_species = trees_query.exclude(species__isnull=True).values('species').distinct().count()
            except:
                unique_species = 0
            
            try:
                unique_locations = trees_query.exclude(location__isnull=True).values('location').distinct().count()
            except:
                unique_locations = 0
            
            # Get all unique addresses from the filtered trees for display
            all_addresses_in_report = []
            try:
                if selected_addresses:
                    # If specific addresses selected, use those
                    all_addresses_in_report = list(selected_addresses)
                else:
                    # If "All address" selected, get all unique addresses from filtered trees
                    all_addresses_in_report = list(
                        trees_query.exclude(location__isnull=True)
                        .exclude(location__address__isnull=True)
                        .exclude(location__address='')
                        .values_list('location__address', flat=True)
                        .distinct()
                        .order_by('location__address')
                    )
            except Exception as e:
                import traceback
                traceback.print_exc()
                all_addresses_in_report = []
            
            # Health status distribution
            try:
                health_distribution = list(trees_query.exclude(health_status__isnull=True).values('health_status').annotate(
                    count=Count('id'),
                    population=Sum('population')
                ).order_by('health_status'))
            except:
                health_distribution = []
            
            # Species distribution
            try:
                species_dist = list(trees_query.exclude(species__isnull=True).values('species__common_name', 'species__scientific_name').annotate(
                    count=Count('id'),
                    total_population=Sum('population')
                ).order_by('-total_population')[:10])
            except:
                species_dist = []
            
            # Year distribution
            try:
                year_dist = list(trees_query.exclude(year__isnull=True).values('year').annotate(
                    count=Count('id'),
                    population=Sum('population')
                ).order_by('year'))
            except:
                year_dist = []
        except Exception as e:
            # If statistics fail, use defaults
            import traceback
            traceback.print_exc()
            total_trees = 0
            total_population = 0
            unique_species = 0
            unique_locations = 0
            health_distribution = []
            species_dist = []
            year_dist = []
            all_addresses_in_report = []

        # Build the report HTML - only show the table
        html = f'''
        <div class="report-document">
            <div class="report-header">
                <h1 class="report-title">{report_title}</h1>
                <p class="report-subtitle">Endemic Trees Monitoring System - User Account Report</p>
                <p class="report-date">Generated on {date_str} at {time_str}</p>
            </div>
        '''


        # Add data table - grouped by species with calculations
        # Query the database for tree data based on selected trees and addresses
        trees = trees_query.select_related('species', 'location', 'species__genus', 'species__genus__family')
        
        # Group trees by species and calculate aggregates
        from collections import defaultdict
        species_data = defaultdict(lambda: {
            'common_name': '',
            'scientific_name': '',
            'planted': 0,
            'existing': 0,
            'healthy_count': 0,
            'not_healthy_count': 0,
            'total_population': 0,
            'total_height': 0,
            'height_count': 0,
            'total_diameter': 0,
            'diameter_count': 0
        })
        
        for tree in trees:
            try:
                if not tree.species:
                    continue
                    
                species_id = tree.species.id
                species_data[species_id]['common_name'] = tree.species.common_name or 'Unknown'
                species_data[species_id]['scientific_name'] = tree.species.scientific_name or 'Unknown'
                
                population = tree.population or 0
                species_data[species_id]['total_population'] += population
                
                # Calculate Planted and Existing
                if tree.is_planted:
                    species_data[species_id]['planted'] += population
                else:
                    species_data[species_id]['existing'] += population
                
                # Calculate healthy and not healthy counts
                # Using healthy_count field if available, otherwise use is_healthy boolean
                if hasattr(tree, 'healthy_count') and tree.healthy_count is not None:
                    # Count healthy trees (excellent/very_good)
                    species_data[species_id]['healthy_count'] += tree.healthy_count or 0
                else:
                    # Fallback to is_healthy boolean
                    if tree.is_healthy:
                        species_data[species_id]['healthy_count'] += population
                
                # Calculate height and diameter averages
                if tree.height_meters is not None:
                    height_value = float(tree.height_meters)
                    species_data[species_id]['total_height'] += height_value * population
                    species_data[species_id]['height_count'] += population
                
                if tree.diameter_cm is not None:
                    diameter_value = float(tree.diameter_cm)
                    species_data[species_id]['total_diameter'] += diameter_value * population
                    species_data[species_id]['diameter_count'] += population
                
                # Not healthy count will be calculated as: total - healthy_count
                        
            except Exception as e:
                import traceback
                traceback.print_exc()
                continue
        
        # Get address display text - show all addresses separated by "/"
        address_display = "Not specified"
        if all_addresses_in_report:
            if len(all_addresses_in_report) == 1:
                address_display = all_addresses_in_report[0]
            else:
                # Display all addresses separated by "/"
                address_display = " / ".join(all_addresses_in_report)
        elif selected_addresses:
            address_display = selected_addresses[0] if len(selected_addresses) == 1 else " / ".join(selected_addresses)
        else:
            address_display = "No addresses found"
        
        # Generate table HTML
        html += f'''
        <div class="report-section">
            <div style="margin-bottom: 1rem; padding: 0.75rem; background: #f8f9fa; border-radius: 4px;">
                <strong>Address:</strong> {address_display}
            </div>
            <div class="report-table-container">
                <table class="report-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: left;">Species</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">Total No. Tree</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">Planted</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">Existing</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">Avg Height (m)</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">Avg Diameter (cm)</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">No. of Healthy Tree</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">No. of Not Healthy Tree</th>
                        </tr>
                    </thead>
                    <tbody>
        '''
        
        # Add table rows with calculations
        if species_data:
            for species_id, data in sorted(species_data.items(), key=lambda x: x[1]['common_name']):
                try:
                    common_name = data['common_name']
                    scientific_name = data['scientific_name']
                    planted = data['planted']
                    existing = data['existing']
                    total = planted + existing
                    healthy_count = data['healthy_count']
                    # Not healthy count = total - healthy count (includes good + bad + deceased)
                    not_healthy_count = total - healthy_count
                    
                    # Calculate percentages
                    # Percentage of healthy tree = (no. of healthy trees) / (total) * 100
                    healthy_percentage = (healthy_count / total * 100) if total > 0 else 0
                    # Percentage of not healthy tree = 100% - healthy percentage
                    not_healthy_percentage = 100 - healthy_percentage
                    
                    # Calculate average height and diameter
                    avg_height = (data['total_height'] / data['height_count']) if data['height_count'] > 0 else None
                    avg_diameter = (data['total_diameter'] / data['diameter_count']) if data['diameter_count'] > 0 else None
                    
                    height_display = f"{avg_height:.2f}" if avg_height is not None else "N/A"
                    diameter_display = f"{avg_diameter:.2f}" if avg_diameter is not None else "N/A"
                    
                    html += f'''
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">
                                {common_name} <span style="font-size: 0.85em; font-style: italic; color: #666;">{scientific_name}</span>
                            </td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">{total:,}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">{planted:,}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">{existing:,}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">{height_display}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">{diameter_display}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">
                                {healthy_count:,} ({healthy_percentage:.2f}%)
                            </td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6; text-align: right;">
                                {not_healthy_count:,} ({not_healthy_percentage:.2f}%)
                            </td>
                        </tr>
                    '''
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    continue
        else:
            html += '''
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">No tree data available for the selected trees and addresses.</td>
                </tr>
            '''
        
        html += '''
                    </tbody>
                </table>
            </div>
        </div>
        </div>
        '''

        try:
            return JsonResponse({
                'reportContent': html,
                'success': True
            })
        except Exception as json_error:
            # If JSON encoding fails, try to return a simpler error
            import traceback
            error_trace = traceback.format_exc()
            print(f"Error encoding JSON response: {error_trace}")
            print(f"HTML length: {len(html)}")
            return JsonResponse({
                'error': f'Error encoding report: {str(json_error)}. Report HTML length: {len(html)} characters.',
                'success': False
            }, status=500)

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error generating report: {error_trace}")
        # Return more detailed error in development, generic message in production
        error_message = str(e)
        if hasattr(request, 'user') and request.user.is_superuser:
            error_message = f"{str(e)}\n\nTraceback:\n{error_trace}"
        return JsonResponse({
            'error': error_message,
            'success': False
        }, status=500)


# API Views
@login_required(login_url='app:login')
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
                    'family': tree.species.genus.family.name if tree.species.genus and tree.species.genus.family else '',
                    'genus': tree.species.genus.name if tree.species.genus else '',
                    'population': tree.population,
                    'health_status': tree.health_status,
                    'year': tree.year,
                    'location': tree.location.name,
                    'address': tree.location.address or '',
                    'notes': tree.notes or '',
                    # Use actual stored health distribution
                    'healthy_count': tree.healthy_count,
                    'good_count': tree.good_count,
                    'bad_count': tree.bad_count,
                    'deceased_count': tree.deceased_count,
                    'is_healthy': tree.is_healthy,
                    'is_planted': tree.is_planted,
                    'hectares': tree.hectares,
                    'height_meters': tree.height_meters,
                    'diameter_cm': tree.diameter_cm,
                    # Include species image URL if available (shared by all trees with same common_name and scientific_name)
                    'image_url': request.build_absolute_uri(reverse('app:species_image', args=[tree.species.id])) if tree.species.image else None,
                    'data_source': 'app',  # Mark as app data
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


@login_required(login_url='app:login')
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


@login_required(login_url='app:login')
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
                    'family': tree.species.genus.family.name if tree.species.genus and tree.species.genus.family else '',
                    'genus': tree.species.genus.name if tree.species.genus else '',
                    'population': tree.population,
                    'health_status': tree.health_status,
                    'year': tree.year,
                    'location': tree.location.name,
                    'address': tree.location.address or '',
                    'notes': tree.notes or '',
                    # Use actual stored health distribution
                    'healthy_count': tree.healthy_count,
                    'good_count': tree.good_count,
                    'bad_count': tree.bad_count,
                    'deceased_count': tree.deceased_count,
                    'is_healthy': tree.is_healthy,
                    'is_planted': tree.is_planted,
                    'hectares': tree.hectares,
                    'height_meters': tree.height_meters,
                    'diameter_cm': tree.diameter_cm,
                    # Include species image URL if available (shared by all trees with same common_name and scientific_name)
                    'image_url': request.build_absolute_uri(reverse('app:species_image', args=[tree.species.id])) if tree.species.image else None,
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


@login_required(login_url='app:login')
def api_population_by_year(request):
    """
    API endpoint for population by year with filters
    """
    try:
        # Get filter parameters
        species_filter = request.GET.get('species', 'all')
        status_filter = request.GET.get('status', 'all')  # planted, existing, all
        health_filter = request.GET.get('health', 'all')  # healthy, not_healthy, all
        
        # Base queryset
        trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location')
        
        # Apply filters
        if species_filter != 'all':
            trees = trees.filter(species__common_name=species_filter)
        
        if status_filter == 'planted':
            trees = trees.filter(is_planted=True)
        elif status_filter == 'existing':
            trees = trees.filter(is_planted=False)
        
        if health_filter == 'healthy':
            trees = trees.filter(is_healthy=True)
        elif health_filter == 'not_healthy':
            trees = trees.filter(is_healthy=False)
        
        # Group by year and sum population
        from django.db.models import Sum
        population_by_year = list(trees.values('year').annotate(
            total_population=Sum('population')
        ).order_by('year'))
        
        # Format data for chart
        years = [item['year'] for item in population_by_year]
        populations = [item['total_population'] for item in population_by_year]
        
        return JsonResponse({
            'success': True,
            'years': years,
            'populations': populations
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


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
                common_name = request.POST.get('common_name', '').strip()
                species_id = request.POST.get('species_id', '').strip()
                
                # Find species by common name or use species_id
                if species_id:
                    try:
                        species = TreeSpecies.objects.get(id=species_id, user=request.user)
                    except TreeSpecies.DoesNotExist:
                        return JsonResponse({
                            'success': False,
                            'error': 'Species not found'
                        }, status=400)
                elif common_name:
                    species = TreeSpecies.objects.filter(common_name=common_name, user=request.user).first()
                    if not species:
                        return JsonResponse({
                            'success': False,
                            'error': f'Species with common name "{common_name}" not found'
                        }, status=400)
                else:
                    return JsonResponse({
                        'success': False,
                        'error': 'Common name or species ID is required'
                    }, status=400)
                
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
                latitude = float(request.POST.get('latitude'))
                longitude = float(request.POST.get('longitude'))
                
                # Get additional fields
                is_healthy_str = request.POST.get('is_healthy', 'true')
                is_healthy = is_healthy_str.lower() == 'true'
                is_planted_str = request.POST.get('is_planted', 'false')
                is_planted = is_planted_str.lower() == 'true'
                
                height_str = request.POST.get('height', '').strip()
                height_meters = float(height_str) if height_str else None
                
                diameter_str = request.POST.get('diameter_breast', '').strip()
                diameter_cm = float(diameter_str) if diameter_str else None
                
                address = request.POST.get('address', '').strip()

                # Validate data
                if not all([year, latitude, longitude]):
                    return JsonResponse({
                        'success': False,
                        'error': 'All required fields must be provided'
                    }, status=400)

                # Update tree record
                tree.species = species
                tree.hectares = hectares
                tree.year = year
                tree.is_healthy = is_healthy
                tree.is_planted = is_planted
                tree.height_meters = height_meters
                tree.diameter_cm = diameter_cm

                # Update location
                if not tree.location:
                    from .models import Location
                    tree.location = Location.objects.create(
                        latitude=latitude,
                        longitude=longitude,
                        user=request.user
                    )
                    # Geocode new location
                    try:
                        geocode_location(tree.location)
                    except Exception as e:
                        print(f"Geocoding failed for location {tree.location.id}: {str(e)}")
                else:
                    # Update coordinates and geocode if they changed
                    coords_changed = (tree.location.latitude != latitude or tree.location.longitude != longitude)
                    tree.location.latitude = latitude
                    tree.location.longitude = longitude
                    
                    # Update address if provided, otherwise geocode
                    if address:
                        tree.location.address = address
                    elif coords_changed:
                        # Clear address and geocode again
                        tree.location.address = None
                    
                    tree.location.save()
                    if coords_changed and not address:
                        try:
                            geocode_location(tree.location)
                        except Exception as e:
                            print(f"Geocoding failed for location {tree.location.id}: {str(e)}")

                # Get tree info before saving for logging
                tree_info = f"{species.common_name if species else 'Unknown'} at {address or f'Lat: {latitude}, Lng: {longitude}'}"
                
                tree.save()

                # Log edit activity
                History.objects.create(
                    user=request.user,
                    action='edit_tree',
                    description=f'Edited tree: {tree_info}'
                )

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
                'common_name': tree.species.common_name,
                'scientific_name': tree.species.scientific_name,
                'family': tree.species.genus.family.name if tree.species.genus and tree.species.genus.family else '',
                'genus': tree.species.genus.name if tree.species.genus else '',
                'population': tree.population,
                'hectares': tree.hectares,
                'year': tree.year,
                'health_status': tree.health_status,
                'is_healthy': tree.is_healthy,
                'is_planted': tree.is_planted,
                'height_meters': tree.height_meters,
                'diameter_cm': tree.diameter_cm,
                'latitude': tree.location.latitude,
                'longitude': tree.location.longitude,
                'address': tree.location.address or '',
                'notes': tree.notes or '',
                'image_url': request.build_absolute_uri(reverse('app:species_image', args=[tree.species.id])) if tree.species.image else None
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
    
    NOTE: This function is NOT automatically called when trees/seeds are deleted.
    Taxonomy entries should remain in the database for autocomplete suggestions
    and future use. They can only be deleted explicitly from the Manage Taxonomy page.
    
    This function is kept for potential manual cleanup operations if needed.
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
        
        # Get detailed tree info before deletion for logging
        species_name = tree.species.common_name if tree.species else 'Unknown'
        scientific_name = tree.species.scientific_name if tree.species else 'Unknown'
        location_info = location.address if location and location.address else f'Lat: {location.latitude}, Lng: {location.longitude}' if location else 'Unknown location'
        year = tree.year if tree.year else 'N/A'
        hectares = tree.hectares if tree.hectares else 'N/A'
        
        # Build detailed description
        details = []
        details.append(f"Species: {species_name} ({scientific_name})")
        details.append(f"Location: {location_info}")
        details.append(f"Year: {year}")
        details.append(f"Hectares: {hectares}")
        if tree.height_meters:
            details.append(f"Height: {tree.height_meters}m")
        if tree.diameter_cm:
            details.append(f"Diameter: {tree.diameter_cm}cm")
        
        tree_info = " | ".join(details)
        
        tree.delete()
        
        # Delete the location if it's not used by any other tree
        if location and not location.trees.exists():
            location.delete()
        
        # Log delete activity with detailed information
        History.objects.create(
            user=request.user,
            action='delete_tree',
            description=f'Deleted tree: {tree_info}'
        )
        
        # Note: We do NOT delete taxonomy entries (species, genus, family) when trees are deleted
        # Taxonomy entries should remain in the database for autocomplete suggestions and future use
        # They can only be deleted explicitly from the Manage Taxonomy page
            
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
        
        # Get all trees to delete with details before deletion
        trees = EndemicTree.objects.filter(id__in=tree_ids, user=request.user).select_related('species', 'location')
        deleted_count = 0
        locations_to_check = []
        species_to_check = set()  # Use set to avoid duplicates
        
        # Collect details about trees being deleted
        deleted_species = {}  # {species_name: count}
        deleted_locations = set()
        total_hectares = 0
        years_deleted = set()
        
        for tree in trees:
            location = tree.location
            species = tree.species
            locations_to_check.append(location)
            if species:
                species_to_check.add(species)
                species_name = species.common_name or 'Unknown'
                deleted_species[species_name] = deleted_species.get(species_name, 0) + 1
            if location:
                deleted_locations.add(location.address or f"Lat: {location.latitude}, Lng: {location.longitude}")
            if tree.hectares:
                total_hectares += tree.hectares
            if tree.year:
                years_deleted.add(tree.year)
            
            tree.delete()
            deleted_count += 1
        
        # Delete locations that are no longer used
        for location in locations_to_check:
            if location and not location.trees.exists():
                location.delete()
        
        # Build detailed description
        details = []
        details.append(f"Count: {deleted_count} tree(s)")
        if deleted_species:
            species_list = ", ".join([f"{name} ({count})" for name, count in sorted(deleted_species.items())])
            details.append(f"Species: {species_list}")
        if total_hectares > 0:
            details.append(f"Total Hectares: {total_hectares:.2f}")
        if years_deleted:
            years_str = ", ".join(sorted([str(y) for y in years_deleted]))
            details.append(f"Years: {years_str}")
        if len(deleted_locations) <= 5:
            locations_str = ", ".join(list(deleted_locations)[:5])
            details.append(f"Locations: {locations_str}")
        elif len(deleted_locations) > 5:
            details.append(f"Locations: {len(deleted_locations)} unique locations")
        
        description = " | ".join(details)
        
        # Log bulk delete activity with detailed information
        History.objects.create(
            user=request.user,
            action='delete_trees_bulk',
            description=f'Bulk deleted: {description}'
        )
        
        # Note: We do NOT delete taxonomy entries (species, genus, family) when trees are deleted
        # Taxonomy entries should remain in the database for autocomplete suggestions and future use
        # They can only be deleted explicitly from the Manage Taxonomy page
        
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
        # Get detailed information before deletion
        trees = EndemicTree.objects.filter(user=request.user).select_related('species', 'location')
        total_count = trees.count()
        
        # Collect details about all trees being deleted
        deleted_species = {}  # {species_name: count}
        total_hectares = 0
        years_deleted = set()
        unique_locations = set()
        
        for tree in trees:
            if tree.species:
                species_name = tree.species.common_name or 'Unknown'
                deleted_species[species_name] = deleted_species.get(species_name, 0) + 1
            if tree.location:
                location_info = tree.location.address or f"Lat: {tree.location.latitude}, Lng: {tree.location.longitude}"
                unique_locations.add(location_info)
            if tree.hectares:
                total_hectares += tree.hectares
            if tree.year:
                years_deleted.add(tree.year)
        
        # Get all locations and species to check after deletion
        locations_to_check = list(Location.objects.filter(user=request.user, trees__isnull=False).distinct())
        species_to_check = set(TreeSpecies.objects.filter(user=request.user, trees__isnull=False).distinct())
        
        # Delete all trees
        EndemicTree.objects.filter(user=request.user).delete()
        
        # Delete locations that are no longer used
        for location in locations_to_check:
            if not location.trees.exists():
                location.delete()
        
        # Build detailed description
        details = []
        details.append(f"Count: {total_count} tree(s)")
        if deleted_species:
            species_list = ", ".join([f"{name} ({count})" for name, count in sorted(deleted_species.items())[:10]])
            if len(deleted_species) > 10:
                species_list += f" and {len(deleted_species) - 10} more species"
            details.append(f"Species: {species_list}")
        if total_hectares > 0:
            details.append(f"Total Hectares: {total_hectares:.2f}")
        if years_deleted:
            years_str = ", ".join(sorted([str(y) for y in years_deleted])[:10])
            if len(years_deleted) > 10:
                years_str += f" and {len(years_deleted) - 10} more years"
            details.append(f"Years: {years_str}")
        if unique_locations:
            details.append(f"Locations: {len(unique_locations)} unique locations")
        
        description = " | ".join(details)
        
        # Log delete all activity with detailed information
        History.objects.create(
            user=request.user,
            action='delete_all_trees',
            description=f'Deleted all trees: {description}'
        )
        
        # Note: We do NOT delete taxonomy entries (species, genus, family) when trees are deleted
        # Taxonomy entries should remain in the database for autocomplete suggestions and future use
        # They can only be deleted explicitly from the Manage Taxonomy page
        
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
        
        # Note: We do NOT delete taxonomy entries (species, genus, family) when seeds are deleted
        # Taxonomy entries should remain in the database for autocomplete suggestions and future use
        # They can only be deleted explicitly from the Manage Taxonomy page
            
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
        
        # Note: We do NOT delete taxonomy entries (species, genus, family) when seeds are deleted
        # Taxonomy entries should remain in the database for autocomplete suggestions and future use
        # They can only be deleted explicitly from the Manage Taxonomy page
        
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
        
        # Note: We do NOT delete taxonomy entries (species, genus, family) when seeds are deleted
        # Taxonomy entries should remain in the database for autocomplete suggestions and future use
        # They can only be deleted explicitly from the Manage Taxonomy page
        
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
                    # Geocode new location
                    try:
                        geocode_location(seed.location)
                    except Exception as e:
                        print(f"Geocoding failed for location {seed.location.id}: {str(e)}")
                else:
                    # Update coordinates and geocode if they changed
                    coords_changed = (seed.location.latitude != latitude or seed.location.longitude != longitude)
                    seed.location.latitude = latitude
                    seed.location.longitude = longitude
                    seed.location.save()
                    if coords_changed:
                        # Clear address and geocode again
                        seed.location.address = None
                        try:
                            geocode_location(seed.location)
                        except Exception as e:
                            print(f"Geocoding failed for location {seed.location.id}: {str(e)}")
                
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
        # Only show current user's layers (if authenticated)
        if request.user.is_authenticated:
            layers = MapLayer.objects.filter(user=request.user).order_by('-id')
            username = getattr(request.user, 'username', 'unknown')
            print(f"[DEBUG] Found {layers.count()} layers for user {username}")
        else:
            layers = MapLayer.objects.none()
            print("[DEBUG] User not authenticated, returning empty layers list")
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
                user=request.user,
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
        layer = MapLayer.objects.get(id=layer_id, user=request.user)
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
def species_image(request, species_id):
    """Serve image from TreeSpecies as HTTP response."""
    try:
        species = TreeSpecies.objects.get(id=species_id, user=request.user)
        
        # Check if image exists
        if not species.image:
            return HttpResponseNotFound("Image not found")
        
        # Get binary data - BinaryField returns bytes
        image_data = species.image
        if isinstance(image_data, memoryview):
            image_data = bytes(image_data)
        elif not isinstance(image_data, bytes):
            image_data = bytes(image_data)
        
        # Determine content type based on image format
        if species.image_format == 'JPEG':
            content_type = 'image/jpeg'
        elif species.image_format == 'PNG':
            content_type = 'image/png'
        else:
            content_type = 'image/jpeg'  # Default
        
        # Create response with proper headers
        response = HttpResponse(image_data, content_type=content_type)
        response['Content-Length'] = len(image_data)
        response['Cache-Control'] = 'public, max-age=3600'
        
        return response
        
    except TreeSpecies.DoesNotExist:
        return HttpResponseNotFound("Species not found")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return HttpResponseServerError(f"Error serving image: {str(e)}")
@login_required(login_url='app:login')

def add_taxonomy(request):

    """Add new taxonomy entry"""

    if request.method == 'POST':

        try:

            common_name = request.POST.get('common_name', '').strip()

            scientific_name = request.POST.get('scientific_name', '').strip()

            family_name = request.POST.get('family', '').strip()

            genus_name = request.POST.get('genus', '').strip()

            

            if not all([common_name, scientific_name, family_name, genus_name]):

                return JsonResponse({

                    'success': False,

                    'error': 'All fields are required'

                }, status=400)

            

            # Get or create family

            family, _ = TreeFamily.objects.get_or_create(

                name=family_name,

                user=request.user,

                defaults={'description': ''}

            )

            

            # Get or create genus

            genus, _ = TreeGenus.objects.get_or_create(

                name=genus_name,

                user=request.user,

                defaults={'family': family}

            )

            # Update family if it was different

            if genus.family != family:

                genus.family = family

                genus.save()

            

            # Create species (will update if exists)

            species, created = TreeSpecies.objects.get_or_create(

                scientific_name=scientific_name,

                user=request.user,

                defaults={

                    'common_name': common_name,

                    'genus': genus,

                    'is_endemic': True

                }

            )

            

            # Update if exists

            if not created:

                species.common_name = common_name

                species.genus = genus

                species.save()

            

            return JsonResponse({

                'success': True,

                'message': 'Taxonomy added successfully',

                'id': str(species.id)

            })

        except Exception as e:

            import traceback

            traceback.print_exc()

            return JsonResponse({

                'success': False,

                'error': str(e)

            }, status=500)

    

    return JsonResponse({'error': 'Invalid request method'}, status=405)





@login_required(login_url='app:login')

def list_taxonomy(request):

    """List all taxonomy entries for the user"""

    try:

        species_list = TreeSpecies.objects.filter(user=request.user).select_related('genus', 'genus__family').order_by('common_name')

        taxonomy_data = []

        for species in species_list:

            taxonomy_data.append({

                'id': str(species.id),

                'common_name': species.common_name,

                'scientific_name': species.scientific_name,

                'family': species.genus.family.name if species.genus and species.genus.family else '',

                'genus': species.genus.name if species.genus else ''

            })

        

        return JsonResponse({

            'success': True,

            'taxonomy': taxonomy_data

        })

    except Exception as e:

        return JsonResponse({

            'success': False,

            'error': str(e)

        }, status=500)





@login_required(login_url='app:login')

def update_taxonomy(request, taxonomy_id):

    """Update an existing taxonomy entry"""

    if request.method != 'POST':

        return JsonResponse({'error': 'Invalid request method'}, status=405)

    

    try:

        species = TreeSpecies.objects.get(id=taxonomy_id, user=request.user)

        common_name = request.POST.get('common_name', '').strip()

        scientific_name = request.POST.get('scientific_name', '').strip()

        family_name = request.POST.get('family', '').strip()

        genus_name = request.POST.get('genus', '').strip()

        

        if not all([common_name, scientific_name, family_name, genus_name]):

            return JsonResponse({

                'success': False,

                'error': 'All fields are required'

            }, status=400)

        

        # Get or create family

        family, _ = TreeFamily.objects.get_or_create(

            name=family_name,

            user=request.user,

            defaults={'description': ''}

        )

        

        # Get or create genus

        genus, _ = TreeGenus.objects.get_or_create(

            name=genus_name,

            user=request.user,

            defaults={'family': family}

        )

        # Update family if it was different

        if genus.family != family:

            genus.family = family

            genus.save()

        

        # Update species

        species.common_name = common_name

        species.scientific_name = scientific_name

        species.genus = genus

        species.save()

        

        return JsonResponse({

            'success': True,

            'message': 'Taxonomy updated successfully',

            'id': str(species.id)

        })

    except TreeSpecies.DoesNotExist:

        return JsonResponse({

            'success': False,

            'error': 'Taxonomy entry not found'

        }, status=404)

    except Exception as e:

        import traceback

        traceback.print_exc()

        return JsonResponse({

            'success': False,

            'error': str(e)

        }, status=500)


@login_required(login_url='app:login')

def delete_taxonomy(request, taxonomy_id):

    """Delete a taxonomy entry"""

    if request.method != 'POST':

        return JsonResponse({'error': 'Invalid request method'}, status=405)

    

    try:

        species = TreeSpecies.objects.get(id=taxonomy_id, user=request.user)

        species.delete()

        return JsonResponse({

            'success': True,

            'message': 'Taxonomy deleted successfully'

        })

    except TreeSpecies.DoesNotExist:

        return JsonResponse({

            'success': False,

            'error': 'Taxonomy entry not found'

        }, status=404)

    except Exception as e:

        return JsonResponse({

            'success': False,

            'error': str(e)

        }, status=500)



