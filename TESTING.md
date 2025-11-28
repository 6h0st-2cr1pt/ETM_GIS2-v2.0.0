# Testing Guide for ETM GIS2

This guide explains how to run and write tests for the Endemic Trees Management System using pytest.

## Installation

First, install the testing dependencies:

```bash
pip install -r requirements.txt
```

## Running Tests

### Run All Tests
```bash
pytest
```

### Run with Coverage Report
```bash
pytest --cov=app --cov-report=html
```

### Run Specific Test File
```bash
pytest app/tests.py
```

### Run Specific Test Class
```bash
pytest app/tests.py::TestTreeFamilyModel
```

### Run Specific Test Function
```bash
pytest app/tests.py::TestTreeFamilyModel::test_create_tree_family
```

### Run Tests by Marker
```bash
# Run only unit tests
pytest -m unit

# Run only API tests
pytest -m api

# Skip slow tests
pytest -m "not slow"
```

### Run Tests in Parallel
```bash
pytest -n auto
```

### Run with Verbose Output
```bash
pytest -v
```

### Run with Output Capture Disabled (see print statements)
```bash
pytest -s
```

## Test Structure

### Test Organization

Tests are organized into the following categories:

1. **Model Tests** - Test database models and their relationships
2. **View Tests** - Test Django views and templates
3. **API Tests** - Test REST API endpoints
4. **Form Tests** - Test form validation
5. **Integration Tests** - Test complete workflows

### Test Coverage

The test suite covers:

- ✅ All database models (TreeFamily, TreeGenus, TreeSpecies, etc.)
- ✅ Authentication (login, logout, registration)
- ✅ Dashboard and analytics views
- ✅ GIS map functionality
- ✅ Layer management (CRUD operations)
- ✅ Data upload and import
- ✅ API endpoints (tree data, seed data, layers)
- ✅ Form validation
- ✅ Complete user workflows

## Writing New Tests

### Basic Test Structure

```python
import pytest
from app.models import YourModel

class TestYourModel:
    """Test YourModel functionality"""
    
    @pytest.mark.django_db
    def test_create_model(self):
        """Test creating a model instance"""
        obj = YourModel.objects.create(name='Test')
        assert obj.name == 'Test'
```

### Using Fixtures

```python
@pytest.fixture
def sample_data(db):
    """Create sample data for testing"""
    return YourModel.objects.create(name='Sample')

def test_with_fixture(sample_data):
    """Test using a fixture"""
    assert sample_data.name == 'Sample'
```

### Testing API Endpoints

```python
@pytest.mark.django_db
def test_api_endpoint(authenticated_client):
    """Test API endpoint"""
    response = authenticated_client.get('/api/endpoint/')
    assert response.status_code == 200
    data = json.loads(response.content)
    assert 'key' in data
```

### Testing Views

```python
@pytest.mark.django_db
def test_view_requires_login():
    """Test view requires authentication"""
    client = Client()
    response = client.get(reverse('app:view_name'))
    assert response.status_code == 302  # Redirect to login
```

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/tests.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.9
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest --cov=app --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Best Practices

1. **Test Isolation** - Each test should be independent
2. **Use Fixtures** - Reuse common test data with fixtures
3. **Descriptive Names** - Test names should describe what they test
4. **One Assert Per Test** - Each test should verify one thing (when possible)
5. **Test Edge Cases** - Don't just test the happy path
6. **Mock External Services** - Mock Supabase and other external APIs
7. **Database Transactions** - Use `@pytest.mark.django_db` for database tests

## Common Test Patterns

### Testing Model Creation
```python
@pytest.mark.django_db
def test_model_creation():
    obj = Model.objects.create(field='value')
    assert obj.field == 'value'
    assert str(obj) == 'expected string'
```

### Testing Model Relationships
```python
@pytest.mark.django_db
def test_model_relationship(parent, child):
    assert child.parent == parent
    assert child in parent.children.all()
```

### Testing API POST
```python
@pytest.mark.django_db
def test_api_create(authenticated_client):
    data = {'name': 'Test'}
    response = authenticated_client.post(
        '/api/endpoint/',
        data=json.dumps(data),
        content_type='application/json'
    )
    assert response.status_code == 201
```

### Testing Form Validation
```python
def test_form_valid():
    form = YourForm(data={'field': 'value'})
    assert form.is_valid()

def test_form_invalid():
    form = YourForm(data={})
    assert not form.is_valid()
    assert 'field' in form.errors
```

## Troubleshooting

### Tests Not Found
- Ensure test files start with `test_` or end with `_test.py`
- Check `pytest.ini` configuration
- Verify test functions start with `test_`

### Database Errors
- Add `@pytest.mark.django_db` decorator
- Check database configuration in `conftest.py`
- Ensure migrations are up to date

### Import Errors
- Verify all dependencies are installed
- Check Python path configuration
- Ensure virtual environment is activated

## Coverage Reports

After running tests with coverage:

```bash
pytest --cov=app --cov-report=html
```

Open the coverage report:
```bash
# Windows
start htmlcov/index.html

# Linux/Mac
open htmlcov/index.html
```

## Test Markers

Available test markers:

- `@pytest.mark.slow` - Mark slow tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.api` - API tests
- `@pytest.mark.django_db` - Tests requiring database access

## Example Test Run Output

```
========================= test session starts =========================
collected 50 items

app/tests.py::TestTreeFamilyModel::test_create_tree_family PASSED [ 2%]
app/tests.py::TestTreeGenusModel::test_create_tree_genus PASSED [ 4%]
...
app/tests.py::TestLayersAPI::test_delete_layer PASSED [100%]

---------- coverage: platform win32, python 3.9.0 ----------
Name                Stmts   Miss  Cover   Missing
-------------------------------------------------
app/models.py         150     10    93%   45-48, 120-125
app/views.py          300     25    92%   200-210, 350-360
app/forms.py           50      5    90%   30-35
-------------------------------------------------
TOTAL                 500     40    92%

========================= 50 passed in 5.23s ==========================
```

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)
- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)

---

**Happy Testing! 🧪**
