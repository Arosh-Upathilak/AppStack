'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import Icon from '@/components/Icon';
import { getMe, updateProfile, type MeUser } from '@/lib/api/user';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ProfilePanel() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMe()
      .then(u => {
        setMe(u);
        setFirstName(u.firstName ?? '');
        setLastName(u.lastName ?? '');
        setAvatarUrl(u.avatarUrl ?? undefined);
      })
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image is too large (max 2MB).');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
    } catch {
      toast.error('Could not read that image.');
    }
  }

  async function onSave() {
    setSaving(true);
    try {
      const updated = await updateProfile({ firstName, lastName, avatarUrl });
      setMe(updated);
      setFirstName(updated.firstName ?? '');
      setLastName(updated.lastName ?? '');
      setAvatarUrl(updated.avatarUrl ?? undefined);
      toast.success('Profile updated');
    } catch {
      toast.error('Could not update your profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="muted" style={{ fontSize: 13 }}>Loading…</div>;
  if (!me?.email) return <div className="muted" style={{ fontSize: 13 }}>Not signed in.</div>;

  const initial = (firstName || me.email).charAt(0).toUpperCase();
  const roles = me.role ?? [];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>Profile</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-4)', marginTop: 2 }}>
          Your account information. To request a deletion or export, contact support.
        </div>
      </div>

      <div className="card" style={{ padding: 20, display: 'grid', gap: 18 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--brand-soft, var(--line-soft, #eef2ff))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink-2)' }}>{initial}</span>
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Icon name="edit" size={14} /> Upload photo
            </button>
            {avatarUrl && (
              <button
                type="button"
                className="btn"
                style={{ marginLeft: 8 }}
                onClick={() => setAvatarUrl(undefined)}
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Name fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="First name">
            <input
              className="input"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </Field>
          <Field label="Last name">
            <input
              className="input"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </Field>
        </div>

        <Row label="Email" value={me.email} />
        <Row label="Roles" value={roles.length ? roles.join(', ') : 'None'} />
        {me.sellerStatus && <Row label="Seller status" value={me.sellerStatus} />}

        <div>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/forgot" className="btn">
          <Icon name="lock" size={14} /> Change password
        </a>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center' }}>
      <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink-1)' }}>{value}</div>
    </div>
  );
}
