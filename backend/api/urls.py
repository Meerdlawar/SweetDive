from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet, basename='customer')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'allergens', views.AllergenInfoViewSet, basename='allergen')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/me/', views.CurrentUserView.as_view(), name='current-user'),
    
    # Dashboard stats
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    
    # Include router URLs
    path('', include(router.urls)),
]
