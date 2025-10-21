from django import forms
from .models import EndemicTree, UserSetting, PinStyle, TreeSpecies, Location, TreeFamily, TreeGenus


class EndemicTreeForm(forms.Form):
    common_name = forms.CharField(max_length=100, required=True)
    scientific_name = forms.CharField(max_length=100, required=True)
    family = forms.ModelChoiceField(queryset=TreeFamily.objects.all(), required=True)
    genus = forms.ModelChoiceField(queryset=TreeGenus.objects.all(), required=True)
    population = forms.IntegerField(min_value=1, required=True)
    healthy_count = forms.IntegerField(min_value=0, required=True)
    good_count = forms.IntegerField(min_value=0, required=True)
    bad_count = forms.IntegerField(min_value=0, required=True)
    deceased_count = forms.IntegerField(min_value=0, required=True)
    latitude = forms.FloatField(required=True, widget=forms.NumberInput(attrs={'step': '0.000001'}))
    longitude = forms.FloatField(required=True, widget=forms.NumberInput(attrs={'step': '0.000001'}))
    year = forms.IntegerField(required=True)
    notes = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add dynamic filtering for genus based on selected family
        if 'family' in self.data:
            try:
                family_id = int(self.data.get('family'))
                self.fields['genus'].queryset = TreeGenus.objects.filter(family_id=family_id)
            except (ValueError, TypeError):
                pass

    def clean(self):
        cleaned_data = super().clean()
        population = cleaned_data.get('population')
        healthy_count = cleaned_data.get('healthy_count')
        good_count = cleaned_data.get('good_count')
        bad_count = cleaned_data.get('bad_count')
        deceased_count = cleaned_data.get('deceased_count')

        # Validate that health status counts sum to population
        if population and healthy_count is not None and good_count is not None and bad_count is not None and deceased_count is not None:
            total_health = healthy_count + good_count + bad_count + deceased_count
            if total_health != population:
                raise forms.ValidationError(
                    f"Health status counts ({total_health}) must equal the total population ({population}).")

        return cleaned_data


class TreeSeedForm(forms.Form):
    common_name = forms.CharField(max_length=100, required=True)
    scientific_name = forms.CharField(max_length=100, required=True)
    family = forms.ModelChoiceField(queryset=TreeFamily.objects.all(), required=True)
    genus = forms.ModelChoiceField(queryset=TreeGenus.objects.all(), required=True)
    quantity = forms.IntegerField(min_value=1, required=True, help_text="Number of seeds planted")
    planting_date = forms.DateField(required=True, widget=forms.DateInput(attrs={'type': 'date'}))
    germination_status = forms.ChoiceField(choices=[
        ('not_germinated', 'Not Germinated'),
        ('germinating', 'Germinating'),
        ('partially_germinated', 'Partially Germinated'),
        ('fully_germinated', 'Fully Germinated'),
        ('failed', 'Failed to Germinate'),
    ], initial='not_germinated', required=True)
    germination_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'type': 'date'}))
    survival_rate = forms.FloatField(required=False, min_value=0, max_value=100, help_text="Percentage (0-100)")
    expected_maturity_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'type': 'date'}))
    latitude = forms.FloatField(required=True, widget=forms.NumberInput(attrs={'step': '0.000001'}))
    longitude = forms.FloatField(required=True, widget=forms.NumberInput(attrs={'step': '0.000001'}))
    notes = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add dynamic filtering for genus based on selected family
        if 'family' in self.data:
            try:
                family_id = int(self.data.get('family'))
                self.fields['genus'].queryset = TreeGenus.objects.filter(family_id=family_id)
            except (ValueError, TypeError):
                pass


class CSVUploadForm(forms.Form):
    csv_file = forms.FileField(
        label='Select a CSV file',
        help_text='File must be in CSV format with headers: common_name, scientific_name, family, genus, population, healthy_count, good_count, bad_count, deceased_count, latitude, longitude, year, notes'
    )


class ThemeSettingsForm(forms.Form):
    THEME_CHOICES = [
        ('dark', 'Dark Theme'),
        ('light', 'Light Theme'),
        ('nature', 'Nature Theme'),
    ]

    MAP_STYLE_CHOICES = [
        ('dark', 'Dark Map'),
        ('normal', 'Normal Map'),
        ('light', 'Light Map'),
        ('satellite', 'Satellite'),
        ('topographic', 'Topographic'),
    ]

    theme = forms.ChoiceField(choices=THEME_CHOICES, widget=forms.RadioSelect, initial='dark')
    map_style = forms.ChoiceField(choices=MAP_STYLE_CHOICES, widget=forms.RadioSelect, initial='dark')
    pin_style = forms.ModelChoiceField(queryset=PinStyle.objects.all(), empty_label=None)
    enable_animations = forms.BooleanField(required=False, initial=True)
    high_contrast = forms.BooleanField(required=False, initial=False)
    font_size = forms.IntegerField(min_value=80, max_value=120, initial=100)
    default_zoom = forms.IntegerField(min_value=5, max_value=15, initial=9)
    show_scientific_names = forms.BooleanField(required=False, initial=True)


class PinStyleForm(forms.ModelForm):
    class Meta:
        model = PinStyle
        fields = ['name', 'icon_class', 'color', 'size', 'border_color',
                  'border_width', 'background_color', 'is_default']
        widgets = {
            'color': forms.TextInput(attrs={'type': 'color'}),
            'border_color': forms.TextInput(attrs={'type': 'color'}),
            'background_color': forms.TextInput(attrs={'type': 'color'}),
        }


class LocationForm(forms.ModelForm):
    class Meta:
        model = Location
        fields = ['name', 'latitude', 'longitude', 'elevation', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }
