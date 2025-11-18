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
    path('about/', views.about, name='about'),
    path('reports/', views.reports, name='reports'),
    path('new-data/', views.new_data, name='new_data'),

    # Authentication URLs
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # API endpoints
    path('api/tree-data/', views.tree_data, name='tree_data'),
    path('api/seed-data/', views.seed_data, name='seed_data'),
    path('api/filter-trees/<int:species_id>/', views.filter_trees, name='filter_trees'),
    path('api/analytics-data/', views.analytics_data, name='analytics_data'),
    # Map layer APIs
    path('api/layers/', views.api_layers, name='api_layers'),
    path('api/layers/<int:layer_id>/', views.api_layers_detail, name='api_layers_detail'),
    path('api/supabase-data/', views.api_supabase_data, name='api_supabase_data'),
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
]
