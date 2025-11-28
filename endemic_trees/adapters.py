from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialApp
from django.core.exceptions import MultipleObjectsReturned
from django.contrib.sites.shortcuts import get_current_site


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter that handles MultipleObjectsReturned error
    when multiple SocialApp objects exist for the same provider.
    """
    
    def get_app(self, request, provider, **kwargs):
        """
        Override get_app to handle multiple SocialApp objects.
        Returns the first matching app if multiple exist.
        """
        try:
            return super().get_app(request, provider, **kwargs)
        except MultipleObjectsReturned:
            # If multiple apps exist, get the first one
            # Filter by provider and current site
            try:
                site = get_current_site(request)
                apps = SocialApp.objects.filter(
                    provider=provider,
                    sites=site
                )
                if apps.exists():
                    return apps.first()
            except Exception:
                # If get_current_site fails, continue to fallback
                pass
            
            # Fallback: get any app for this provider
            apps = SocialApp.objects.filter(provider=provider)
            if apps.exists():
                return apps.first()
            
            # If still no app found, raise the original exception
            raise

