import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from django.db.models import Count, Sum
from django.utils import timezone
from django.urls import reverse

from app.models import (
    EndemicTree, MapLayer, UserSetting, TreeFamily,
    TreeGenus, TreeSpecies, Location, PinStyle, TreeSeed, UserProfile
)


def get_setting(user, key, default=None):
    """Helper function to get a setting value"""
    if not user.is_authenticated:
        return default
    try:
        return UserSetting.objects.get(user=user, key=key).value
    except UserSetting.DoesNotExist:
        return default


def get_user_type(user):
    """Helper function to get user type from profile"""
    try:
        return user.profile.user_type
    except (AttributeError, UserProfile.DoesNotExist):
        return None


def require_user_type(user_type_required):
    """Decorator to require specific user type"""
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return redirect('head:login')
            user_type = get_user_type(request.user)
            if user_type != user_type_required:
                messages.error(request, 'You do not have permission to access this page.')
                if user_type == 'app_user':
                    return redirect('app:dashboard')
                elif user_type == 'public_user':
                    return redirect('public:home')
                else:
                    return redirect('head:login')
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def user_login(request):
    """
    Handle head user login - only for head users
    """
    if request.user.is_authenticated:
        return redirect('head:gis')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Check user type - only allow head_user
            user_type = get_user_type(user)
            if user_type != 'head_user':
                return render(request, 'head/login.html', {
                    'error_message': 'This account is not authorized to access the head portal. Please use the correct login portal.',
                    'theme': get_setting(request.user, 'theme', 'dark')
                })
            
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            messages.success(request, f"Welcome back, {username}!")
            return redirect('head:gis')
        else:
            return render(request, 'head/login.html', {
                'error_message': 'Invalid username or password',
                'theme': get_setting(request.user, 'theme', 'dark')
            })

    return render(request, 'head/login.html', {
        'theme': get_setting(request.user, 'theme', 'dark')
    })


def head_root(request):
    """
    Root view for head app - redirects to login or GIS based on authentication
    """
    if request.user.is_authenticated:
        # Check user type
        user_type = get_user_type(request.user)
        if user_type == 'head_user':
            return redirect('head:gis')
        else:
            # User is authenticated but wrong type, redirect to appropriate portal
            if user_type == 'app_user':
                return redirect('app:dashboard')
            elif user_type == 'public_user':
                return redirect('public:home')
            else:
                return redirect('head:login')
    else:
        return redirect('head:login')


def user_logout(request):
    """
    Handle user logout
    """
    logout(request)
    messages.success(request, "You have been logged out successfully.")
    return redirect('head:login')


@login_required(login_url='head:login')
@require_user_type('head_user')
def gis(request):
    """
    GIS Map view - shows all data from all users
    """
    # Get all available map layers (from all users or shared layers)
    layers = MapLayer.objects.filter(is_active=True)

    # Get all tree species that have associated trees (from all users)
    tree_species = TreeSpecies.objects.filter(
        trees__isnull=False
    ).distinct().order_by('common_name')

    # Get default pin style (try to get user's, otherwise any default)
    try:
        default_pin = PinStyle.objects.get(user=request.user, is_default=True)
    except PinStyle.DoesNotExist:
        try:
            default_pin = PinStyle.objects.filter(is_default=True).first()
        except:
            default_pin = None

    context = {
        'active_page': 'gis',
        'layers': layers,
        'tree_species': tree_species,
        'default_pin': default_pin,
    }
    return render(request, 'head/gis.html', context)


@login_required(login_url='head:login')
def analytics(request):
    """
    Analytics and visualization view - shows all data from all users
    """
    try:
        # Check if there's any data in the database
        if not EndemicTree.objects.exists():
            return render(request, 'head/analytics.html', {
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

        # Population by year - ALL USERS DATA
        population_by_year = list(EndemicTree.objects.values('year')
            .annotate(total=Sum('population'))
            .order_by('year'))

        # Health status distribution - ALL USERS DATA
        health_status_data = list(EndemicTree.objects.values('health_status')
            .annotate(count=Sum('population'))
            .order_by('health_status'))

        # Family distribution data - ALL USERS DATA
        family_data = list(TreeFamily.objects.annotate(
            total_population=Sum('genera__species__trees__population'),
            species_count=Count('genera__species', distinct=True)
        ).values('name', 'total_population', 'species_count')
        .order_by('-total_population')[:10])

        # Species distribution by genus - ALL USERS DATA
        genus_data = list(TreeGenus.objects.annotate(
            total_population=Sum('species__trees__population'),
            species_count=Count('species', distinct=True)
        ).values('name', 'family__name', 'total_population', 'species_count')
        .order_by('-total_population')[:10])

        # Species data with population - ALL USERS DATA
        species_data = list(TreeSpecies.objects.annotate(
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

        # Location-based distribution - ALL USERS DATA
        location_data = list(Location.objects.annotate(
            total_trees=Sum('trees__population'),
            species_count=Count('trees__species', distinct=True)
        ).values('name', 'latitude', 'longitude', 'total_trees', 'species_count')
        .exclude(total_trees__isnull=True)
        .order_by('-total_trees'))

        # Health status by year - ALL USERS DATA
        health_by_year = list(EndemicTree.objects.values('year', 'health_status')
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

        return render(request, 'head/analytics.html', context)

    except Exception as e:
        print(f"Analytics Error: {str(e)}")
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
        return render(request, 'head/analytics.html', context)


@login_required(login_url='head:login')
@require_user_type('head_user')
def layers(request):
    """
    Layer control view - shows all layers from all users, head can add/edit layers
    """
    layers = MapLayer.objects.all().order_by('-id')

    context = {
        'active_page': 'layers',
        'layers': layers,
    }
    return render(request, 'head/layers.html', context)


@login_required(login_url='head:login')
def reports(request):
    """View for generating reports - shows all data from all users."""
    # Get only species that have associated trees - from all users
    species_list = TreeSpecies.objects.filter(
        trees__isnull=False
    ).distinct().order_by('common_name')
    
    # Get only locations that have associated trees - from all users
    location_list = Location.objects.filter(
        trees__isnull=False
    ).distinct().order_by('name')

    return render(request, 'head/reports.html', {
        'active_page': 'reports',
        'species_list': species_list,
        'location_list': location_list
    })


@login_required(login_url='head:login')
def about(request):
    """
    About page
    """
    context = {
        'active_page': 'about',
    }
    return render(request, 'head/about.html', context)


# API Views for head app - showing all users data
@login_required(login_url='head:login')
def tree_data(request):
    """
    API endpoint for tree data in GeoJSON format - ALL USERS DATA
    """
    try:
        trees = EndemicTree.objects.select_related('species', 'species__genus', 'species__genus__family', 'location').all()

        # Get pin style
        try:
            pin_style = PinStyle.objects.get(user=request.user, is_default=True)
        except PinStyle.DoesNotExist:
            try:
                pin_style = PinStyle.objects.filter(is_default=True).first()
            except:
                pin_style = None

        # Convert to GeoJSON format
        features = []
        for tree in trees:
            # Get image URL from species (shared by all trees with same common_name and scientific_name)
            image_url = None
            if tree.species.image:
                image_url = request.build_absolute_uri(reverse('app:species_image', args=[tree.species.id]))
            
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
                    'family': tree.species.genus.family.name if tree.species.genus and tree.species.genus.family else 'Unknown',
                    'genus': tree.species.genus.name if tree.species.genus else 'Unknown',
                    'location': tree.location.name,
                    'population': tree.population,
                    'year': tree.year,
                    'health_status': tree.health_status,
                    'healthy_count': tree.healthy_count,
                    'good_count': tree.good_count,
                    'bad_count': tree.bad_count,
                    'deceased_count': tree.deceased_count,
                    'hectares': tree.hectares,
                    'notes': tree.notes or '',
                    'image_url': image_url,
                    'user': tree.user.username if tree.user else 'Unknown'
                }
            }
            features.append(feature)

        return JsonResponse({
            'type': 'FeatureCollection',
            'features': features
        })

    except Exception as e:
        return JsonResponse({
            'type': 'FeatureCollection',
            'features': [],
            'error': str(e)
        }, status=500)


@login_required(login_url='head:login')
def seed_data(request):
    """
    API endpoint for seed data in GeoJSON format - ALL USERS DATA
    """
    try:
        seeds = TreeSeed.objects.select_related('species', 'location').all()

        features = []
        for seed in seeds:
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [seed.location.longitude, seed.location.latitude]
                },
                'properties': {
                    'id': str(seed.id),
                    'species': seed.species.common_name,
                    'scientific_name': seed.species.scientific_name,
                    'location': seed.location.name,
                    'planting_date': seed.planting_date.strftime('%Y-%m-%d') if seed.planting_date else None,
                    'germination_status': seed.germination_status,
                    'survival_rate': float(seed.survival_rate) if seed.survival_rate else 0,
                    'user': seed.user.username if seed.user else 'Unknown'
                }
            }
            features.append(feature)

        return JsonResponse({
            'type': 'FeatureCollection',
            'features': features
        })

    except Exception as e:
        return JsonResponse({
            'type': 'FeatureCollection',
            'features': [],
            'error': str(e)
        }, status=500)


@login_required(login_url='head:login')
def filter_trees(request, species_id):
    """
    API endpoint for filtered tree data - ALL USERS DATA
    """
    try:
        # Get trees for this species from all users
        trees = EndemicTree.objects.filter(species_id=species_id).select_related('species', 'species__genus', 'species__genus__family', 'location')

        # Get pin style
        try:
            pin_style = PinStyle.objects.get(user=request.user, is_default=True)
        except PinStyle.DoesNotExist:
            try:
                pin_style = PinStyle.objects.filter(is_default=True).first()
            except:
                pin_style = None

        # Convert to GeoJSON format
        features = []
        for tree in trees:
            # Get image URL from species (shared by all trees with same common_name and scientific_name)
            image_url = None
            if tree.species.image:
                image_url = request.build_absolute_uri(reverse('app:species_image', args=[tree.species.id]))
            
            feature = {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [tree.location.longitude, tree.location.latitude]
                },
                'properties': {
                    'id': str(tree.id),
                    'common_name': tree.species.common_name,
                    'scientific_name': tree.species.scientific_name,
                    'family': tree.species.genus.family.name if tree.species.genus and tree.species.genus.family else 'Unknown',
                    'genus': tree.species.genus.name if tree.species.genus else 'Unknown',
                    'location': tree.location.name,
                    'population': tree.population,
                    'year': tree.year,
                    'health_status': tree.health_status,
                    'healthy_count': tree.healthy_count,
                    'good_count': tree.good_count,
                    'bad_count': tree.bad_count,
                    'deceased_count': tree.deceased_count,
                    'hectares': tree.hectares,
                    'notes': tree.notes or '',
                    'image_url': image_url,
                    'user': tree.user.username if tree.user else 'Unknown'
                }
            }
            features.append(feature)

        return JsonResponse({
            'type': 'FeatureCollection',
            'features': features
        })

    except Exception as e:
        return JsonResponse({
            'type': 'FeatureCollection',
            'features': [],
            'error': str(e)
        }, status=500)


@login_required(login_url='head:login')
def analytics_data(request):
    """
    API endpoint for analytics data - ALL USERS DATA
    """
    try:
        # Get aggregated data from all users
        data = {
            'total_trees': EndemicTree.objects.count(),
            'total_species': TreeSpecies.objects.count(),
            'total_locations': Location.objects.count(),
            'total_population': EndemicTree.objects.aggregate(total=Sum('population'))['total'] or 0
        }
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@login_required(login_url='head:login')
@require_user_type('head_user')
def api_layers(request):
    """
    API endpoint for layers - Head can view all and create/edit layers
    """
    if request.method == 'GET':
        try:
            layers = MapLayer.objects.all().order_by('-id')
            layers_data = [{
                'id': layer.id,
                'name': layer.name,
                'description': layer.description,
                'url': layer.url,
                'layer_type': layer.layer_type,
                'attribution': layer.attribution,
                'is_active': layer.is_active,
                'is_default': layer.is_default,
                'z_index': layer.z_index,
                'user': layer.user.username if layer.user else 'System'
            } for layer in layers]
            return JsonResponse({'layers': layers_data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    elif request.method == 'POST':
        # Head users can create layers
        try:
            import json
            data = json.loads(request.body)
            
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
                is_default=data.get('is_default', False),
                user=request.user
            )
            
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
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@login_required(login_url='head:login')
def api_species_list(request):
    """API endpoint to get current list of species for dropdown updates - ALL USERS DATA"""
    try:
        # Get only species that have associated trees - from all users
        species_list = TreeSpecies.objects.filter(
            trees__isnull=False
        ).distinct().order_by('common_name')
        
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


@login_required(login_url='head:login')
def api_locations_list(request):
    """API endpoint to get current list of locations for dropdown updates - ALL USERS DATA"""
    try:
        # Get only locations that have associated trees - from all users
        location_list = Location.objects.filter(
            trees__isnull=False
        ).distinct().order_by('name')
        
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


@login_required(login_url='head:login')
@require_user_type('head_user')
def api_layers_detail(request, layer_id):
    """
    API endpoint for managing individual map layers - Head can edit/delete
    """
    try:
        layer = MapLayer.objects.get(id=layer_id)
    except MapLayer.DoesNotExist:
        return JsonResponse({'error': 'Layer not found'}, status=404)
    
    if request.method == 'GET':
        return JsonResponse({
            'id': layer.id,
            'name': layer.name,
            'description': layer.description,
            'url': layer.url,
            'layer_type': layer.layer_type,
            'attribution': layer.attribution,
            'is_active': layer.is_active,
            'is_default': layer.is_default,
            'z_index': layer.z_index,
            'user': layer.user.username if layer.user else 'System'
        })
    
    elif request.method == 'PUT' or request.method == 'PATCH':
        try:
            import json
            data = json.loads(request.body)
            
            # Update layer fields
            if 'name' in data:
                layer.name = data['name']
            if 'description' in data:
                layer.description = data.get('description', '')
            if 'layer_type' in data:
                layer.layer_type = data['layer_type']
            if 'url' in data:
                layer.url = data['url']
            if 'attribution' in data:
                layer.attribution = data.get('attribution', '')
            if 'is_active' in data:
                layer.is_active = data['is_active']
            if 'is_default' in data:
                layer.is_default = data['is_default']
            
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
            }, status=400)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@login_required(login_url='head:login')
@csrf_protect
def generate_report(request):
    """View for generating reports based on form data - ALL USERS DATA."""
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

        # Get actual data statistics (ALL USERS DATA)
        try:
            trees_query = EndemicTree.objects.all().select_related('species', 'location', 'user')
            
            # Apply filters for statistics
            if species_filter and species_filter != 'all':
                try:
                    trees_query = trees_query.filter(species_id=int(species_filter))
                except (ValueError, TypeError):
                    pass
            if location_filter and location_filter != 'all':
                try:
                    trees_query = trees_query.filter(location_id=int(location_filter))
                except (ValueError, TypeError):
                    pass
            
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
            
            try:
                unique_users = trees_query.exclude(user__isnull=True).values('user').distinct().count()
            except:
                unique_users = 0
            
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
            
            # User contribution
            try:
                user_contrib = list(trees_query.exclude(user__isnull=True).values('user__username').annotate(
                    count=Count('id'),
                    population=Sum('population')
                ).order_by('-population')[:10])
            except:
                user_contrib = []
        except Exception as e:
            # If statistics fail, use defaults
            import traceback
            traceback.print_exc()
            total_trees = 0
            total_population = 0
            unique_species = 0
            unique_locations = 0
            unique_users = 0
            health_distribution = []
            species_dist = []
            year_dist = []
            user_contrib = []

        # Build the report HTML - ensure all values are safe for f-string
        total_trees = int(total_trees) if total_trees else 0
        total_population = int(total_population) if total_population else 0
        unique_species = int(unique_species) if unique_species else 0
        unique_locations = int(unique_locations) if unique_locations else 0
        unique_users = int(unique_users) if unique_users else 0
        
        html = f'''
        <div class="report-document">
            <div class="report-header">
                <h1 class="report-title">{report_title}</h1>
                <p class="report-subtitle">Endemic Trees Monitoring System - Head Portal</p>
                <p class="report-date">Generated on {date_str} at {time_str}</p>
                <p class="report-note"><strong>Note:</strong> This report includes data from all users ({unique_users} active users).</p>
            </div>

            <div class="report-section">
                <h2 class="report-section-title">Executive Summary</h2>
                <div class="report-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
                    <div class="stat-card" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h3 style="margin: 0; color: #495057; font-size: 0.9rem;">Total Tree Records</h3>
                        <p style="margin: 0.5rem 0 0 0; font-size: 2rem; font-weight: bold; color: #007bff;">{total_trees}</p>
                    </div>
                    <div class="stat-card" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h3 style="margin: 0; color: #495057; font-size: 0.9rem;">Total Population</h3>
                        <p style="margin: 0.5rem 0 0 0; font-size: 2rem; font-weight: bold; color: #28a745;">{total_population:,}</p>
                    </div>
                    <div class="stat-card" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h3 style="margin: 0; color: #495057; font-size: 0.9rem;">Unique Species</h3>
                        <p style="margin: 0.5rem 0 0 0; font-size: 2rem; font-weight: bold; color: #ffc107;">{unique_species}</p>
                    </div>
                    <div class="stat-card" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h3 style="margin: 0; color: #495057; font-size: 0.9rem;">Unique Locations</h3>
                        <p style="margin: 0.5rem 0 0 0; font-size: 2rem; font-weight: bold; color: #dc3545;">{unique_locations}</p>
                    </div>
                    <div class="stat-card" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border: 1px solid #dee2e6;">
                        <h3 style="margin: 0; color: #495057; font-size: 0.9rem;">Active Users</h3>
                        <p style="margin: 0.5rem 0 0 0; font-size: 2rem; font-weight: bold; color: #6f42c1;">{unique_users}</p>
                    </div>
                </div>
                <p style="margin-top: 1.5rem;">This comprehensive report provides an analysis of endemic tree data collected by all users of the Endemic Trees Monitoring System. 
                   The data includes {total_trees} tree records with a total population of {total_population:,} trees across {unique_species} unique species, 
                   {unique_locations} locations, and contributions from {unique_users} active users.</p>
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

        # Add data analysis sections
        if health_distribution:
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Health Status Distribution</h2>
                <table class="report-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Health Status</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Number of Records</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Total Population</th>
                        </tr>
                    </thead>
                    <tbody>
            '''
            for health in health_distribution:
                status_display = health['health_status'].replace('_', ' ').title() if health['health_status'] else 'Unknown'
                html += f'''
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{status_display}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{health['count']}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{health['population']:,}</td>
                        </tr>
                '''
            html += '''
                    </tbody>
                </table>
            </div>
            '''
        
        if species_dist:
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Top Species by Population</h2>
                <table class="report-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Common Name</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Scientific Name</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Records</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Total Population</th>
                        </tr>
                    </thead>
                    <tbody>
            '''
            for species in species_dist:
                try:
                    common_name = species.get('species__common_name') or 'Unknown'
                    scientific_name = species.get('species__scientific_name') or 'Unknown'
                    count = species.get('count', 0) or 0
                    total_pop = species.get('total_population', 0) or 0
                    html += f'''
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{common_name}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;"><em>{scientific_name}</em></td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{count}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{total_pop:,}</td>
                        </tr>
                    '''
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    continue
            html += '''
                    </tbody>
                </table>
            </div>
            '''
        
        if year_dist:
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Population Trends by Year</h2>
                <table class="report-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Year</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Records</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Total Population</th>
                        </tr>
                    </thead>
                    <tbody>
            '''
            for year_data in year_dist:
                try:
                    year = year_data.get('year', 'Unknown') or 'Unknown'
                    count = year_data.get('count', 0) or 0
                    population = year_data.get('population', 0) or 0
                    html += f'''
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{year}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{count}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{population:,}</td>
                        </tr>
                    '''
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    continue
            html += '''
                    </tbody>
                </table>
            </div>
            '''
        
        if user_contrib:
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Top Contributors by Population</h2>
                <table class="report-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">User</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Records</th>
                            <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Total Population</th>
                        </tr>
                    </thead>
                    <tbody>
            '''
            for user in user_contrib:
                try:
                    username = user.get('user__username') or 'Unknown'
                    count = user.get('count', 0) or 0
                    population = user.get('population', 0) or 0
                    html += f'''
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{username}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{count}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{population:,}</td>
                        </tr>
                    '''
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    continue
            html += '''
                    </tbody>
                </table>
            </div>
            '''

        # Add data table if included
        if include_table:
            # Query the database for tree data - ALL USERS
            trees = trees_query.select_related('species', 'location', 'user')
            
            # Generate table HTML
            html += '''
            <div class="report-section">
                <h2 class="report-section-title">Data Table</h2>
                <div class="report-table-container">
                    <table class="report-table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Species</th>
                                <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Location</th>
                                <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Population</th>
                                <th style="padding: 0.75rem; border: 1px solid #dee2e6;">Health Status</th>
                                <th style="padding: 0.75rem; border: 1px solid #dee2e6;">User</th>
                            </tr>
                        </thead>
                        <tbody>
            '''
            
            # Add table rows with proper error handling
            tree_count = 0
            for tree in trees[:100]:  # Limit to 100 rows for performance
                try:
                    common_name = tree.species.common_name if tree.species else 'Unknown'
                    scientific_name = tree.species.scientific_name if tree.species else 'Unknown'
                    location_name = tree.location.name if tree.location else 'Unknown'
                    health_status = tree.health_status or 'Unknown'
                    population = tree.population or 0
                    user_name = tree.user.username if tree.user else 'Unknown'
                    
                    html += f'''
                        <tr>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{common_name} ({scientific_name})</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{location_name}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{population}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{health_status.replace('_', ' ').title()}</td>
                            <td style="padding: 0.75rem; border: 1px solid #dee2e6;">{user_name}</td>
                        </tr>
                    '''
                    tree_count += 1
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    continue
            
            if tree_count == 0:
                html += '''
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">No tree data available for the selected filters.</td>
                    </tr>
                '''
            
            html += '''
                        </tbody>
                    </table>
                </div>
            </div>
            '''

        # Add conclusions based on actual data
        conclusions = []
        if total_trees == 0:
            conclusions.append("No tree data is available in the system. Encourage users to add tree records.")
        else:
            if unique_users > 0:
                conclusions.append(f"Data is contributed by {unique_users} active users, demonstrating collaborative data collection efforts.")
            if unique_species > 0:
                conclusions.append(f"The system contains data for {unique_species} unique species, indicating good species diversity across all contributions.")
            if unique_locations > 0:
                conclusions.append(f"Trees are distributed across {unique_locations} different locations, showing comprehensive geographic coverage.")
            if health_distribution:
                try:
                    excellent_count = next((h.get('count', 0) for h in health_distribution if h.get('health_status') == 'excellent'), 0)
                    poor_count = next((h.get('count', 0) for h in health_distribution if h.get('health_status') in ['poor', 'very_poor']), 0)
                    if excellent_count > poor_count:
                        conclusions.append("The majority of trees across all users are in good to excellent health, indicating successful collaborative conservation efforts.")
                    elif poor_count > excellent_count:
                        conclusions.append("A significant number of trees require attention due to poor health status. Coordinate conservation efforts across users.")
                except:
                    pass
        
        html += f'''
            <div class="report-section">
                <h2 class="report-section-title">Conclusions and Recommendations</h2>
                <p>Based on the comprehensive data analysis from all users, the following conclusions can be drawn:</p>
                <ul>
        '''
        for conclusion in conclusions:
            # Escape HTML to prevent issues
            from django.utils.html import escape
            escaped_conclusion = escape(str(conclusion))
            html += f'<li>{escaped_conclusion}</li>'
        
        if not conclusions:
            html += '<li>Continue encouraging collaborative data collection to build a comprehensive dataset.</li>'
        
        html += '''
                    <li>Regular monitoring and assessment of tree health status is essential across all user contributions.</li>
                    <li>Collaborative data collection provides a more comprehensive view of endemic tree distribution.</li>
                </ul>
            </div>
        </div>
        '''

        try:
            return JsonResponse({
                'reportContent': html,
                'success': True,
                'yearData': year_dist,  # Include year distribution data for charts
                'healthData': health_distribution,  # Include health distribution data
                'speciesData': species_dist  # Include species distribution data
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
        print(f"Error generating report (head): {error_trace}")
        # Return more detailed error in development, generic message in production
        error_message = str(e)
        if hasattr(request, 'user') and request.user.is_superuser:
            error_message = f"{str(e)}\n\nTraceback:\n{error_trace}"
        return JsonResponse({
            'error': error_message,
            'success': False
        }, status=500)
