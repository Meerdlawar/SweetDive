from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.db.models import Q
from django.contrib.auth import login, logout

from .models import Staff, Customer, Product, Order, OrderProduct, AllergenInfo
from .serializers import (
    StaffSerializer, StaffLoginSerializer, StaffRegistrationSerializer,
    CustomerSerializer, CustomerListSerializer,
    ProductSerializer, ProductListSerializer,
    OrderSerializer, OrderCreateSerializer, OrderProductSerializer,
    AllergenInfoSerializer
)


# ==================== Authentication Views ====================

class LoginView(generics.GenericAPIView):
    """Handle staff login"""
    serializer_class = StaffLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'success': True,
                'message': 'Login successful',
                'token': token.key,
                'user': StaffSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response({
            'success': False,
            'message': 'Invalid credentials',
            'errors': serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(generics.GenericAPIView):
    """Handle staff logout"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({
            'success': True,
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    """Handle staff registration"""
    serializer_class = StaffRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'success': True,
                'message': 'Registration successful',
                'token': token.key,
                'user': StaffSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(generics.RetrieveAPIView):
    """Get current authenticated user"""
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# ==================== Customer Views ====================

class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer CRUD operations"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        search = self.request.query_params.get('search', None)
        
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def list_simple(self, request):
        """Get simplified customer list for dropdowns"""
        customers = Customer.objects.all()
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)


# ==================== Product Views ====================

class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD operations"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Product.objects.all()
        search = self.request.query_params.get('search', None)
        product_type = self.request.query_params.get('type', None)
        suitability = self.request.query_params.get('suitability', None)
        active_only = self.request.query_params.get('active_only', None)
        
        if search:
            queryset = queryset.filter(
                Q(product_name__icontains=search) |
                Q(product_type__icontains=search) |
                Q(product_suitability__icontains=search)
            )
        
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        
        if suitability:
            queryset = queryset.filter(product_suitability=suitability)
        
        if active_only and active_only.lower() == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def list_simple(self, request):
        """Get simplified product list for dropdowns"""
        products = Product.objects.filter(is_active=True)
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available product types"""
        return Response(dict(Product.PRODUCT_TYPES))
    
    @action(detail=False, methods=['get'])
    def suitabilities(self, request):
        """Get available suitability options"""
        return Response(dict(Product.SUITABILITY_CHOICES))


# ==================== Order Views ====================

class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order CRUD operations"""
    queryset = Order.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_queryset(self):
        queryset = Order.objects.select_related('customer').prefetch_related('order_products__product')
        
        customer_id = self.request.query_params.get('customer', None)
        status_filter = self.request.query_params.get('status', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if date_from:
            queryset = queryset.filter(order_placed__gte=date_from)
        
        if date_to:
            queryset = queryset.filter(order_placed__lte=date_to)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """Get products for a specific order"""
        order = self.get_object()
        order_products = order.order_products.all()
        serializer = OrderProductSerializer(order_products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_product(self, request, pk=None):
        """Add a product to an order"""
        order = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        try:
            product = Product.objects.get(pk=product_id)
            order_product, created = OrderProduct.objects.get_or_create(
                order=order,
                product=product,
                defaults={'quantity': quantity, 'unit_price': product.product_price}
            )
            
            if not created:
                order_product.quantity += quantity
                order_product.save()
            
            # Recalculate total
            order.calculate_total()
            order.save()
            
            return Response({
                'success': True,
                'message': 'Product added to order'
            })
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_product(self, request, pk=None):
        """Remove a product from an order"""
        order = self.get_object()
        product_id = request.data.get('product_id')
        
        try:
            order_product = OrderProduct.objects.get(order=order, product_id=product_id)
            order_product.delete()
            
            # Recalculate total
            order.calculate_total()
            order.save()
            
            return Response({
                'success': True,
                'message': 'Product removed from order'
            })
        except OrderProduct.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Product not found in order'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def payment_methods(self, request):
        """Get available payment methods"""
        return Response(dict(Order.PAYMENT_METHODS))
    
    @action(detail=False, methods=['get'])
    def statuses(self, request):
        """Get available order statuses"""
        return Response(dict(Order.ORDER_STATUS))


# ==================== Allergen Views ====================

class AllergenInfoViewSet(viewsets.ModelViewSet):
    """ViewSet for AllergenInfo CRUD operations"""
    queryset = AllergenInfo.objects.all()
    serializer_class = AllergenInfoSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available allergen types"""
        return Response(dict(AllergenInfo.ALLERGEN_TYPES))
    
    @action(detail=False, methods=['get'])
    def all_info(self, request):
        """Get all allergen information formatted for display"""
        allergens = AllergenInfo.objects.prefetch_related('products').all()
        data = []
        for allergen in allergens:
            data.append({
                'name': allergen.get_allergen_name_display(),
                'description': allergen.description,
                'products': [p.product_name for p in allergen.products.all()]
            })
        return Response(data)


# ==================== Dashboard/Stats Views ====================

@api_view(['GET'])
def dashboard_stats(request):
    """Get dashboard statistics"""
    if not request.user.is_authenticated:
        return Response({'error': 'Not authenticated'}, status=401)
    
    total_customers = Customer.objects.count()
    total_products = Product.objects.filter(is_active=True).count()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    
    recent_orders = Order.objects.select_related('customer').order_by('-created_at')[:5]
    recent_orders_data = OrderSerializer(recent_orders, many=True).data
    
    return Response({
        'total_customers': total_customers,
        'total_products': total_products,
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'recent_orders': recent_orders_data
    })
