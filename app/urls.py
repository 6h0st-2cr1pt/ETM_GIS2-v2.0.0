from django.urls import path
from . import views

app_name = 'app'

urlpatterns = [
    path('', views.splash_screen, name='splash'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('gis/', views.gis, name='gis'),
    path('analytics/', views.analytics, name='analytics'),
    path('layers/', views.layers, name='layers'),
    path('datasets/', views.datasets, name='datasets'),
    path('upload/', views.upload_data, name='upload'),
    path('settings/', views.settings, name='settings'),
    path('history/', views.history, name='history'),
    path('reports/', views.reports, name='reports'),

    # Authentication URLs
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # API endpoints
    path('api/tree-data/', views.tree_data, name='tree_data'),
    path('api/seed-data/', views.seed_data, name='seed_data'),
    path('api/filter-trees/<int:species_id>/', views.filter_trees, name='filter_trees'),
    path('api/analytics-data/', views.analytics_data, name='analytics_data'),
    path('api/analytics-by-area/', views.api_analytics_by_area, name='api_analytics_by_area'),
    path('api/population-by-year/', views.api_population_by_year, name='api_population_by_year'),
    path('api/low-population-trees/', views.api_low_population_trees, name='api_low_population_trees'),
    path('api/analytics/address-species/', views.api_analytics_address_species, name='api_analytics_address_species'),
    path('api/analytics/health-by-species/', views.api_analytics_health_by_species, name='api_analytics_health_by_species'),
    path('api/analytics/height-diameter/', views.api_analytics_height_diameter, name='api_analytics_height_diameter'),
    path('api/analytics/tree-coordinates/', views.api_analytics_tree_coordinates, name='api_analytics_tree_coordinates'),
    path('api/dashboard-data/', views.api_dashboard_data, name='api_dashboard_data'),
    # Map layer APIs
    path('api/layers/', views.api_layers, name='api_layers'),
    path('api/layers/<int:layer_id>/', views.api_layers_detail, name='api_layers_detail'),
    path('species-image/<int:species_id>/', views.species_image, name='species_image'),
    path('api/set-theme/', views.set_theme, name='set_theme'),
    path('api/set-map-style/', views.set_map_style, name='set_map_style'),
    path('api/set-pin-style/', views.set_pin_style, name='set_pin_style'),
    path('api/save-setting/', views.save_setting, name='save_setting'),
    path('generate-report/', views.generate_report, name='generate_report'),
    path('edit-tree/<uuid:tree_id>/', views.edit_tree, name='edit_tree'),
    path('delete-tree/<uuid:tree_id>/', views.delete_tree, name='delete_tree'),
    path('delete-trees-bulk/', views.delete_trees_bulk, name='delete_trees_bulk'),
    path('delete-all-trees/', views.delete_all_trees, name='delete_all_trees'),
    path('delete-seed/<uuid:seed_id>/', views.delete_seed, name='delete_seed'),
    path('delete-seeds-bulk/', views.delete_seeds_bulk, name='delete_seeds_bulk'),
    path('delete-all-seeds/', views.delete_all_seeds, name='delete_all_seeds'),
    path('edit-seed/<uuid:seed_id>/', views.edit_seed, name='edit_seed'),
    path('api/species-list/', views.api_species_list, name='api_species_list'),
    path('api/locations-list/', views.api_locations_list, name='api_locations_list'),
    path('api/endemic-trees-list/', views.api_endemic_trees_list, name='api_endemic_trees_list'),
    path('api/geocode/', views.api_geocode, name='api_geocode'),
    path('api/csv-upload-progress/', views.api_csv_upload_progress, name='api_csv_upload_progress'),
    path('upload-species-images/', views.upload_species_images, name='upload_species_images'),
    path('api/upload-species-image/', views.upload_species_image_api, name='upload_species_image_api'),
    # Taxonomy management
    path('api/add-taxonomy/', views.add_taxonomy, name='add_taxonomy'),
    path('api/list-taxonomy/', views.list_taxonomy, name='list_taxonomy'),
    path('api/update-taxonomy/<int:taxonomy_id>/', views.update_taxonomy, name='update_taxonomy'),
    path('api/delete-taxonomy/<int:taxonomy_id>/', views.delete_taxonomy, name='delete_taxonomy'),
]
