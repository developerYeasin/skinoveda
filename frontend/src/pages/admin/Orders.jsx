import { useCallback, useEffect, useState } from 'react';
import { shopApi } from '../../api/endpoints';
import { assetUrl } from '../../api/client';
import { Panel, Modal, Field, Confirm, Toast, useToast, Stat, StatusBadge } from '../../components/admin-ui';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT = ['unpaid', 'paid', 'refunded'];
const money = (n) => `৳ ${Number(n || 0).toLocaleString()}`;

export default function Orders() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [open, setOpen] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const { toast, show, clear } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    shopApi.orders({ ...params, limit: 200 })
      .then((r) => { setRows(r.data || []); setTotal(r.total || 0); })
      .catch(() => show('Could not load orders', 'error'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const view = async (row) => {
    try {
      setOpen(await shopApi.order(row.id));
    } catch { show('Could not load the order', 'error'); }
  };

  const quickStatus = async (row, status) => {
    try {
      await shopApi.updateOrder(row.id, { status });
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
      show(`Marked as ${status}`);
    } catch { show('Could not update', 'error'); }
  };

  const saveOpen = async () => {
    setBusy(true);
    try {
      await shopApi.updateOrder(open.id, {
        status: open.status,
        payment_status: open.payment_status,
        admin_note: open.admin_note,
      });
      show('Order updated');
      setOpen(null);
      load();
    } catch (e) {
      show(e.response?.data?.message || 'Could not update', 'error');
    } finally { setBusy(false); }
  };

  const remove = async () => {
    try {
      await shopApi.removeOrder(confirmDel.id);
      show('Order deleted');
      setConfirmDel(null);
      load();
    } catch { show('Could not delete', 'error'); }
  };

  const revenue = rows.filter((r) => r.status !== 'cancelled').reduce((n, r) => n + Number(r.total), 0);
  const count = (s) => rows.filter((r) => r.status === s).length;

  return (
    <>
      <div className="stat-grid mb-24">
        <Stat label="Orders" value={total} icon="📦" />
        <Stat label="Pending" value={count('pending')} icon="⏳" />
        <Stat label="Delivered" value={count('delivered')} icon="✓" />
        <Stat label="Revenue (shown)" value={money(revenue)} icon="৳" />
      </div>

      <div className="toolbar">
        <input
          placeholder="Search code, name, phone…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          style={{ minWidth: 230 }}
        />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ status: '', search: '' })}>Clear</button>
      </div>

      <Panel tight>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Placed</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center muted" style={{ padding: 40 }}>Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="text-center muted" style={{ padding: 40 }}>No orders yet</td></tr>
              )}
              {rows.map((o) => (
                <tr key={o.id}>
                  <td><code style={{ fontSize: '.76rem' }}>{o.order_code}</code></td>
                  <td>
                    <strong>{o.customer_name}</strong><br />
                    <small className="muted"><a href={`tel:${o.phone}`}>{o.phone}</a></small>
                  </td>
                  <td>{o.item_count}</td>
                  <td><strong>{money(o.total)}</strong></td>
                  <td>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-gray'}`}>
                      {o.payment_method} · {o.payment_status}
                    </span>
                  </td>
                  <td>
                    <select
                      value={o.status} onChange={(e) => quickStatus(o, e.target.value)}
                      style={{ padding: '5px 8px', fontSize: '.78rem', border: '1px solid var(--line)', borderRadius: 8 }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="muted" style={{ fontSize: '.8rem' }}>{new Date(o.created_at).toLocaleDateString('en-GB')}</td>
                  <td>
                    <div className="actions">
                      <button className="icon-btn" onClick={() => view(o)}>👁</button>
                      <button className="icon-btn danger" onClick={() => setConfirmDel(o)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {open && (
        <Modal wide title={`Order ${open.order_code}`} onClose={() => setOpen(null)} onSubmit={saveOpen} busy={busy}>
          <div className="alert alert-info">
            <strong>{open.customer_name}</strong> · <a href={`tel:${open.phone}`}>{open.phone}</a>
            {open.email && <> · {open.email}</>}<br />
            📍 {open.address}{open.city && `, ${open.city}`}<br />
            <small>{new Date(open.created_at).toLocaleString('en-GB')}</small>
            {open.note && <><br /><em>“{open.note}”</em></>}
          </div>

          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th>Total</th></tr></thead>
              <tbody>
                {open.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="flex items-center gap-12">
                        <div style={{ width: 38, height: 38, borderRadius: 7, overflow: 'hidden', background: 'var(--purple-100)', flexShrink: 0 }}>
                          {i.product_image && <img src={assetUrl(i.product_image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        {i.product_name}
                      </div>
                    </td>
                    <td>{money(i.unit_price)}</td>
                    <td>{i.quantity}</td>
                    <td><strong>{money(i.line_total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gap: 6, marginTop: 16, maxWidth: 280, marginLeft: 'auto' }}>
            <div className="flex justify-between"><span className="muted">Subtotal</span><span>{money(open.subtotal)}</span></div>
            <div className="flex justify-between"><span className="muted">Delivery</span><span>{money(open.delivery_charge)}</span></div>
            <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--purple-800)' }}>
              <span>Total</span><span>{money(open.total)}</span>
            </div>
          </div>

          <div className="grid grid-2 mt-24" style={{ gap: 0, columnGap: 18 }}>
            <Field label="Order status">
              <select value={open.status} onChange={(e) => setOpen((o) => ({ ...o, status: e.target.value }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Payment status">
              <select value={open.payment_status} onChange={(e) => setOpen((o) => ({ ...o, payment_status: e.target.value }))}>
                {PAYMENT.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Internal note" hint="Only visible to your team.">
            <textarea value={open.admin_note || ''} onChange={(e) => setOpen((o) => ({ ...o, admin_note: e.target.value }))} />
          </Field>
        </Modal>
      )}

      {confirmDel && (
        <Confirm text={`Delete order ${confirmDel.order_code}? This cannot be undone.`} onYes={remove} onNo={() => setConfirmDel(null)} />
      )}
      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
