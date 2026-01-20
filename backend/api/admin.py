from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Staff, Customer, Product, Order, OrderProduct, AllergenInfo


@admin.register(Staff)
class StaffAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    list_filter = ['is_active', 'is_staff']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['customer_id', 'full_name', 'phone_number', 'email', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    list_filter = ['created_at']
    readonly_fields = ['full_name', 'created_at', 'updated_at']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_id', 'product_name', 'product_price', 'product_type', 'product_suitability', 'is_active']
    search_fields = ['product_name']
    list_filter = ['product_type', 'product_suitability', 'is_active']
    list_editable = ['is_active']


class OrderProductInline(admin.TabularInline):
    model = OrderProduct
    extra = 1
    readonly_fields = ['unit_price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'customer', 'total_price', 'method_of_payment', 'status', 'order_placed', 'order_due']
    search_fields = ['customer__first_name', 'customer__last_name']
    list_filter = ['status', 'method_of_payment', 'order_placed']
    inlines = [OrderProductInline]
    readonly_fields = ['total_price', 'created_at', 'updated_at']


@admin.register(AllergenInfo)
class AllergenInfoAdmin(admin.ModelAdmin):
    list_display = ['allergen_id', 'allergen_name', 'description']
    search_fields = ['allergen_name', 'description']
    filter_horizontal = ['products']
