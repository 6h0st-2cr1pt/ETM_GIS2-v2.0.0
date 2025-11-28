from django.urls import path
from django.views.generic import RedirectView
from . import views

app_name = 'head'

urlpatterns = [
    # Root URL - redirect to login if not authenticated, otherwise to GIS
    path('', views.head_root, name='root'),
    
    # Main pages
    path('gis/', views.gis, name='gis'),
    path('analytics/', views.analytics, name='analytics'),
    path('layers/', views.layers, name='layers'),
    path('reports/', views.reports, name='reports'),
    path('about/', views.about, name='about'),

    # Authentication URLs
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),

    # API endpoints
    path('api/tree-data/', views.tree_data, name='tree_data'),
    path('api/seed-data/', views.seed_data, name='seed_data'),
    path('api/filter-trees/<int:species_id>/', views.filter_trees, name='filter_trees'),
    path('api/analytics-data/', views.analytics_data, name='analytics_data'),
    path('api/layers/', views.api_layers, name='api_layers'),
    path('api/layers/<int:layer_id>/', views.api_layers_detail, name='api_layers_detail'),
    path('api/species-list/', views.api_species_list, name='api_species_list'),
    path('api/locations-list/', views.api_locations_list, name='api_locations_list'),
    path('generate-report/', views.generate_report, name='generate_report'),
]

