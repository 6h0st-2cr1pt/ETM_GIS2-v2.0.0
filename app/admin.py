from django.contrib import admin
from .models import (
    EndemicTree, MapLayer, UserSetting, TreeFamily, 
    TreeGenus, TreeSpecies, Location, PinStyle, TreeSeed
)

@admin.register(TreeFamily)
class TreeFamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(TreeGenus)
class TreeGenusAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'description')
    list_filter = ('family',)
    search_fields = ('name',)

@admin.register(TreeSpecies)
class TreeSpeciesAdmin(admin.ModelAdmin):
    list_display = ('common_name', 'scientific_name', 'genus', 'is_endemic', 'conservation_status')
    list_filter = ('genus__family', 'genus', 'is_endemic')
    search_fields = ('common_name', 'scientific_name')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude', 'elevation')
    search_fields = ('name',)

@admin.register(PinStyle)
class PinStyleAdmin(admin.ModelAdmin):
    list_display = ('name', 'icon_class', 'color', 'size', 'is_default')
    list_filter = ('is_default',)
    search_fields = ('name',)

@admin.register(EndemicTree)
class EndemicTreeAdmin(admin.ModelAdmin):
    list_display = ('species', 'location', 'population', 'year')
    list_filter = ('species__genus__family', 'species', 'year', 'location')
    search_fields = ('species__common_name', 'species__scientific_name', 'location__name')

@admin.register(TreeSeed)
class TreeSeedAdmin(admin.ModelAdmin):
    list_display = ('species', 'location', 'quantity', 'planting_date', 'germination_status', 'survival_rate')
    list_filter = ('species__genus__family', 'species', 'planting_date', 'germination_status', 'location')
    search_fields = ('species__common_name', 'species__scientific_name', 'location__name')
    date_hierarchy = 'planting_date'

@admin.register(MapLayer)
class MapLayerAdmin(admin.ModelAdmin):
    list_display = ('name', 'layer_type', 'is_active', 'is_default')
    list_filter = ('layer_type', 'is_active', 'is_default')
    search_fields = ('name', 'description')

@admin.register(UserSetting)
class UserSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'value')
    search_fields = ('key',)
