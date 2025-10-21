# Seed Planting Guide - Endemic Trees GIS

## Overview
The seed planting functionality allows you to record and track the germination progress of newly planted tree seeds. This data is displayed on the GIS map with color-coded markers based on germination status.

## How to Use Seed Planting

### 1. Access the Upload Page
- Navigate to `http://127.0.0.1:8000/upload/`
- Click on the "Seed Planting" tab

### 2. Fill Out the Seed Planting Form
The form includes the following fields:

#### Basic Information
- **Common Name**: The common name of the tree species
- **Scientific Name**: The scientific name of the tree species
- **Family**: Select from existing families in the database
- **Genus**: Select from existing genera (filtered by family)

#### Planting Details
- **Quantity**: Number of seeds planted
- **Planting Date**: Date when seeds were planted
- **Germination Status**: Current status of the seeds
  - Not Germinated (Brown)
  - Germinating (Yellow-green)
  - Partially Germinated (Lime green)
  - Fully Germinated (Forest green)
  - Failed (Red-brown)

#### Optional Information
- **Germination Date**: Date when germination was first observed
- **Survival Rate**: Percentage of seeds that survived (0-100%)
- **Expected Maturity Date**: Expected date when trees will reach maturity
- **Latitude/Longitude**: GPS coordinates of the planting location
- **Notes**: Additional observations or comments

### 3. Submit the Form
- Click "Submit Seed Planting" to save the record
- You'll be redirected to the GIS map to see your new seed planting

## Viewing Seed Data on the GIS Map

### 1. Access the GIS Map
- Navigate to `http://127.0.0.1:8000/gis/`

### 2. Seed Markers
- Seed plantings are displayed as diamond-shaped markers
- Colors indicate germination status:
  - 🟫 Brown: Not Germinated
  - 🟨 Yellow-green: Germinating
  - 🟩 Lime green: Partially Germinated
  - 🟦 Forest green: Fully Germinated
  - 🟥 Red-brown: Failed

### 3. Interactive Features
- **Click on markers** to view detailed information
- **Toggle visibility** using the "Planted Seeds" checkbox in the Entity Type control
- **Legend** shows color coding for all seed statuses

### 4. Popup Information
When you click on a seed marker, you'll see:
- Species name and scientific name
- Family and genus
- Quantity planted
- Planting date
- Current germination status
- Germination date (if applicable)
- Survival rate
- Expected maturity date
- Location name
- Notes

## Sample Data
The system includes sample seed planting data for testing:
- Tindalo (Afzelia rhomboidea) - Various locations and statuses
- White Lauan (Shorea contorta) - Urban and forest locations
- Rainbow Eucalyptus (Eucalyptus deglupta) - Mountain area

## Adding Sample Data
To add more sample data for testing, run:
```bash
python manage.py add_sample_seeds
```

## Technical Details

### Database Model
The `TreeSeed` model stores:
- Species information (linked to TreeSpecies)
- Location information (linked to Location)
- Planting details (quantity, dates)
- Germination tracking (status, dates)
- Survival metrics
- Notes and observations

### API Endpoints
- `/api/seed-data/` - Returns all seed data in GeoJSON format
- Used by the GIS map to display seed markers

### Color Coding
The system uses consistent color coding for germination status:
- Not Germinated: #8B4513 (Brown)
- Germinating: #9ACD32 (Yellow-green)
- Partially Germinated: #32CD32 (Lime green)
- Fully Germinated: #228B22 (Forest green)
- Failed: #A52A2A (Red-brown)

## Troubleshooting

### Form Issues
- Ensure all required fields are filled
- Check that family and genus selections are valid
- Verify GPS coordinates are in decimal format

### Map Display Issues
- Refresh the page if markers don't appear
- Check browser console for JavaScript errors
- Ensure the "Planted Seeds" checkbox is enabled

### Data Not Saving
- Check Django server logs for errors
- Verify database permissions
- Ensure all required fields are provided

## Future Enhancements
- Bulk seed planting upload via CSV
- Germination status updates over time
- Survival rate tracking and analytics
- Integration with weather data
- Mobile app for field data collection
