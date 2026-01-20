from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Staff, Customer, Product, Order, OrderProduct, AllergenInfo


class StaffSerializer(serializers.ModelSerializer):
    """Serializer for Staff model"""
    class Meta:
        model = Staff
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']


class StaffLoginSerializer(serializers.Serializer):
    """Serializer for staff login"""
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(max_length=100, write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("User account is disabled.")
                data['user'] = user
            else:
                raise serializers.ValidationError("Invalid username or password.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")
        
        return data


class StaffRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for staff registration"""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = Staff
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = Staff.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    class Meta:
        model = Customer
        fields = [
            'customer_id', 'prefix', 'first_name', 'last_name', 
            'phone_number', 'email', 'subfix', 'full_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['customer_id', 'full_name', 'created_at', 'updated_at']


class CustomerListSerializer(serializers.ModelSerializer):
    """Simplified serializer for customer dropdowns/lists"""
    class Meta:
        model = Customer
        fields = ['customer_id', 'full_name']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    product_suitability_display = serializers.CharField(source='get_product_suitability_display', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'product_id', 'product_name', 'product_price', 
            'product_type', 'product_type_display',
            'product_suitability', 'product_suitability_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['product_id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified serializer for product dropdowns/lists"""
    class Meta:
        model = Product
        fields = ['product_id', 'product_name', 'product_price']


class OrderProductSerializer(serializers.ModelSerializer):
    """Serializer for OrderProduct (junction table)"""
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_price = serializers.DecimalField(
        source='product.product_price', 
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    product_type = serializers.CharField(source='product.product_type', read_only=True)
    product_suitability = serializers.CharField(source='product.product_suitability', read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderProduct
        fields = [
            'order_product_id', 'product', 'product_name', 
            'product_price', 'product_type', 'product_suitability',
            'quantity', 'unit_price', 'line_total'
        ]
        read_only_fields = ['order_product_id', 'line_total']


class OrderProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating OrderProduct"""
    class Meta:
        model = OrderProduct
        fields = ['product', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model with nested OrderProducts"""
    order_products = OrderProductSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    method_of_payment_display = serializers.CharField(source='get_method_of_payment_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'order_id', 'customer', 'customer_name', 'total_price',
            'method_of_payment', 'method_of_payment_display',
            'order_placed', 'order_due', 'comments',
            'status', 'status_display', 'order_products',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['order_id', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Orders with products"""
    products = OrderProductCreateSerializer(many=True, write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'customer', 'method_of_payment', 'order_placed', 
            'order_due', 'comments', 'status', 'products'
        ]
    
    def create(self, validated_data):
        products_data = validated_data.pop('products')
        order = Order.objects.create(**validated_data)
        
        total = 0
        for product_data in products_data:
            product = product_data['product']
            quantity = product_data.get('quantity', 1)
            unit_price = product.product_price
            OrderProduct.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=unit_price
            )
            total += unit_price * quantity
        
        order.total_price = total
        order.save()
        
        return order
    
    def update(self, instance, validated_data):
        products_data = validated_data.pop('products', None)
        
        # Update order fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if products_data is not None:
            # Remove existing order products
            instance.order_products.all().delete()
            
            # Add new products
            total = 0
            for product_data in products_data:
                product = product_data['product']
                quantity = product_data.get('quantity', 1)
                unit_price = product.product_price
                OrderProduct.objects.create(
                    order=instance,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price
                )
                total += unit_price * quantity
            
            instance.total_price = total
        
        instance.save()
        return instance


class AllergenInfoSerializer(serializers.ModelSerializer):
    """Serializer for AllergenInfo model"""
    allergen_name_display = serializers.CharField(source='get_allergen_name_display', read_only=True)
    products = ProductListSerializer(many=True, read_only=True)
    product_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Product.objects.all(),
        source='products'
    )
    
    class Meta:
        model = AllergenInfo
        fields = [
            'allergen_id', 'allergen_name', 'allergen_name_display',
            'description', 'products', 'product_ids'
        ]
        read_only_fields = ['allergen_id']
