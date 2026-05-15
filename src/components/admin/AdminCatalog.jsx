import { useState, useRef } from 'react';
import { Upload, Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { useProductStore } from '../../store/index.js';
import { productsAPI, uploadAPI } from '../../utils/api.js';
import toast from 'react-hot-toast';

const EMPTY = { name: '', category: 'Maize & Flour', weight: '', retailPrice: '', wholesalePrice: '', stock: '', badge: '', emoji: '📦', image: null };

export default function AdminCatalog() {
  const { products, categories, fetchProducts } = useProductStore();
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef();
  const cats = categories.filter(c => c !== 'All');

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setPreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const { data } = await uploadAPI.uploadImage(file);
      setForm(f => ({ ...f, image: data.url }));
      toast.success('Image uploaded');
    } catch {
      setForm(f => ({ ...f, image: URL.createObjectURL(file) }));
    } finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.retailPrice || !form.stock) {
      toast.error('Name, retail price and stock are required');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      retailPrice:    Number(form.retailPrice),
      wholesalePrice: Number(form.wholesalePrice) || Math.round(Number(form.retailPrice) * 0.75),
      stock:          Number(form.stock),
    };
    try {
      if (editId !== null) {
        await productsAPI.update(editId, payload);
        toast.success('Product updated!');
      } else {
        await productsAPI.create(payload);
        toast.success('Product added!');
      }
      await fetchProducts();
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setForm({ ...p, retailPrice: String(p.retailPrice), wholesalePrice: String(p.wholesalePrice), stock: String(p.stock) });
    setPreview(p.image || null);
    setEditId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productsAPI.delete(id);
      await fetchProducts();
      toast.success('Deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const reset = () => { setForm(EMPTY); setPreview(null); setEditId(null); setShowForm(false); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-vuka-green">Catalog Manager</h2>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} products</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showForm && (
        <div className="card p-5 border-2 border-dashed border-amber/40 space-y-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{editId ? 'Edit Product' : 'New Product'}</p>
            <button onClick={reset}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">Product Image</label>
              <div onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-amber hover:bg-amber-pale/30 transition-all relative overflow-hidden">
                {preview
                  ? <><img src={preview} className="w-full h-full object-cover" alt="preview" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs flex items-center gap-1"><Upload size={14} />{uploading ? 'Uploading...' : 'Change'}</p>
                      </div></>
                  : <><Upload size={24} className="text-gray-300 mb-2" /><p className="text-sm text-gray-400">Click to upload</p><p className="text-xs text-gray-300 mt-1">PNG, JPG up to 5MB</p><div className="mt-3 text-3xl">{form.emoji}</div></>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <div className="mt-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Emoji (fallback)</label>
                <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} className="input-field text-2xl" maxLength={2} />
              </div>
            </div>
            {/* Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" placeholder="e.g. Unga wa Mahindi" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    {(cats.length ? cats : ['Maize & Flour', 'Rice', 'Beans & Legumes', 'Wheat', 'Millet', 'Sorghum']).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Pack Size</label>
                  <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="input-field" placeholder="e.g. 2kg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Retail Price (KES) *</label>
                  <input type="number" value={form.retailPrice} onChange={e => setForm(f => ({ ...f, retailPrice: e.target.value }))} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Wholesale Price</label>
                  <input type="number" value={form.wholesalePrice} onChange={e => setForm(f => ({ ...f, wholesalePrice: e.target.value }))} className="input-field" placeholder="Auto: 75% of retail" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Stock *</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-1">Badge</label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className="input-field">
                    <option value="">None</option>
                    {['Popular', 'New', 'Organic', 'Sale'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                  <Save size={15} />{saving ? 'Saving...' : editId ? 'Save Changes' : 'Add to Catalog'}
                </button>
                <button onClick={reset} className="btn-ghost">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Product', 'Category', 'Retail', 'Wholesale', 'Stock', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-pale rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-xl">{p.emoji}</span>}
                      </div>
                      <div><p className="font-medium">{p.name}</p><p className="text-xs text-gray-400">{p.weight}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="badge-retail">{p.category}</span></td>
                  <td className="px-4 py-3 font-medium">KES {p.retailPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-vuka-green">KES {p.wholesalePrice.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.stock <= 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{p.stock} units</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-400 hover:text-vuka-green hover:bg-vuka-green-pale rounded-lg transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📦</p>
              <p className="text-sm">No products yet. Add your first product above.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
