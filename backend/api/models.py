from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal


class Staff(AbstractUser):
    """Staff model for authentication - extends Django's AbstractUser"""
    staff_user = models.CharField(max_length=100, unique=True, blank=True, null=True)
    staff_pass = models.CharField(max_length=100, blank=True, null=True)
    
    class Meta:
        db_table = 'tbl_staffs'
        verbose_name = 'Staff'
        verbose_name_plural = 'Staff Members'
    
    def __str__(self):
        return self.username


class Customer(models.Model):
    """Customer model - stores customer information"""
    customer_id = models.AutoField(primary_key=True)
    prefix = models.CharField(max_length=20, blank=True, null=True, help_text="e.g., Mr., Mrs., Dr.")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(max_length=255, blank=True, null=True)
    subfix = models.CharField(max_length=20, blank=True, null=True, help_text="e.g., Jr., Sr., III")
    full_name = models.CharField(max_length=250, blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tbl_customers'
        ordering = ['last_name', 'first_name']
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
    
    def save(self, *args, **kwargs):
        self.full_name = f"{self.first_name} {self.last_name}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.full_name


class Product(models.Model):
    """Product model - stores product/menu items"""
    PRODUCT_TYPES = [
        ('starter', 'Starter'),
        ('main', 'Main Course'),
        ('dessert', 'Dessert'),
        ('beverage', 'Beverage'),
        ('side', 'Side Dish'),
        ('other', 'Other'),
    ]
    
    SUITABILITY_CHOICES = [
        ('vegetarian', 'Vegetarian'),
        ('vegan', 'Vegan'),
        ('gluten_free', 'Gluten Free'),
        ('dairy_free', 'Dairy Free'),
        ('nut_free', 'Nut Free'),
        ('halal', 'Halal'),
        ('kosher', 'Kosher'),
        ('none', 'None'),
    ]
    
    product_id = models.AutoField(primary_key=True)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    product_type = models.CharField(max_length=50, choices=PRODUCT_TYPES, default='other')
    product_suitability = models.CharField(
        max_length=50, 
        choices=SUITABILITY_CHOICES, 
        default='none',
        help_text="Dietary suitability"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tbl_products'
        ordering = ['product_name']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
    
    def __str__(self):
        return f"{self.product_name} - £{self.product_price}"


class Order(models.Model):
    """Order model - stores order information"""
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('card', 'Card'),
    ]
    
    ORDER_STATUS = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    order_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        Customer, 
        on_delete=models.CASCADE, 
        related_name='orders'
    )
    total_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00')
    )
    method_of_payment = models.CharField(
        max_length=50, 
        choices=PAYMENT_METHODS, 
        default='cash'
    )
    order_placed = models.DateTimeField()
    order_due = models.DateTimeField()
    comments = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tbl_orders'
        ordering = ['-order_placed']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
    
    def calculate_total(self):
        """Calculate total price from order products"""
        total = sum(
            op.product.product_price * op.quantity 
            for op in self.order_products.all()
        )
        self.total_price = total
        return total
    
    def __str__(self):
        return f"Order #{self.order_id} - {self.customer.full_name}"


class OrderProduct(models.Model):
    """Junction table for Order-Product many-to-many relationship"""
    order_product_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name='order_products'
    )
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='order_products'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    class Meta:
        db_table = 'order_products'
        unique_together = ['order', 'product']
        verbose_name = 'Order Product'
        verbose_name_plural = 'Order Products'
    
    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.product.product_price
        super().save(*args, **kwargs)
    
    @property
    def line_total(self):
        return self.unit_price * self.quantity
    
    def __str__(self):
        return f"{self.order} - {self.product.product_name} x{self.quantity}"


class AllergenInfo(models.Model):
    """Allergen information for products"""
    ALLERGEN_TYPES = [
        ('celery', 'Celery'),
        ('gluten', 'Cereals containing gluten'),
        ('crustaceans', 'Crustaceans'),
        ('eggs', 'Eggs'),
        ('fish', 'Fish'),
        ('lupin', 'Lupin'),
        ('milk', 'Milk'),
        ('molluscs', 'Molluscs'),
        ('mustard', 'Mustard'),
        ('nuts', 'Nuts'),
        ('peanuts', 'Peanuts'),
        ('sesame', 'Sesame seeds'),
        ('soybeans', 'Soybeans'),
        ('sulphites', 'Sulphur dioxide/sulphites'),
    ]
    
    allergen_id = models.AutoField(primary_key=True)
    allergen_name = models.CharField(max_length=100, choices=ALLERGEN_TYPES, unique=True)
    description = models.TextField(blank=True)
    products = models.ManyToManyField(Product, related_name='allergens', blank=True)
    
    class Meta:
        db_table = 'tbl_allergens'
        ordering = ['allergen_name']
        verbose_name = 'Allergen'
        verbose_name_plural = 'Allergens'
    
    def __str__(self):
        return self.get_allergen_name_display()
