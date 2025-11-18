#!/usr/bin/env python
"""
Quick script to check layers in database
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'endemic_trees.settings')
django.setup()

from app.models import MapLayer

# Check layers
layers = MapLayer.objects.all()
print(f"Total layers in database: {layers.count()}")

if layers.exists():
    print("\nLayers found:")
    for layer in layers:
        print(f"- {layer.name} (ID: {layer.id})")
        print(f"  Type: {layer.layer_type}")
        print(f"  Active: {layer.is_active}")
        print(f"  Default: {layer.is_default}")
        print(f"  URL: {layer.url}")
        print()
else:
    print("No layers found in database.")
    print("\nTo create a test layer, go to the Layer Control page and add one.")
