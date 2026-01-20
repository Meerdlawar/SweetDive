import { useState, useEffect } from 'react';
import { productsAPI, allergensAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Tag
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productTypes, setProductTypes] = useState([]);
  const [suitabilities, setSuitabilities] = useState([]);
  
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    product_type: '',
    suitability: '',
    is_active: true,
    allergens: []
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentPage, searchTerm, typeFilter]);

  const loadInitialData = async () => {
    try {
      const [typesRes, suitabilitiesRes, allergensRes] = await Promise.all([
        productsAPI.getTypes(),
        productsAPI.getSuitabilities(),
        allergensAPI.getAll()
      ]);
      setProductTypes(typesRes.data);
      setSuitabilities(suitabilitiesRes.data);
      setAllergens(allergensRes.data.results || allergensRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm || undefined,
        product_type: typeFilter || undefined
      };
      const response = await productsAPI.getAll(params);
      setProducts(response.data.results || response.data);
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 10));
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        toast.success('Product updated successfully');
      } else {
        await productsAPI.create(data);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      product_type: product.product_type || '',
      suitability: product.suitability || '',
      is_active: product.is_active !== false,
      allergens: product.allergens?.map(a => a.id) || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      setDeleteConfirm(null);
      loadProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      product_type: '',
      suitability: '',
      is_active: true,
      allergens: []
    });
    setEditingProduct(null);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const toggleAllergen = (allergenId) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergenId)
        ? prev.allergens.filter(id => id !== allergenId)
        : [...prev.allergens, allergenId]
    }));
  };

  const getSuitabilityBadge = (suitability) => {
    const styles = {
      vegetarian: 'badge-success',
      vegan: 'badge-primary',
      gluten_free: 'badge-warning',
      dairy_free: 'badge-info',
      none: 'badge-neutral'
    };
    return styles[suitability] || 'badge-neutral';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-600" />
            Products
          </h1>
          <p className="page-subtitle">Manage your product catalog</p>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search products..."
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="select pl-12"
            >
              <option value="">All Types</option>
              {productTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
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
        ) : products.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Suitability</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-accent-600" />
                          </div>
                          <div>
                            <p className="font-medium text-surface-900">{product.name}</p>
                            {product.allergens?.length > 0 && (
                              <p className="text-xs text-surface-500">
                                Contains: {product.allergens.map(a => a.allergen_name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-neutral">
                          {product.product_type_display || product.product_type}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-surface-900">
                          £{parseFloat(product.price).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        {product.suitability && product.suitability !== 'none' && (
                          <span className={getSuitabilityBadge(product.suitability)}>
                            {product.suitability_display || product.suitability}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={product.is_active ? 'badge-success' : 'badge-danger'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn-ghost btn-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product)}
                            className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
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

            {/* Pagination */}
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
            <Package className="empty-state-icon" />
            <h3 className="empty-state-title">No products found</h3>
            <p className="empty-state-description">
              {searchTerm || typeFilter ? 'Try adjusting your filters' : 'Get started by adding your first product'}
            </p>
            {!searchTerm && !typeFilter && (
              <button onClick={openNewModal} className="btn-primary mt-4">
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-lg font-display font-semibold text-surface-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price (£) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Product Type *</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="select"
                    required
                  >
                    <option value="">Select type...</option>
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Suitability</label>
                  <select
                    value={formData.suitability}
                    onChange={(e) => setFormData({ ...formData, suitability: e.target.value })}
                    className="select"
                  >
                    <option value="">None</option>
                    {suitabilities.map(suit => (
                      <option key={suit.value} value={suit.value}>{suit.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center pt-7">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-surface-700">Active product</span>
                  </label>
                </div>
              </div>

              {allergens.length > 0 && (
                <div>
                  <label className="label">Allergens</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {allergens.map(allergen => (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => toggleAllergen(allergen.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          formData.allergens.includes(allergen.id)
                            ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                            : 'bg-surface-100 text-surface-600 border-2 border-transparent hover:bg-surface-200'
                        }`}
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {allergen.allergen_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
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
                Delete Product
              </h3>
              <p className="text-surface-500 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-medium text-surface-900">{deleteConfirm.name}</span>?
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
