# ETM GIS2 - Endemic Trees Management System

A Django-based Geographic Information System (GIS) for managing and visualizing endemic trees data. This system provides a comprehensive platform for tracking, analyzing, and visualizing endemic tree species data with integrated mapping capabilities.

## Features

- Interactive GIS mapping using django-leaflet
- Data visualization with matplotlib and seaborn
- Data import/export functionality
- RESTful API support
- Responsive web interface with Bootstrap 5
- Data filtering and tabular display
- Debug toolbar for development
- Excel file support

## Prerequisites

- Python 3.x
- Virtual Environment (venv)
- pip (Python package installer)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd ETM_GIS2-main
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python -m venv .venv
source .venv/bin/activate
```

3. Install required packages:
```bash
pip install -r requirements.txt
```

4. Run database migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

## Running the Application

1. Activate the virtual environment (if not already activated):
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

2. Start the development server:
```bash
python manage.py runserver
```

3. Access the application:
   - Open your web browser
   - Navigate to http://127.0.0.1:8000/

## Project Structure

- `app/` - Main application directory
- `components/` - Reusable components
- `static/` - Static files (CSS, JavaScript, images)
- `endemic_trees/` - Project configuration
- `manage.py` - Django management script

## Dependencies

- Django - Web framework
- django-leaflet - GIS mapping
- pandas & numpy - Data manipulation
- matplotlib & seaborn - Data visualization
- django-crispy-forms & crispy-bootstrap5 - Form styling
- django-filter - Data filtering
- django-tables2 - Tabular data display
- django-import-export - Data import/export
- djangorestframework - REST API support
- openpyxl - Excel file support
- whitenoise - Static file serving

## Development

For development purposes, the application includes:
- Django Debug Toolbar for debugging
- Development server with auto-reload
- Comprehensive error reporting

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

Copyright © 2025 Jonald Sabordo

## Note

This is a development server. For production deployment, please refer to Django's deployment documentation: https://docs.djangoproject.com/en/5.2/howto/deployment/
"# ETM_GIS2-main-master" 
"# ETM_GIS2-main-master" 
"# ETM_GIS2-main-master" 
"# ETM_GIS2-main-master" 
