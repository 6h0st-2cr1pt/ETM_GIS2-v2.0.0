# ETM GIS2 - Endemic Trees Management System

A comprehensive Django-based Geographic Information System (GIS) for managing, tracking, and visualizing endemic tree species data. This system provides conservationists and researchers with powerful tools for spatial analysis, data visualization, and population monitoring of endemic trees.

## 🌟 Key Features

### GIS & Mapping
- **Interactive Map Interface** - Real-time visualization using Leaflet.js with multiple base layers
- **Custom Map Layers** - Support for ArcGIS, OpenStreetMap, satellite imagery, and custom tile services
- **Layer Management** - Dynamic layer control with visibility and default settings
- **Location-based Search** - Geocoding support for finding specific locations
- **Multiple Map Styles** - Dark, light, topographic, satellite, and street view options

### Data Management
- **Tree Population Tracking** - Record and monitor tree populations with health status distribution
- **Seed Planting Records** - Track newly planted seeds with germination status and survival rates
- **Health Distribution** - Detailed breakdown: Healthy, Good, Bad, and Deceased counts
- **CSV Import/Export** - Bulk data import with automatic validation
- **Manual Data Entry** - User-friendly forms for individual record creation
- **Supabase Integration** - Real-time data synchronization with external sources

### Visualization & Analytics
- **Interactive Dashboards** - Real-time statistics and key performance indicators
- **Advanced Analytics** - Population trends, growth rates, and species distribution analysis
- **Chart Visualizations** - Using Chart.js, matplotlib, and seaborn
- **Health Status Reports** - Visual representation of tree health across populations
- **Biodiversity Indices** - Shannon and Simpson diversity measurements
- **Spatial Density Analysis** - Heatmaps and clustering visualizations

### Reporting
- **Custom Report Generation** - Species distribution, population trends, health analysis
- **Export Formats** - PDF, CSV, and Excel support
- **Time-based Filtering** - Reports by year, species, location, or custom date ranges
- **Visual Report Elements** - Embedded charts, maps, and data tables

### User Experience
- **Responsive Design** - Bootstrap 5 for mobile-friendly interface
- **Dark/Light Themes** - User-customizable appearance
- **Authentication System** - Secure login, logout, and registration
- **Settings Management** - Personalized preferences and map styles
- **Pin Customization** - Custom marker styles with color and icon options

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Virtual environment support
- Modern web browser (Chrome, Firefox, Edge, Safari)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/ETM_GIS2.git
cd ETM_GIS2
```

### 2. Create and Activate Virtual Environment

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional)
```bash
python manage.py createsuperuser
```

### 6. Add Sample Data (Optional)
```bash
python manage.py add_sample_seeds
```

## 🎮 Running the Application

1. **Activate Virtual Environment** (if not already activated):
   ```bash
   # Windows
   .venv\Scripts\activate
   
   # Linux/Mac
   source .venv/bin/activate
   ```

2. **Start Development Server**:
   ```bash
   python manage.py runserver
   ```

3. **Access the Application**:
   - Open your browser
   - Navigate to: `http://127.0.0.1:8000/`
   - Login with your credentials or register a new account

## 📁 Project Structure

```
ETM_GIS2/
├── app/                          # Main application
│   ├── management/commands/      # Custom management commands
│   │   ├── add_sample_seeds.py  # Seed data generator
│   │   └── fix_health_distribution.py
│   ├── migrations/              # Database migrations
│   ├── templates/app/           # HTML templates
│   │   ├── dashboard.html      # Main dashboard
│   │   ├── gis.html           # GIS map interface
│   │   ├── analytics.html     # Analytics page
│   │   ├── datasets.html      # Data management
│   │   ├── layers.html        # Layer control
│   │   ├── upload.html        # Data upload
│   │   └── ...                # Other templates
│   ├── models.py               # Data models
│   ├── views.py                # View controllers
│   ├── urls.py                 # URL routing
│   ├── forms.py                # Django forms
│   └── supabase_config.py      # Supabase integration
├── static/                      # Static files
│   ├── css/                    # Stylesheets
│   └── js/                     # JavaScript files
│       ├── gis.js             # GIS functionality
│       ├── layers.js          # Layer management
│       ├── analytics.js       # Analytics charts
│       └── ...                # Other scripts
├── endemic_trees/              # Project configuration
│   ├── settings.py            # Django settings
│   ├── urls.py                # Root URL configuration
│   └── wsgi.py                # WSGI configuration
├── manage.py                   # Django management script
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - RESTful API support
- **Supabase** - Real-time database integration

### Frontend
- **Bootstrap 5** - Responsive UI framework
- **Leaflet.js** - Interactive mapping
- **Chart.js** - Data visualization
- **Font Awesome** - Icon library

### Data Processing
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computations
- **Matplotlib & Seaborn** - Statistical visualizations

### Additional Libraries
- **django-crispy-forms** - Enhanced form rendering
- **django-leaflet** - Leaflet integration
- **django-filter** - Advanced filtering
- **django-tables2** - Tabular data display
- **django-import-export** - Data import/export
- **openpyxl** - Excel file processing
- **Pillow** - Image processing
- **whitenoise** - Static file serving

## 📊 Data Models

### Core Models
- **TreeFamily** - Taxonomic family classification
- **TreeGenus** - Genus classification within families
- **TreeSpecies** - Individual species with conservation status
- **EndemicTree** - Population records with health distribution
- **TreeSeed** - Seed planting and germination tracking
- **Location** - Geographic coordinates with elevation
- **MapLayer** - Custom map layer configurations
- **PinStyle** - Customizable map marker styles
- **UserSetting** - User preferences and settings

## 📥 CSV Import Format

### Required Columns
- `common_name` - Common name of the species
- `scientific_name` - Scientific nomenclature
- `family` - Taxonomic family
- `genus` - Taxonomic genus
- `population` - Total population count
- `latitude` - Geographic latitude (decimal degrees)
- `longitude` - Geographic longitude (decimal degrees)
- `year` - Year of observation

### Optional Columns
- `healthy_count` - Number of healthy trees
- `good_count` - Trees in good condition
- `bad_count` - Trees in poor condition
- `deceased_count` - Deceased trees
- `health_status` - Overall status (excellent, very_good, good, poor, very_poor)
- `notes` - Additional observations

### Example CSV
```csv
common_name,scientific_name,family,genus,population,healthy_count,good_count,bad_count,deceased_count,latitude,longitude,year,notes
Philippine Ebony,Diospyros philippinensis,Ebenaceae,Diospyros,86,43,43,0,0,9.930547,122.862854,2027,Observed in year 2027
```

## 🔧 Management Commands

### Add Sample Seed Data
```bash
python manage.py add_sample_seeds
```
Populates the database with sample tree seed planting records.

### Fix Health Distribution
```bash
python manage.py fix_health_distribution
```
Recalculates health distribution for existing records.

## 🎨 Customization

### Map Layers
1. Navigate to **Layer Control** page
2. Click **Add Layer**
3. Configure:
   - **Name**: Display name
   - **Layer Type**: topographic, satellite, street, custom, etc.
   - **Layer URL**: Tile URL or ArcGIS MapServer endpoint
   - **Active**: Show in layer list
   - **Default**: Auto-load on map

### Pin Styles
1. Go to **Settings**
2. Create custom pin styles with:
   - Icon selection
   - Color customization
   - Size adjustment
   - Border styling

## 🐛 Development & Debugging

### Django Debug Toolbar
Enabled in development mode for:
- SQL query analysis
- Request/response inspection
- Template rendering details
- Cache performance

### Console Logging
Extensive logging in JavaScript for:
- Map layer loading
- Data fetching operations
- User interactions
- Error tracking

## 🔐 Security Notes

- **Authentication Required**: Most features require user login
- **CSRF Protection**: Enabled for all POST requests
- **SQL Injection Prevention**: Using Django ORM
- **XSS Protection**: Template auto-escaping enabled

## 🌐 API Endpoints

- `GET /api/tree-data/` - Retrieve tree GeoJSON data
- `GET /api/seed-data/` - Retrieve seed planting data
- `GET /api/layers/` - List custom map layers
- `POST /api/layers/` - Create new layer
- `PUT /api/layers/<id>/` - Update layer
- `DELETE /api/layers/<id>/` - Delete layer
- `GET /api/analytics-data/` - Analytics statistics
- `GET /api/filter-trees/<species_id>/` - Filtered tree data

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Jonald Sabordo**

Copyright © 2025

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📮 Support

For support and questions, please open an issue in the repository.

## ⚠️ Production Deployment

**Important**: This is a development server. For production deployment:

1. Set `DEBUG = False` in settings.py
2. Configure allowed hosts
3. Use a production-grade server (Gunicorn, uWSGI)
4. Set up proper database (PostgreSQL recommended)
5. Configure static file serving
6. Enable HTTPS
7. Set up environment variables for secrets

Refer to [Django Deployment Documentation](https://docs.djangoproject.com/en/stable/howto/deployment/) for detailed instructions.

---

**Built with ❤️ for conservation and environmental research**
