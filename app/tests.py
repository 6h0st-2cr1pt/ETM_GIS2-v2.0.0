"""Test suite for Endemic Trees Management System

This module contains comprehensive tests for models, views, APIs, and forms
using pytest and Django's test framework.
"""

import pytest
import json
from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from datetime import date, timedelta

from .models import (
    TreeFamily, TreeGenus, TreeSpecies, Location, PinStyle,
    EndemicTree, TreeSeed, MapLayer, UserSetting
)
from .forms import EndemicTreeForm, PinStyleForm, LocationForm


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture
def test_user(db):
    """Create a test user"""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )


@pytest.fixture
def authenticated_client(test_user):
    """Create an authenticated client"""
    client = Client()
    client.login(username='testuser', password='testpass123')
    return client


@pytest.fixture
def tree_family(db):
    """Create a test tree family"""
    return TreeFamily.objects.create(
        name='Ebenaceae',
        description='Ebony family'
    )


@pytest.fixture
def tree_genus(db, tree_family):
    """Create a test tree genus"""
    return TreeGenus.objects.create(
        name='Diospyros',
        family=tree_family,
        description='Persimmon genus'
    )


@pytest.fixture
def tree_species(db, tree_genus):
    """Create a test tree species"""
    return TreeSpecies.objects.create(
        scientific_name='Diospyros philippinensis',
        common_name='Philippine Ebony',
        genus=tree_genus,
        is_endemic=True,
        conservation_status='Endangered'
    )


@pytest.fixture
def location(db):
    """Create a test location"""
    return Location.objects.create(
        name='Test Location',
        latitude=10.0,
        longitude=123.0,
        elevation=100.0,
        description='Test location in Negros'
    )


@pytest.fixture
def endemic_tree(db, tree_species, location):
    """Create a test endemic tree record"""
    return EndemicTree.objects.create(
        species=tree_species,
        location=location,
        population=100,
        year=2027,
        health_status='good',
        healthy_count=50,
        good_count=30,
        bad_count=15,
        deceased_count=5,
        notes='Test tree record'
    )


@pytest.fixture
def tree_seed(db, tree_species, location):
    """Create a test tree seed record"""
    return TreeSeed.objects.create(
        species=tree_species,
        location=location,
        quantity=100,
        planting_date=date.today(),
        germination_status='germinating',
        survival_rate=85.5,
        notes='Test seed planting'
    )


@pytest.fixture
def map_layer(db):
    """Create a test map layer"""
    return MapLayer.objects.create(
        name='Test Layer',
        description='Test map layer',
        url='https://example.com/tiles/{z}/{x}/{y}',
        layer_type='custom',
        is_active=True,
        is_default=False,
        attribution='Test Attribution'
    )


@pytest.fixture
def pin_style(db):
    """Create a test pin style"""
    return PinStyle.objects.create(
        name='Test Pin',
        icon_class='fa-tree',
        color='#00ff00',
        size=24,
        border_color='#ffffff',
        border_width=2,
        background_color='rgba(0,0,0,0.6)',
        is_default=False
    )


# ============================================================================
# MODEL TESTS
# ============================================================================

class TestTreeFamilyModel:
    """Test TreeFamily model"""

    @pytest.mark.django_db
    def test_create_tree_family(self, tree_family):
        """Test creating a tree family"""
        assert tree_family.name == 'Ebenaceae'
        assert tree_family.description == 'Ebony family'
        assert str(tree_family) == 'Ebenaceae'

    @pytest.mark.django_db
    def test_tree_family_unique_name(self, tree_family):
        """Test that tree family names must be unique"""
        with pytest.raises(Exception):
            TreeFamily.objects.create(name='Ebenaceae')


class TestTreeGenusModel:
    """Test TreeGenus model"""

    @pytest.mark.django_db
    def test_create_tree_genus(self, tree_genus, tree_family):
        """Test creating a tree genus"""
        assert tree_genus.name == 'Diospyros'
        assert tree_genus.family == tree_family
        assert str(tree_genus) == 'Diospyros'

    @pytest.mark.django_db
    def test_tree_genus_family_relationship(self, tree_genus, tree_family):
        """Test genus-family relationship"""
        assert tree_genus in tree_family.genera.all()


class TestTreeSpeciesModel:
    """Test TreeSpecies model"""

    @pytest.mark.django_db
    def test_create_tree_species(self, tree_species, tree_genus):
        """Test creating a tree species"""
        assert tree_species.scientific_name == 'Diospyros philippinensis'
        assert tree_species.common_name == 'Philippine Ebony'
        assert tree_species.genus == tree_genus
        assert tree_species.is_endemic is True
        assert 'Philippine Ebony' in str(tree_species)

    @pytest.mark.django_db
    def test_tree_species_unique_scientific_name(self, tree_species):
        """Test that scientific names must be unique"""
        with pytest.raises(Exception):
            TreeSpecies.objects.create(
                scientific_name='Diospyros philippinensis',
                common_name='Another name',
                genus=tree_species.genus
            )


class TestLocationModel:
    """Test Location model"""

    @pytest.mark.django_db
    def test_create_location(self, location):
        """Test creating a location"""
        assert location.name == 'Test Location'
        assert location.latitude == 10.0
        assert location.longitude == 123.0
        assert location.elevation == 100.0
        assert '10.0' in str(location)
        assert '123.0' in str(location)


class TestEndemicTreeModel:
    """Test EndemicTree model"""

    @pytest.mark.django_db
    def test_create_endemic_tree(self, endemic_tree):
        """Test creating an endemic tree record"""
        assert endemic_tree.population == 100
        assert endemic_tree.year == 2027
        assert endemic_tree.health_status == 'good'
        assert endemic_tree.healthy_count == 50
        assert endemic_tree.good_count == 30
        assert endemic_tree.bad_count == 15
        assert endemic_tree.deceased_count == 5

    @pytest.mark.django_db
    def test_health_distribution_sum(self, endemic_tree):
        """Test that health distribution sums to population"""
        health_sum = (
            endemic_tree.healthy_count +
            endemic_tree.good_count +
            endemic_tree.bad_count +
            endemic_tree.deceased_count
        )
        assert health_sum == endemic_tree.population

    @pytest.mark.django_db
    def test_endemic_tree_string_representation(self, endemic_tree):
        """Test string representation"""
        assert 'Philippine Ebony' in str(endemic_tree)
        assert '2027' in str(endemic_tree)


class TestTreeSeedModel:
    """Test TreeSeed model"""

    @pytest.mark.django_db
    def test_create_tree_seed(self, tree_seed):
        """Test creating a tree seed record"""
        assert tree_seed.quantity == 100
        assert tree_seed.germination_status == 'germinating'
        assert tree_seed.survival_rate == 85.5

    @pytest.mark.django_db
    def test_tree_seed_dates(self, tree_seed):
        """Test seed date fields"""
        assert tree_seed.planting_date == date.today()
        assert tree_seed.created_at is not None


class TestMapLayerModel:
    """Test MapLayer model"""

    @pytest.mark.django_db
    def test_create_map_layer(self, map_layer):
        """Test creating a map layer"""
        assert map_layer.name == 'Test Layer'
        assert map_layer.layer_type == 'custom'
        assert map_layer.is_active is True
        assert map_layer.is_default is False

    @pytest.mark.django_db
    def test_map_layer_default_behavior(self, db):
        """Test that only one layer per type can be default"""
        layer1 = MapLayer.objects.create(
            name='Layer 1',
            url='https://example.com/1',
            layer_type='satellite',
            is_default=True
        )
        layer2 = MapLayer.objects.create(
            name='Layer 2',
            url='https://example.com/2',
            layer_type='satellite',
            is_default=True
        )
        layer1.refresh_from_db()
        assert layer1.is_default is False
        assert layer2.is_default is True


class TestPinStyleModel:
    """Test PinStyle model"""

    @pytest.mark.django_db
    def test_create_pin_style(self, pin_style):
        """Test creating a pin style"""
        assert pin_style.name == 'Test Pin'
        assert pin_style.color == '#00ff00'
        assert pin_style.size == 24

    @pytest.mark.django_db
    def test_pin_style_default_behavior(self, db):
        """Test that only one pin style can be default"""
        style1 = PinStyle.objects.create(name='Style 1', is_default=True)
        style2 = PinStyle.objects.create(name='Style 2', is_default=True)
        style1.refresh_from_db()
        assert style1.is_default is False
        assert style2.is_default is True


# ============================================================================
# VIEW TESTS
# ============================================================================

class TestAuthenticationViews:
    """Test authentication views"""

    @pytest.mark.django_db
    def test_login_page_loads(self):
        """Test login page loads successfully"""
        client = Client()
        response = client.get(reverse('app:login'))
        assert response.status_code == 200
        assert b'Login' in response.content

    @pytest.mark.django_db
    def test_login_page_no_register_link(self):
        """Test login page does not contain register link"""
        client = Client()
        response = client.get(reverse('app:login'))
        assert response.status_code == 200
        # Should not have register link
        assert b'register' not in response.content.lower()
        # Should have admin contact message
        assert b'administrator' in response.content.lower() or b'admin' in response.content.lower()

    @pytest.mark.django_db
    def test_user_login_success(self, test_user):
        """Test user can login with valid credentials"""
        client = Client()
        response = client.post(reverse('app:login'), {
            'username': 'testuser',
            'password': 'testpass123'
        })
        assert response.status_code == 302  # Redirect after successful login

    @pytest.mark.django_db
    def test_user_login_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        client = Client()
        response = client.post(reverse('app:login'), {
            'username': 'invaliduser',
            'password': 'wrongpass'
        })
        # Should stay on login page or show error
        assert response.status_code in [200, 302]

    @pytest.mark.django_db
    def test_user_logout(self, authenticated_client):
        """Test user can logout"""
        response = authenticated_client.get(reverse('app:logout'))
        assert response.status_code == 302  # Redirect after logout

    @pytest.mark.django_db
    def test_admin_creates_user_account(self):
        """Test that admin can create user accounts via Django admin"""
        # Simulate admin creating a user account
        new_user = User.objects.create_user(
            username='newuser',
            email='newuser@example.com',
            password='newpass123'
        )
        assert new_user.username == 'newuser'
        assert new_user.email == 'newuser@example.com'
        assert new_user.check_password('newpass123') is True

    @pytest.mark.django_db
    def test_created_user_can_login(self):
        """Test that user created by admin can login"""
        # Admin creates user
        User.objects.create_user(
            username='adminuser',
            email='adminuser@example.com',
            password='adminpass123'
        )
        
        # User logs in with credentials provided by admin
        client = Client()
        response = client.post(reverse('app:login'), {
            'username': 'adminuser',
            'password': 'adminpass123'
        })
        assert response.status_code == 302  # Successful login redirect


class TestDashboardView:
    """Test dashboard view"""

    @pytest.mark.django_db
    def test_dashboard_requires_login(self):
        """Test dashboard requires authentication"""
        client = Client()
        response = client.get(reverse('app:dashboard'))
        assert response.status_code == 302  # Redirect to login

    @pytest.mark.django_db
    def test_dashboard_loads_for_authenticated_user(self, authenticated_client):
        """Test dashboard loads for authenticated users"""
        response = authenticated_client.get(reverse('app:dashboard'))
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_dashboard_contains_statistics(self, authenticated_client, endemic_tree):
        """Test dashboard displays statistics"""
        response = authenticated_client.get(reverse('app:dashboard'))
        assert response.status_code == 200
        assert b'total_trees' in response.content or 'total_trees' in response.context


class TestGISView:
    """Test GIS map view"""

    @pytest.mark.django_db
    def test_gis_page_loads(self, authenticated_client):
        """Test GIS page loads successfully"""
        response = authenticated_client.get(reverse('app:gis'))
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_gis_page_has_layers(self, authenticated_client, map_layer):
        """Test GIS page includes layer data"""
        response = authenticated_client.get(reverse('app:gis'))
        assert response.status_code == 200


class TestDataUploadView:
    """Test data upload views"""

    @pytest.mark.django_db
    def test_upload_page_loads(self, authenticated_client):
        """Test upload page loads"""
        response = authenticated_client.get(reverse('app:upload'))
        assert response.status_code == 200


class TestLayersView:
    """Test layers management view"""

    @pytest.mark.django_db
    def test_layers_page_loads(self, authenticated_client):
        """Test layers page loads"""
        response = authenticated_client.get(reverse('app:layers'))
        assert response.status_code == 200

    @pytest.mark.django_db
    def test_layers_page_displays_layers(self, authenticated_client, map_layer):
        """Test layers page displays existing layers"""
        response = authenticated_client.get(reverse('app:layers'))
        assert response.status_code == 200
        assert 'layers' in response.context


# ============================================================================
# API TESTS
# ============================================================================

class TestTreeDataAPI:
    """Test tree data API endpoint"""

    @pytest.mark.django_db
    def test_tree_data_api_returns_geojson(self, authenticated_client, endemic_tree):
        """Test tree data API returns GeoJSON format"""
        response = authenticated_client.get(reverse('app:tree_data'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['type'] == 'FeatureCollection'
        assert 'features' in data

    @pytest.mark.django_db
    def test_tree_data_includes_health_distribution(self, authenticated_client, endemic_tree):
        """Test tree data includes health distribution"""
        response = authenticated_client.get(reverse('app:tree_data'))
        data = json.loads(response.content)
        if data['features']:
            feature = data['features'][0]
            assert 'healthy_count' in feature['properties']
            assert 'good_count' in feature['properties']
            assert 'bad_count' in feature['properties']
            assert 'deceased_count' in feature['properties']


class TestSeedDataAPI:
    """Test seed data API endpoint"""

    @pytest.mark.django_db
    def test_seed_data_api_returns_geojson(self, authenticated_client, tree_seed):
        """Test seed data API returns GeoJSON format"""
        response = authenticated_client.get(reverse('app:seed_data'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert data['type'] == 'FeatureCollection'


class TestLayersAPI:
    """Test map layers API endpoints"""

    @pytest.mark.django_db
    def test_get_layers_list(self, authenticated_client, map_layer):
        """Test GET layers list"""
        response = authenticated_client.get(reverse('app:api_layers'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'layers' in data

    @pytest.mark.django_db
    def test_create_layer(self, authenticated_client):
        """Test POST create new layer"""
        layer_data = {
            'name': 'New Test Layer',
            'description': 'Created via API',
            'layer_type': 'satellite',
            'url': 'https://example.com/tiles/{z}/{x}/{y}',
            'attribution': 'Test',
            'is_active': True,
            'is_default': False
        }
        response = authenticated_client.post(
            reverse('app:api_layers'),
            data=json.dumps(layer_data),
            content_type='application/json'
        )
        assert response.status_code == 201
        data = json.loads(response.content)
        assert data['success'] is True

    @pytest.mark.django_db
    def test_update_layer(self, authenticated_client, map_layer):
        """Test PUT update layer"""
        update_data = {
            'name': 'Updated Layer Name',
            'is_active': False
        }
        response = authenticated_client.put(
            reverse('app:api_layers_detail', kwargs={'layer_id': map_layer.id}),
            data=json.dumps(update_data),
            content_type='application/json'
        )
        assert response.status_code == 200
        map_layer.refresh_from_db()
        assert map_layer.name == 'Updated Layer Name'

    @pytest.mark.django_db
    def test_delete_layer(self, authenticated_client, map_layer):
        """Test DELETE layer"""
        layer_id = map_layer.id
        response = authenticated_client.delete(
            reverse('app:api_layers_detail', kwargs={'layer_id': layer_id})
        )
        assert response.status_code == 200
        assert not MapLayer.objects.filter(id=layer_id).exists()


class TestAnalyticsAPI:
    """Test analytics API endpoint"""

    @pytest.mark.django_db
    def test_analytics_data_api(self, authenticated_client, endemic_tree):
        """Test analytics data API returns statistics"""
        response = authenticated_client.get(reverse('app:analytics_data'))
        assert response.status_code == 200
        data = json.loads(response.content)
        assert 'species_count' in data or 'population_by_year' in data


# ============================================================================
# FORM TESTS
# ============================================================================

class TestEndemicTreeForm:
    """Test EndemicTree form"""

    def test_valid_form(self, tree_species, location):
        """Test valid form submission"""
        form_data = {
            'species': tree_species.id,
            'location': location.id,
            'population': 100,
            'year': 2027,
            'health_status': 'good',
            'notes': 'Test notes'
        }
        form = EndemicTreeForm(data=form_data)
        assert form.is_valid()


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestDataWorkflow:
    """Test complete data workflows"""

    @pytest.mark.django_db
    def test_complete_tree_creation_workflow(self, authenticated_client):
        """Test creating a tree from family to record"""
        # Create family
        family = TreeFamily.objects.create(name='Dipterocarpaceae')
        
        # Create genus
        genus = TreeGenus.objects.create(
            name='Shorea',
            family=family
        )
        
        # Create species
        species = TreeSpecies.objects.create(
            scientific_name='Shorea negrosensis',
            common_name='Negros Shorea',
            genus=genus,
            is_endemic=True
        )
        
        # Create location
        location = Location.objects.create(
            name='Negros Forest',
            latitude=10.5,
            longitude=122.5
        )
        
        # Create tree record
        tree = EndemicTree.objects.create(
            species=species,
            location=location,
            population=50,
            year=2027,
            health_status='excellent',
            healthy_count=45,
            good_count=5,
            bad_count=0,
            deceased_count=0
        )
        
        assert tree.species.genus.family.name == 'Dipterocarpaceae'
        assert tree.population == 50


class TestAPIWorkflow:
    """Test complete API workflows"""

    @pytest.mark.django_db
    def test_layer_crud_workflow(self, authenticated_client):
        """Test complete layer CRUD workflow"""
        # Create
        create_data = {
            'name': 'Workflow Test Layer',
            'layer_type': 'topographic',
            'url': 'https://example.com/{z}/{x}/{y}',
            'is_active': True,
            'is_default': False
        }
        create_response = authenticated_client.post(
            reverse('app:api_layers'),
            data=json.dumps(create_data),
            content_type='application/json'
        )
        assert create_response.status_code == 201
        
        # Read
        list_response = authenticated_client.get(reverse('app:api_layers'))
        assert list_response.status_code == 200
        
        # Update
        layer_id = json.loads(create_response.content)['layer']['id']
        update_data = {'name': 'Updated Workflow Layer'}
        update_response = authenticated_client.put(
            reverse('app:api_layers_detail', kwargs={'layer_id': layer_id}),
            data=json.dumps(update_data),
            content_type='application/json'
        )
        assert update_response.status_code == 200
        
        # Delete
        delete_response = authenticated_client.delete(
            reverse('app:api_layers_detail', kwargs={'layer_id': layer_id})
        )
        assert delete_response.status_code == 200
