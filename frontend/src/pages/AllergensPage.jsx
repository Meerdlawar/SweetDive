import { useState, useEffect } from 'react';
import { allergensAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  AlertTriangle,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Info
} from 'lucide-react';

export default function AllergensPage() {
  const [allergens, setAllergens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedAllergen, setSelectedAllergen] = useState(null);
  
  const toast = useToast();

  const [formData, setFormData] = useState({
    allergen_name: '',
    description: ''
  });

  useEffect(() => {
    loadAllergens();
  }, []);

  const loadAllergens = async () => {
    try {
      setLoading(true);
      const response = await allergensAPI.getAll();
      setAllergens(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load allergens');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAllergen) {
        await allergensAPI.update(editingAllergen.allergen_id, formData);
        toast.success('Allergen updated successfully');
      } else {
        await allergensAPI.create(formData);
        toast.success('Allergen created successfully');
      }
      setShowModal(false);
      resetForm();
      loadAllergens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save allergen');
    }
  };

  const handleEdit = (allergen) => {
    setEditingAllergen(allergen);
    setFormData({
      allergen_name: allergen.allergen_name || '',
      description: allergen.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await allergensAPI.delete(id);
      toast.success('Allergen deleted successfully');
      setDeleteConfirm(null);
      loadAllergens();
    } catch (error) {
      toast.error('Failed to delete allergen');
    }
  };

  const resetForm = () => {
    setFormData({
      allergen_name: '',
      description: ''
    });
    setEditingAllergen(null);
  };

  const openNewModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredAllergens = allergens.filter(allergen =>
    allergen.allergen_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    allergen.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Common allergen icons/colors
  const allergenColors = {
    'Gluten': 'bg-amber-100 text-amber-700',
    'Dairy': 'bg-blue-100 text-blue-700',
    'Eggs': 'bg-yellow-100 text-yellow-700',
    'Nuts': 'bg-orange-100 text-orange-700',
    'Peanuts': 'bg-orange-100 text-orange-700',
    'Fish': 'bg-cyan-100 text-cyan-700',
    'Shellfish': 'bg-pink-100 text-pink-700',
    'Soy': 'bg-green-100 text-green-700',
    'Wheat': 'bg-amber-100 text-amber-700',
    'Sesame': 'bg-yellow-100 text-yellow-700',
    'Celery': 'bg-emerald-100 text-emerald-700',
    'Mustard': 'bg-yellow-100 text-yellow-700',
    'Lupin': 'bg-purple-100 text-purple-700',
    'Molluscs': 'bg-teal-100 text-teal-700',
    'Sulphites': 'bg-rose-100 text-rose-700'
  };

  const getAllergenColor = (name) => {
    for (const [key, value] of Object.entries(allergenColors)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return 'bg-surface-100 text-surface-700';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-primary-600" />
            Allergen Information
          </h1>
          <p className="page-subtitle">Manage allergen data for products</p>
        </div>
        <button onClick={openNewModal} className="btn-primary">
          <Plus className="w-5 h-5" />
          Add Allergen
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> Allergen information must be accurate and up-to-date. 
            Always verify allergen data when products are modified or new ingredients are added.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search allergens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Allergens Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : filteredAllergens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAllergens.map((allergen) => (
            <div
              key={allergen.allergen_id}
              className="card-hover p-5 group cursor-pointer"
              onClick={() => setSelectedAllergen(allergen)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getAllergenColor(allergen.allergen_name)}`}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900">{allergen.allergen_name}</h3>
                    {allergen.products_count !== undefined && (
                      <p className="text-xs text-surface-500 mt-0.5">
                        {allergen.products_count} product{allergen.products_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(allergen);
                    }}
                    className="btn-ghost btn-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(allergen);
                    }}
                    className="btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {allergen.description && (
                <p className="text-sm text-surface-500 mt-3 line-clamp-2">
                  {allergen.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state py-16">
            <AlertTriangle className="empty-state-icon" />
            <h3 className="empty-state-title">No allergens found</h3>
            <p className="empty-state-description">
              {searchTerm ? 'Try adjusting your search' : 'Get started by adding allergen information'}
            </p>
            {!searchTerm && (
              <button onClick={openNewModal} className="btn-primary mt-4">
                <Plus className="w-5 h-5" />
                Add Allergen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-lg font-display font-semibold text-surface-900">
                {editingAllergen ? 'Edit Allergen' : 'Add New Allergen'}
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
                <label className="label">Allergen Name *</label>
                <input
                  type="text"
                  value={formData.allergen_name}
                  onChange={(e) => setFormData({ ...formData, allergen_name: e.target.value })}
                  className="input"
                  placeholder="e.g., Gluten, Dairy, Nuts"
                  required
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[120px]"
                  placeholder="Provide detailed information about this allergen..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAllergen ? 'Update Allergen' : 'Create Allergen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allergen Detail Modal */}
      {selectedAllergen && (
        <div className="modal-overlay" onClick={() => setSelectedAllergen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAllergenColor(selectedAllergen.allergen_name)}`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-display font-semibold text-surface-900">
                  {selectedAllergen.allergen_name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAllergen(null)}
                className="text-surface-400 hover:text-surface-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {selectedAllergen.description ? (
                <div>
                  <h3 className="text-sm font-medium text-surface-500 mb-2">Description</h3>
                  <p className="text-surface-700 whitespace-pre-wrap">{selectedAllergen.description}</p>
                </div>
              ) : (
                <p className="text-surface-500 italic">No description provided</p>
              )}

              {selectedAllergen.products?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-surface-100">
                  <h3 className="text-sm font-medium text-surface-500 mb-3">
                    Products containing this allergen
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAllergen.products.map((product, i) => (
                      <span key={i} className="badge-neutral">
                        {product.name || product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                Delete Allergen
              </h3>
              <p className="text-surface-500 mb-6">
                Are you sure you want to delete{' '}
                <span className="font-medium text-surface-900">{deleteConfirm.allergen_name}</span>?
                This will remove it from all associated products.
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
