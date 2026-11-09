import { useEffect, useState } from 'react';
import { shopApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import { Panel, Modal, Field, Confirm, Toast, useToast, ImageUpload, Stat } from '../../components/admin-ui';

const EMPTY = {
  name: '', name_bn: '', subtitle: '', subtitle_bn: '', description: '', description_bn: '',
  ingredients: '', how_to_use: '', category_id: '', brand_id: '', image: '',
  price: '', sale_price: '', sku: '', stock: 0, size_label: '50 ml',
  skin_type: 'all', badge: 'none', rating: 0, review_count: 0,
  sort_order: 0, is_featured: 0, is_active: 1, meta_title: '', meta_description: '',
};

const money = (n) => `৳ ${Number(n || 0).toLocaleString()}`;

export default function Products() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const { toast, show, clear } = useToast();

  const load = () => {
    setLoading(true);
    shopApi.adminProducts()
      .then((r) => setRows(r.data || []))
      .catch(() => show('Could not load products', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    shopApi.adminCategories().then(setCategories).catch(() => {});
    shopApi.adminBrands().then(setBrands).catch(() => {});
  }, []);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
    setEditing((x) => ({ ...x, [k]: v }));
  };

  const save = async () => {
    if (!editing.name) return show('Product name is required', 'error');
    if (editing.price === '' || Number(editing.price) <= 0) return show('A price is required', 'error');
    setBusy(true);
    try {
      const payload = {
        ...editing,
        sale_price: editing.sale_price === '' ? null : editing.sale_price,
        category_id: editing.category_id || null,
        brand_id: editing.brand_id || null,
      };
      if (editing.id) await shopApi.updateProduct(editing.id, payload);
      else await shopApi.createProduct(payload);
      show(editing.id ? 'Product updated' : 'Product created');
      setEditing(null);
      load();
    } catch (e) {
      show(e.response?.data?.message || 'Could not save', 'error');
    } finally { setBusy(false); }
  };

  const remove = async () => {
    try {
      await shopApi.removeProduct(confirmDel.id);
      show('Product deleted');
      setConfirmDel(null);
      load();
    } catch { show('Could not delete', 'error'); }
  };

  const filtered = rows.filter((r) => {
    const okSearch = !search || `${r.name} ${r.brand_name || ''} ${r.sku || ''}`.toLowerCase().includes(search.toLowerCase());
    const okCat = !catFilter || String(r.category_id) === catFilter;
    return okSearch && okCat;
  });

  const lowStock = rows.filter((r) => r.stock > 0 && r.stock <= 5).length;
  const outOfStock = rows.filter((r) => r.stock <= 0).length;

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Products" value={rows.length} icon="🧴" />
        <Stat label="Active" value={rows.filter((r) => r.is_active).length} icon="✓" />
        <Stat label="Low Stock (≤5)" value={lowStock} icon="⚠" />
        <Stat label="Out of Stock" value={outOfStock} icon="✕" />
      </div>

      <div className="toolbar">
        <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="spacer" />
        <span className="muted" style={{ fontSize: '.85rem' }}>{filtered.length} shown</span>
        <button className="btn btn-purple btn-sm" onClick={() => setEditing({ ...EMPTY })}>+ Add Product</button>
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center muted" style={{ padding: 40 }}>No products found</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-12">
                      <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: 'var(--purple-100)', flexShrink: 0 }}>
                        {p.image && <img src={assetUrl(p.image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div>
                        <strong>{p.name}</strong>
                        {p.is_featured === 1 && <span className="badge badge-gold" style={{ marginLeft: 6 }}>featured</span>}
                        <br /><small className="muted">{p.brand_name || '—'} · {p.sku || 'no sku'}</small>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '.85rem' }}>{p.category_name || '—'}</td>
                  <td>
                    <strong>{money(p.effective_price)}</strong>
                    {p.discount_percent > 0 && (
                      <><br /><small className="muted" style={{ textDecoration: 'line-through' }}>{money(p.price)}</small></>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${p.stock <= 0 ? 'badge-red' : p.stock <= 5 ? 'badge-amber' : 'badge-green'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{p.sold}</td>
                  <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'live' : 'hidden'}</span></td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" onClick={() => setEditing({ ...p, sale_price: p.sale_price ?? '' })}>✎</button>
                      <button className="icon-btn danger" onClick={() => setConfirmDel(p)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {editing && (
        <Modal wide title={editing.id ? 'Edit Product' : 'Add Product'} onClose={() => setEditing(null)} onSubmit={save} busy={busy}>
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Product name *"><input value={editing.name} onChange={set('name')} required /></Field>
            <Field label="Subtitle"><input value={editing.subtitle || ''} onChange={set('subtitle')} placeholder="Gentle & Refreshing" /></Field>
            <Field label="Category">
              <select value={editing.category_id || ''} onChange={set('category_id')}>
                <option value="">None</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Brand">
              <select value={editing.brand_id || ''} onChange={set('brand_id')}>
                <option value="">None</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Field label="Price (৳) *"><input type="number" step="0.01" value={editing.price} onChange={set('price')} required /></Field>
            <Field label="Sale price (৳)" hint="Leave empty for no discount">
              <input type="number" step="0.01" value={editing.sale_price} onChange={set('sale_price')} />
            </Field>
            <Field label="Stock"><input type="number" value={editing.stock ?? 0} onChange={set('stock')} /></Field>
            <Field label="SKU"><input value={editing.sku || ''} onChange={set('sku')} /></Field>
            <Field label="Size"><input value={editing.size_label || ''} onChange={set('size_label')} placeholder="50 ml" /></Field>
            <Field label="Skin type">
              <select value={editing.skin_type} onChange={set('skin_type')}>
                {['all', 'oily', 'dry', 'sensitive', 'combination', 'normal'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Badge">
              <select value={editing.badge} onChange={set('badge')}>
                <option value="none">None</option>
                <option value="bestseller">Bestseller</option>
                <option value="new">New</option>
                <option value="sale">Sale</option>
              </select>
            </Field>
            <Field label="Sort order"><input type="number" value={editing.sort_order ?? 0} onChange={set('sort_order')} /></Field>
          </div>

          <ImageUpload value={editing.image} onChange={(url) => setEditing((x) => ({ ...x, image: url }))} label="Product image" />

          <Field label="Description"><textarea rows={4} value={editing.description || ''} onChange={set('description')} /></Field>
          <div className="grid grid-2" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Ingredients"><textarea rows={3} value={editing.ingredients || ''} onChange={set('ingredients')} /></Field>
            <Field label="How to use"><textarea rows={3} value={editing.how_to_use || ''} onChange={set('how_to_use')} /></Field>
          </div>

          <div style={{ background: 'var(--purple-50)', padding: 18, borderRadius: 12, margin: '6px 0 18px' }}>
            <p style={{ fontSize: '.8rem', color: 'var(--purple-700)', fontWeight: 600, margin: '0 0 12px' }}>
              বাংলা অনুবাদ — leave empty to fall back to the English text
            </p>
            <Field label="নাম (Bangla name)"><input value={editing.name_bn || ''} onChange={set('name_bn')} /></Field>
            <Field label="সাবটাইটেল (Bangla subtitle)"><input value={editing.subtitle_bn || ''} onChange={set('subtitle_bn')} /></Field>
            <Field label="বিবরণ (Bangla description)"><textarea rows={3} value={editing.description_bn || ''} onChange={set('description_bn')} /></Field>
          </div>

          <div className="flex gap-24 mt-8">
            <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!editing.is_featured} onChange={set('is_featured')} style={{ width: 'auto' }} />
              Featured
            </label>
            <label className="flex items-center gap-8" style={{ fontSize: '.9rem' }}>
              <input type="checkbox" checked={!!editing.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
              Visible in the shop
            </label>
          </div>
        </Modal>
      )}

      {confirmDel && <Confirm text={`Delete "${confirmDel.name}"?`} onYes={remove} onNo={() => setConfirmDel(null)} />}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
