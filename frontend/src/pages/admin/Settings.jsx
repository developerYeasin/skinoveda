import { useEffect, useState } from 'react';
import { settingApi, authApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Panel, Field, Toast, useToast } from '../../components/admin-ui';

const GROUPS = {
  general: {
    label: 'General',
    fields: [
      ['site_name', 'Site name'],
      ['site_tagline', 'Tagline'],
      ['site_description', 'Short description', 'textarea'],
    ],
  },
  contact: {
    label: 'Contact',
    fields: [
      ['contact_phone', 'Primary phone'],
      ['contact_phone_2', 'Secondary phone'],
      ['whatsapp', 'WhatsApp number', 'text', 'Include the country code, e.g. +8801700000000'],
      ['contact_email', 'Email'],
      ['contact_address', 'Address'],
      ['opening_hours', 'Opening hours'],
      ['contact_map', 'Google Maps link'],
    ],
  },
  social: {
    label: 'Social',
    fields: [
      ['facebook', 'Facebook URL'],
      ['instagram', 'Instagram URL'],
      ['youtube', 'YouTube URL'],
      ['tiktok', 'TikTok URL'],
      ['linkedin', 'LinkedIn URL'],
    ],
  },
  seo: {
    label: 'SEO',
    fields: [
      ['meta_title', 'Default meta title'],
      ['meta_description', 'Default meta description', 'textarea'],
      ['meta_keywords', 'Keywords', 'textarea'],
    ],
  },
};

export default function Settings() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('general');
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const { toast, show, clear } = useToast();

  useEffect(() => {
    settingApi.all()
      .then((r) => setValues(r.flat))
      .catch(() => show('Could not load settings', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (user) setProfile({ name: user.name || '', phone: user.phone || '' }); }, [user]);

  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const save = async (group) => {
    setBusy(true);
    try {
      const keys = GROUPS[group].fields.map(([k]) => k);
      const payload = Object.fromEntries(keys.map((k) => [k, values[k] ?? '']));
      await settingApi.save(payload, group);
      show(`${GROUPS[group].label} settings saved`);
    } catch (e) { show(e.response?.data?.message || 'Could not save', 'error'); }
    finally { setBusy(false); }
  };

  const saveProfile = async () => {
    setBusy(true);
    try {
      const u = await authApi.updateProfile(profile);
      setUser(u);
      localStorage.setItem('skv_user', JSON.stringify(u));
      show('Profile updated');
    } catch (e) { show(e.response?.data?.message || 'Could not update profile', 'error'); }
    finally { setBusy(false); }
  };

  const changePassword = async () => {
    setBusy(true);
    try {
      await authApi.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      show('Password changed');
    } catch (e) { show(e.response?.data?.message || 'Could not change password', 'error'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="skeleton" style={{ height: 400 }} />;

  return (
    <>
      <div className="tabs">
        {Object.entries(GROUPS).map(([key, g]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{g.label}</button>
        ))}
        <button className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>My Account</button>
      </div>

      {tab !== 'account' && (
        <Panel
          title={`${GROUPS[tab].label} Settings`}
          action={<button className="btn btn-purple btn-sm" onClick={() => save(tab)} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>}
        >
          <div className="grid grid-2" style={{ gap: 0, columnGap: 22 }}>
            {GROUPS[tab].fields.map(([key, label, type, hint]) => (
              <Field key={key} label={label} hint={hint} span={type === 'textarea'}>
                {type === 'textarea'
                  ? <textarea rows={3} value={values[key] || ''} onChange={set(key)} />
                  : <input value={values[key] || ''} onChange={set(key)} />}
              </Field>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'account' && (
        <div className="admin-grid-2">
          <Panel title="My Profile" action={<button className="btn btn-purple btn-sm" onClick={saveProfile} disabled={busy}>Save</button>}>
            <Field label="Email" hint="Your login email cannot be changed here.">
              <input value={user?.email || ''} disabled />
            </Field>
            <Field label="Name"><input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></Field>
            <Field label="Phone"><input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></Field>
            <Field label="Role"><input value={user?.role || ''} disabled /></Field>
          </Panel>

          <Panel title="Change Password" action={<button className="btn btn-purple btn-sm" onClick={changePassword} disabled={busy}>Update</button>}>
            <Field label="Current password">
              <input type="password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
            </Field>
            <Field label="New password" hint="At least 6 characters.">
              <input type="password" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
            </Field>
          </Panel>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onDone={clear} />
    </>
  );
}
