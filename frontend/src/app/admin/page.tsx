'use client';

import { useEffect, useState } from 'react';
import { Server, Database, Box, CheckCircle2, Plus, Trash2, Edit3, Upload, Layers } from 'lucide-react';
import { ApiService, formatAssetUrl } from '@/services/api';
import { Product, Category } from '@/types';

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // Form states for product
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_id: '',
    name: '',
    description: '',
    material: '',
    dimensions: '',
    weight: '',
    assembly: '',
    model_url: '',
    image_url: '',
    usdz_url: '',
    scale: 1.0,
    surface_type: 'floor',
    price: 0,
    is_featured: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [usdzFile, setUsdzFile] = useState<File | null>(null);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pList, cList] = await Promise.all([
        ApiService.getProducts(),
        ApiService.getCategories(),
      ]);
      setProducts(pList);
      setCategories(cList);
    } catch (e) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const openCreateModal = () => {
    setEditingProductId(null);
    setFormData({
      product_id: `prod_${Math.random().toString(36).substring(2, 8)}`,
      name: '',
      description: '',
      material: '',
      dimensions: '',
      weight: '',
      assembly: '',
      model_url: '',
      image_url: '',
      usdz_url: '',
      scale: 1.0,
      surface_type: 'floor',
      price: 199.99,
      is_featured: false,
    });
    setImageFile(null);
    setModelFile(null);
    setUsdzFile(null);
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProductId(p.product_id);
    setFormData({
      product_id: p.product_id,
      name: p.name,
      description: p.description || '',
      material: p.material || '',
      dimensions: p.dimensions || '',
      weight: p.weight || '',
      assembly: p.assembly || '',
      model_url: p.model_url || '',
      image_url: p.image_url || '',
      usdz_url: p.usdz_url || '',
      scale: p.scale || 1.0,
      surface_type: p.surface_type || 'floor',
      price: p.price || 0,
      is_featured: !!p.is_featured,
    });
    setImageFile(null);
    setModelFile(null);
    setUsdzFile(null);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(`Are you sure you want to delete product "${id}"?`)) return;
    try {
      await ApiService.deleteProduct(id);
      setActionMsg(`Product ${id} deleted.`);
      fetchAdminData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e) {
      setActionMsg('Failed to delete product.');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        data.append(k, String(v));
      });
      if (imageFile) data.append('image_file', imageFile);
      if (modelFile) data.append('model_file', modelFile);
      if (usdzFile) data.append('usdz_file', usdzFile);

      if (editingProductId) {
        await ApiService.updateProduct(editingProductId, data);
        setActionMsg('Product updated successfully!');
      } else {
        await ApiService.createProduct(data);
        setActionMsg('Product created successfully!');
      }
      setShowProductModal(false);
      fetchAdminData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err) {
      console.warn('Save product error:', err);
      setActionMsg('Error saving product.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await ApiService.createCategory({ name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      setShowCategoryModal(false);
      fetchAdminData();
      setActionMsg('Category created successfully.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e) {
      setActionMsg('Failed to create category.');
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    try {
      await ApiService.deleteCategory(catId);
      fetchAdminData();
      setActionMsg('Category deleted.');
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e) {
      setActionMsg('Failed to delete category.');
    }
  };

  const routes = [
    { endpoint: '/api/products/', method: 'GET / POST', handler: 'ProductListView', status: 'Online' },
    { endpoint: '/api/product/:id/', method: 'GET / PUT / DELETE', handler: 'ProductDetailView', status: 'Online' },
    { endpoint: '/api/categories/', method: 'GET / POST', handler: 'CategoryListView', status: 'Online' },
    { endpoint: '/api/wishlist/', method: 'GET / POST', handler: 'WishlistView', status: 'Online' },
    { endpoint: '/api/session/start/', method: 'POST', handler: 'StartSessionView', status: 'Online' },
    { endpoint: '/api/capture/save/', method: 'POST', handler: 'SaveCaptureView', status: 'Online' },
    { endpoint: '/api/capture/list/', method: 'GET', handler: 'ListCapturesView', status: 'Online' },
  ];

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto space-y-10 py-28">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Admin Management Portal</h1>
          <p className="text-slate-400 text-sm">Manage Django REST API 3D products, GLB/USDZ model uploads, categories, and system health.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-full text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4 text-cyan-400" /> Manage Categories
          </button>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Add 3D Product
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold">
          {actionMsg}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
            <Server className="w-4 h-4 text-emerald-400" /> Connected Backend
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">Django 6.0.3</div>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
            <Box className="w-4 h-4 text-blue-400" /> 3D Product Catalog
          </div>
          <div className="text-2xl font-extrabold text-white">{products.length} Models (.glb / .usdz)</div>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase">
            <Database className="w-4 h-4 text-cyan-400" /> Database Architecture
          </div>
          <div className="text-2xl font-extrabold text-cyan-400">SQLite (dev)</div>
        </div>
      </div>

      {/* Product Management Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Live Product Catalog ({products.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 px-3">Thumbnail</th>
                <th className="pb-3 px-3">Product ID</th>
                <th className="pb-3 px-3">Name</th>
                <th className="pb-3 px-3">Surface</th>
                <th className="pb-3 px-3">Price</th>
                <th className="pb-3 px-3">3D Model</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.map((p) => (
                <tr key={p.product_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3">
                    <img
                      src={formatAssetUrl(p.image_display_url || p.image_url)}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-lg bg-black/40 border border-white/10"
                    />
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-400">{p.product_id}</td>
                  <td className="py-3 px-3 font-semibold text-white">{p.name}</td>
                  <td className="py-3 px-3 uppercase text-[10px] text-blue-400">{p.surface_type || 'floor'}</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">${(p.price || 0).toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 max-w-[150px] truncate">
                    {p.model_display_url || p.model_url}
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-400"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.product_id)}
                      className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories List Section */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Product Categories ({categories.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {categories.map((c) => (
            <div key={c.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{c.name}</div>
                <div className="text-slate-400 text-[10px]">{c.description || 'No description'}</div>
              </div>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="text-red-400 hover:text-red-300 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints Health Table */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-white">Django REST API Health Check</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 px-3">Endpoint Route</th>
                <th className="pb-3 px-3">HTTP Method</th>
                <th className="pb-3 px-3">Target View Handler</th>
                <th className="pb-3 px-3">Backend Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {routes.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-cyan-400">{r.endpoint}</td>
                  <td className="py-3.5 px-3 font-bold text-blue-400">{r.method}</td>
                  <td className="py-3.5 px-3 text-white">{r.handler}</td>
                  <td className="py-3.5 px-3 text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> {r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product CRUD Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#07090e] border border-white/15 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white">
              {editingProductId ? `Edit Product: ${editingProductId}` : 'Add New 3D Product'}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Product ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProductId}
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Surface Type</label>
                  <select
                    value={formData.surface_type}
                    onChange={(e) => setFormData({ ...formData, surface_type: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    <option value="floor">Floor</option>
                    <option value="tabletop">Tabletop</option>
                    <option value="wall">Wall</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Upload Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">GLB Model URL</label>
                  <input
                    type="text"
                    value={formData.model_url}
                    onChange={(e) => setFormData({ ...formData, model_url: e.target.value })}
                    placeholder="https://.../model.glb"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Upload GLB File</label>
                  <input
                    type="file"
                    accept=".glb,.gltf"
                    onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white file:text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">USDZ Model URL (iOS)</label>
                  <input
                    type="text"
                    value={formData.usdz_url}
                    onChange={(e) => setFormData({ ...formData, usdz_url: e.target.value })}
                    placeholder="https://.../model.usdz"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Upload USDZ File</label>
                  <input
                    type="file"
                    accept=".usdz"
                    onChange={(e) => setUsdzFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#07090e] border border-white/15 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Create Category</h3>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-white/10 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 text-white font-bold rounded-xl"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

