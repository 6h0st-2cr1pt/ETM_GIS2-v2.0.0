from .models import UserSetting

def theme_context(request):
    """
    Adds theme settings to the context of all templates
    """
    try:
        theme = UserSetting.objects.get(key='theme').value
    except UserSetting.DoesNotExist:
        # Default to dark theme
        theme = 'dark'
    
    return {
        'theme': theme,
    }
