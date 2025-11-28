"""Pytest configuration and shared fixtures for Endemic Trees Management System

This module provides shared fixtures and configuration for all test modules.
"""

import pytest
import os
import django
from django.conf import settings


# Configure Django settings for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'endemic_trees.settings')


@pytest.fixture(scope='session')
def django_db_setup():
    """Configure test database
    
    Note: Tests use SQLite in-memory database for speed.
    To use PostgreSQL for tests, set USE_POSTGRES_TESTS environment variable.
    """
    from django.conf import settings
    import os
    
    # Use PostgreSQL for tests if explicitly requested, otherwise use SQLite for speed
    if os.getenv('USE_POSTGRES_TESTS', '').lower() == 'true':
        settings.DATABASES['default'] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('TEST_DB_NAME', 'endemic_trees_test'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
            'ATOMIC_REQUESTS': False,
        }
    else:
        settings.DATABASES['default'] = {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
            'ATOMIC_REQUESTS': False,
        }


@pytest.fixture(scope='session')
def django_db_modify_db_settings():
    """Modify database settings for testing"""
    pass


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests automatically"""
    pass


@pytest.fixture(scope='function', autouse=True)
def clear_database(db):
    """Clear database before each test to avoid unique constraint errors"""
    from app.models import (
        TreeFamily, TreeGenus, TreeSpecies, Location,
        EndemicTree, TreeSeed, MapLayer, PinStyle, UserSetting
    )
    from django.contrib.auth.models import User
    
    # Delete all records in reverse dependency order
    EndemicTree.objects.all().delete()
    TreeSeed.objects.all().delete()
    TreeSpecies.objects.all().delete()
    TreeGenus.objects.all().delete()
    TreeFamily.objects.all().delete()
    Location.objects.all().delete()
    MapLayer.objects.all().delete()
    PinStyle.objects.all().delete()
    UserSetting.objects.all().delete()
    User.objects.all().delete()


@pytest.fixture
def api_client():
    """Create an API client for testing REST endpoints"""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture(scope='function')
def mock_supabase():
    """Mock Supabase client for testing"""
    from unittest.mock import Mock
    mock_client = Mock()
    mock_client.table.return_value.select.return_value.execute.return_value.data = []
    return mock_client
