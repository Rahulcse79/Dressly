import React, { useState, useEffect, useCallback } from 'react';
import { wardrobeApi } from '../../services/api';
import { IoAdd, IoTrash, IoShirt, IoSearch, IoClose, IoCloudUpload } from 'react-icons/io5';

const CATEGORIES = ['Top', 'Bottom', 'Dress', 'Outerwear', 'Shoes', 'Accessory', 'Bag', 'Jewelry', 'Other'];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all-season'];

const WardrobePage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({
    category: 'Top',
    color: '#6C63FF',
    brand: '',
    season: 'all-season',
    occasion_tags: '',
    image: null,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await wardrobeApi.list(1, 100);
      setItems(res.data.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (form.image) formData.append('image', form.image);
      formData.append('category', form.category);
      formData.append('color', form.color);
      if (form.brand) formData.append('brand', form.brand);
      formData.append('season', form.season);
      if (form.occasion_tags) {
        form.occasion_tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => {
          formData.append('occasion_tags', t);
        });
      }
      await wardrobeApi.addItem(formData);
      setShowModal(false);
      setForm({ category: 'Top', color: '#6C63FF', brand: '', season: 'all-season', occasion_tags: '', image: null });
      fetchItems();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add item');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await wardrobeApi.deleteItem(id);
      setItems(items.filter(i => i.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  const filtered = items.filter((item) => {
    const matchCat = !filterCat || item.category === filterCat;
    const matchSearch = !search || (item.brand || '').toLowerCase().includes(search.toLowerCase()) || (item.category || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>
            <IoShirt style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--secondary)' }} />
            My Wardrobe
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} item{items.length !== 1 ? 's' : ''} in your wardrobe
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <IoAdd style={{ marginRight: 6 }} /> Add Item
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <IoSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by brand or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className={`btn ${!filterCat ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => setFilterCat('')}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`btn ${filterCat === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: 12 }}
              onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👗</div>
          <h3>No items found</h3>
          <p>{items.length === 0 ? 'Add your first wardrobe item to get started!' : 'No items match your filter.'}</p>
          {items.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: 16 }}>
              <IoAdd style={{ marginRight: 6 }} /> Add Item
            </button>
          )}
        </div>
      ) : (
        <div className="wardrobe-grid">
          {filtered.map((item) => (
            <div className="wardrobe-card" key={item.id}>
              {item.image_url ? (
                <img className="wardrobe-card-img" src={item.image_url} alt={item.category} />
              ) : (
                <div className="wardrobe-card-img" style={{ background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                  <IoShirt style={{ color: item.color || 'var(--text-muted)' }} />
                </div>
              )}
              <div className="wardrobe-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{item.category}</span>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: item.color || '#ccc', border: '2px solid var(--border-color)' }} />
                </div>
                {item.brand && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{item.brand}</p>}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {item.season && <span className="tag">{item.season}</span>}
                  {(item.occasion_tags || []).map((t, i) => <span className="tag" key={i}>{t}</span>)}
                </div>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: 10, width: '100%', padding: '6px 0', fontSize: 12, color: 'var(--error)', borderColor: 'var(--error)' }}
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                >
                  <IoTrash style={{ marginRight: 4 }} /> {deleting === item.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Wardrobe Item</h3>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ padding: 6, border: 'none' }}>
                <IoClose size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Category *</label>
                <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: 40, height: 36, padding: 2, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{form.color}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input className="form-input" placeholder="E.g., Nike, Zara..." value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Season</label>
                <select className="form-input" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Occasion Tags (comma-separated)</label>
                <input className="form-input" placeholder="casual, formal, party..." value={form.occasion_tags} onChange={(e) => setForm({ ...form, occasion_tags: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Photo</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <IoCloudUpload size={20} />
                  {form.image ? form.image.name : 'Upload an image...'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setForm({ ...form, image: e.target.files[0] })} />
                </label>
              </div>
              {formError && <div className="form-error" style={{ marginBottom: 12 }}>{formError}</div>}
              <button type="submit" className="btn btn-primary btn-large" disabled={submitting} style={{ width: '100%' }}>
                {submitting ? 'Adding...' : 'Add to Wardrobe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardrobePage;
