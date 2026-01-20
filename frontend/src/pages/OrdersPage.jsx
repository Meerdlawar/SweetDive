import { useState, useEffect } from 'react';
import { ordersAPI, customersAPI, productsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';
import {
  ShoppingCart,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Calendar,
  User,
  Package,
  Minus
} from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statuses, setStatuses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  const toast = useToast();

  const [formData, setFormData] = useState({
    customer: '',
    status: 'pending',
    method_of_payment: 'cash',
    order_due: '',
    comments: '',
    orderProducts: []
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [currentPage, searchTerm, statusFilter]);

  const loadInitialData = async () => {
    try {
      const [statusesRes, paymentRes, customersRes, productsRes] = await Promise.all([
        ordersAPI.getStatuses(),
        ordersAPI.getPaymentMethods(),
        customersAPI.getSimpleList(),
        productsAPI.getSimpleList()
      ]);
      setStatuses(statusesRes.data);
      setPaymentMethods(paymentRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined
      };
      const response = await ordersAPI.getAll(params);
      setOrders(response.data.results || response.data);
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 10));
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const orderData = {
        customer: parseInt(formData.customer),
        status: formData.status,
        method_of_payment: formData.method_of_payment,
        order_placed: new Date().toISOString(),
        order_due: formData.order_due || null,
        comments: formData.comments,
        products: formData.orderProducts.map(op => ({
          product: op.product,
          quantity: op.quantity
        }))
      };
      
      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, orderData);
        toast.success('Order updated successfully');
      } else {
        await ordersAPI.create(orderData);
        toast.success('Order created successfully');
      }
      setShowModal(false);
      resetForm();
      loadOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save order');
    }
  };

  const handleEdit = async (order) => {
    setEditingOrder(order);
    
    let orderProducts = [];
    try {
      const response = await ordersAPI.getProducts(order.id);
      orderProducts = response.data.map(op => ({
        product: op.product.id,
        product_name: op.product.name,
        quantity: op.quantity,
        unit_price: op.unit_price
      }));
    } catch (error) {
      console.error('Failed to load order products:', error);
    }

    setFormData({
      customer: order.customer || '',
      status: order.status || 'pending',
      method_of_payment: order.method_of_payment || 'cash',
      order_due: order.order_due ? order.order_due.slice(0, 16) : '',
      comments: order.comments || '',
      orderProducts
    });
    setShowModal(true);
  };

  const handleViewDetail = async (order) => {
    try {
      const response = await ordersAPI.getById(order.id);
      setSelectedOrder(response.data);
      setShowDetailModal(true);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const handleDelete = async (id) => {
    try {
      await ordersAPI.delete(id);
      toast.success('Order deleted successfully');
      setDeleteConfirm(null);
      loadOrders();
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      status: 'pending',
      method_of_payment: 'cash',
      order_due: '',
      comments: '',
      orderProducts: []
    });
    setEditingOrder(null);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const addProductToOrder = () => {
    setFormData(prev => ({
      ...prev,
      orderProducts: [...prev.orderProducts, { product: '', quantity: 1 }]
    }));
  };

  const updateOrderProduct = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.orderProducts];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === 'product') {
        const product = products.find(p => p.id === parseInt(value));
        if (product) {
          updated[index].product_name = product.name;
          updated[index].unit_price = product.price;
        }
      }
      
      return { ...prev, orderProducts: updated };
    });
  };

  const removeOrderProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      orderProducts: prev.orderProducts.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.orderProducts.reduce((total, op) => {
      const product = products.find(p => p.id === parseInt(op.product));
      return total + (product ? product.price * op.quantity : 0);
    }, 0);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      preparing: 'badge-primary',
      ready: 'badge-success',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    };
    return styles[status] || 'badge-neutral';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-primary-600" />
            Orders
          </h1>
          <p className="page-subtitle">Manage customer orders</p>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input pl-12"
            />
          </div>
          <div className="relative sm:w-48">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="select pl-12"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="font-mono font-semibold text-surface-900">
                          #{order.id.toString().padStart(4, '0')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-surface-400" />
                          <span>{order.customer_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-surface-900">
                          £{parseFloat(order.total_price).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadge(order.status)}>
                          {order.status_display || order.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-surface-600">
                          {order.method_of_payment_display || order.method_of_payment}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-surface-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          {order.order_placed 
                            ? format(new Date(order.order_placed), 'dd/MM/yyyy HH:mm')
                            : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(order)}
                            className="btn-ghost btn-sm"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(order)}
                            className="btn-ghost btn-sm"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(order)}
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-surface-100">
                <p className="text-sm text-surface-500">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary btn-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary btn-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state py-16">
            <ShoppingCart className="empty-state-icon" />
            <h3 className="empty-state-title">No orders found</h3>
            <p className="empty-state-description">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Get started by creating your first order'}
            </p>
            {!searchTerm && !statusFilter && (
              <button onClick={openNewModal} className="btn-primary mt-4">
                <Plus className="w-5 h-5" />
                New Order
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-display font-semibold text-surface-900">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="label">Customer *</label>
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="select"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    value={formData.method_of_payment}
                    onChange={(e) => setFormData({ ...formData, method_of_payment: e.target.value })}
                    className="select"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Due Date/Time</label>
                <input
                  type="datetime-local"
                  value={formData.order_due}
                  onChange={(e) => setFormData({ ...formData, order_due: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">Products</label>
                  <button
                    type="button"
                    onClick={addProductToOrder}
                    className="btn-secondary btn-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
                
                {formData.orderProducts.length > 0 ? (
                  <div className="space-y-3">
                    {formData.orderProducts.map((op, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                        <div className="flex-1">
                          <select
                            value={op.product}
                            onChange={(e) => updateOrderProduct(index, 'product', e.target.value)}
                            className="select"
                            required
                          >
                            <option value="">Select product...</option>
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - £{product.price}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={op.quantity}
                            onChange={(e) => updateOrderProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="input text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOrderProduct(index)}
                          className="btn-ghost btn-sm text-red-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex justify-end pt-3 border-t border-surface-200">
                      <div className="text-right">
                        <p className="text-sm text-surface-500">Estimated Total</p>
                        <p className="text-2xl font-display font-bold text-surface-900">
                          £{calculateTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
                    <Package className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                    <p className="text-sm text-surface-500">No products added yet</p>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Comments</label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Any special instructions..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingOrder ? 'Update Order' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-lg font-display font-semibold text-surface-900">
                Order #{selectedOrder.id.toString().padStart(4, '0')}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Customer</span>
                <span className="font-medium">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Status</span>
                <span className={getStatusBadge(selectedOrder.status)}>
                  {selectedOrder.status_display}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Payment</span>
                <span>{selectedOrder.method_of_payment_display}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-500">Placed</span>
                <span>{format(new Date(selectedOrder.order_placed), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              {selectedOrder.order_due && (
                <div className="flex items-center justify-between">
                  <span className="text-surface-500">Due</span>
                  <span>{format(new Date(selectedOrder.order_due), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}
              
              {selectedOrder.order_products?.length > 0 && (
                <div className="pt-4 border-t border-surface-100">
                  <h3 className="font-medium mb-3">Products</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_products.map((op, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{op.product_name} × {op.quantity}</span>
                        <span className="font-medium">£{(parseFloat(op.unit_price) * op.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.comments && (
                <div className="pt-4 border-t border-surface-100">
                  <h3 className="font-medium mb-2">Comments</h3>
                  <p className="text-sm text-surface-600">{selectedOrder.comments}</p>
                </div>
              )}

              <div className="pt-4 border-t border-surface-100 flex items-center justify-between">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-display font-bold text-surface-900">
                  £{parseFloat(selectedOrder.total_price).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">
                Delete Order
              </h3>
              <p className="text-surface-500 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-medium text-surface-900">
                  Order #{deleteConfirm.id.toString().padStart(4, '0')}
                </span>?
                This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
