import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as usersAPI from '../api/users';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/ui/CustomSelect';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, strokeWidth = 1.75, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const SearchIcon = ({ size }) => <Icon size={size} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />;
const CrownIcon  = ({ size }) => <Icon size={size} strokeWidth={2} d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />;
const PowerIcon  = ({ size }) => <Icon size={size} strokeWidth={2}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></Icon>;
const DotsIcon   = ({ size }) => <Icon size={size} strokeWidth={2}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></Icon>;
const UsersIcon  = ({ size }) => <Icon size={size}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></Icon>;
const CheckIcon  = ({ size }) => <Icon size={size} strokeWidth={2.5} d="M20 6L9 17l-5-5" />;
const XIcon      = ({ size }) => <Icon size={size} strokeWidth={2} d="M18 6L6 18M6 6l12 12" />;
const AlertIcon  = ({ size }) => <Icon size={size} strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Icon>;
const FlaskIcon  = ({ size }) => <Icon size={size} d="M9 3h6M9 3v6l-4 9a1 1 0 00.9 1.4h12.2A1 1 0 0023 18l-4-9V3" />;

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px', borderRadius: 10,
        background: t.type === 'success' ? '#0f172a' : '#DC2626',
        color: '#fff', fontSize: 13, fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        animation: 'tp-slideUp 0.2s ease',
        maxWidth: 300,
      }}>
        {t.type === 'success' ? <CheckIcon size={14} /> : <AlertIcon size={14} />}
        {t.message}
      </div>
    ))}
  </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skel = ({ w, h, r = 6 }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: 'var(--border)', opacity: 0.45, animation: 'tp-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
);

const SkeletonRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
    <Skel w={36} h={36} r={50} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <Skel w="55%" h={12} />
      <Skel w="70%" h={11} />
    </div>
    <Skel w={58} h={22} r={20} />
    <Skel w={66} h={22} r={20} />
    <Skel w={28} h={28} r={6} />
  </div>
);

// ─── ActionMenu ───────────────────────────────────────────────────────────────
const ActionMenu = ({ u, currentUser, isAdmin, onDeactivate, onActivate, onViewExperiments }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!isAdmin || u.uuid === currentUser?.uuid) return null;

  // Decide if dropdown should open upward based on position in viewport
  const [openUp, setOpenUp] = useState(false);
  const btnRef = useRef(null);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setOpenUp(rect.bottom + 160 > window.innerHeight);
    }
    setOpen(o => !o);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          width: 30, height: 30, borderRadius: 6,
          border: '1px solid var(--border)',
          background: open ? 'var(--bg-surface-alt)' : 'transparent',
          color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        <DotsIcon size={15} />
      </button>

      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            zIndex: 9998,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            minWidth: 190,
            overflow: 'hidden',
            // position calculated via useLayoutEffect below
          }}
          ref={el => {
            if (el && btnRef.current) {
              const rect = btnRef.current.getBoundingClientRect();
              const dropH = el.offsetHeight || 100;
              const spaceBelow = window.innerHeight - rect.bottom;
              if (spaceBelow < dropH + 8) {
                el.style.top = `${rect.top - dropH - 4}px`;
              } else {
                el.style.top = `${rect.bottom + 4}px`;
              }
              const dropW = el.offsetWidth || 190;
              const rightEdge = rect.right;
              if (rightEdge - dropW < 8) {
                el.style.left = `${rect.left}px`;
              } else {
                el.style.left = `${rect.right - dropW}px`;
              }
            }
          }}
        >
          <MItem icon={<FlaskIcon size={14} />} label="View experiments"
            onClick={() => { setOpen(false); onViewExperiments(u); }} />
          <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
          {u.is_active
            ? <MItem icon={<PowerIcon size={14} />} label="Deactivate user" danger
                onClick={() => { setOpen(false); onDeactivate(u); }} />
            : <MItem icon={<PowerIcon size={14} />} label="Activate user" success
                onClick={() => { setOpen(false); onActivate(u); }} />
          }
        </div>
      )}
    </div>
  );
};

const MItem = ({ icon, label, danger, success, onClick }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
    padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap',
    color: danger ? '#DC2626' : success ? '#059669' : 'var(--text-primary)',
    transition: 'background 0.12s',
  }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-alt)'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}
  >
    {icon}{label}
  </button>
);

// ─── Main ────────────────────────────────────────────────────────────────────
const TeamPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy]           = useState('name');
  const [showModal, setShowModal]     = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reason, setReason]           = useState('');
  const [toasts, setToasts]           = useState([]);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const r = await usersAPI.listUsers();
      setUsers(r.users || []);
    } catch (err) {
      addToast(err.message || 'Failed to load team', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser || deactivating) return;
    const name = selectedUser.name;
    setDeactivating(true);
    try {
      await usersAPI.deactivateUser(selectedUser.uuid, reason);
      setUsers(prev => prev.map(u => u.uuid === selectedUser.uuid ? { ...u, is_active: false } : u));
      setShowModal(false); setReason(''); setSelectedUser(null);
      addToast(`${name} deactivated`);
    } catch (err) {
      addToast(err.message || 'Failed to deactivate', 'error');
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async (u) => {
    try {
      await usersAPI.activateUser(u.uuid);
      setUsers(prev => prev.map(x => x.uuid === u.uuid ? { ...x, is_active: true } : x));
      addToast(`${u.name} activated`);
    } catch (err) {
      addToast(err.message || 'Failed to activate', 'error');
    }
  };

  const activeCount   = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      const ms = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
      const mr = roleFilter === 'ALL' || u.role === roleFilter;
      const mx = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.is_active : !u.is_active);
      return ms && mr && mx;
    })
    .sort((a, b) => sortBy === 'role' ? a.role.localeCompare(b.role) : a.name.localeCompare(b.name));

  const css = `
    @keyframes tp-slideUp  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes tp-pulse    { 0%,100% { opacity:.45; } 50% { opacity:.2; } }
    @keyframes tp-fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes spin        { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .tp-wrap  { display:flex; flex-direction:column; gap:18px; padding-top: 12px; }

    /* ── stats ── */
    .tp-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }

    .tp-stat  {
      background:var(--bg-surface); border:1px solid var(--border);
      border-radius:14px; padding:16px 20px;
      display:flex; flex-direction:column; gap:2px;
    }
    .tp-stat-val { font-size:28px; font-weight:700; line-height:1.1; }
    .tp-stat-lbl { font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em; margin-top:2px; }

    /* ── toolbar ── */
    .tp-toolbar {
      background:var(--bg-surface); border:1px solid var(--border);
      border-radius:14px; padding:12px 14px;
      display:flex; gap:8px; align-items:center; flex-wrap:wrap;
    }
    .tp-search {
      flex:1; min-width:160px;
      display:flex; align-items:center; gap:8px;
      background:var(--bg-surface-alt); border:1px solid var(--border);
      border-radius:8px; padding:0 12px; height:36px;
      transition:border-color 0.15s;
    }
    .tp-search:focus-within { border-color:var(--accent-coral,#E8522A); }
    .tp-search input {
      flex:1; background:none; border:none; outline:none;
      font-size:13px; color:var(--text-primary); min-width:0;
    }
    .tp-search input::placeholder { color:var(--text-muted); }
    .tp-sel-wrap {
      width: 140px; flex-shrink: 0;
      display: flex;
    }

    /* ── table card ── */
    .tp-card {
      background:var(--bg-surface); border:1px solid var(--border);
      border-radius:14px;
      /* NO overflow:hidden — it clips dropdowns */
    }
    .tp-card-hd {
      display:flex; align-items:center; justify-content:space-between;
      padding:13px 20px; border-bottom:1px solid var(--border);
      border-radius:14px 14px 0 0;
    }
    .tp-card-hd-title { font-size:14px; font-weight:600; color:var(--text-primary); }
    .tp-card-hd-count { font-size:12px; color:var(--text-muted); }

    /* col headers */
    .tp-thead {
      display:grid;
      grid-template-columns: minmax(0,2fr) minmax(0,2fr) 96px 88px 36px;
      padding:0 20px; border-bottom:1px solid var(--border);
    }
    .tp-th {
      padding:9px 0; font-size:11px; font-weight:600;
      color:var(--text-muted); text-transform:uppercase; letter-spacing:.06em;
    }

    /* rows */
    .tp-row {
      display:grid;
      grid-template-columns: minmax(0,2fr) minmax(0,2fr) 96px 88px 36px;
      padding:0 20px; align-items:center;
      border-bottom:1px solid var(--border);
      transition:background 0.13s;
    }
    .tp-row:last-child  { border-bottom:none; border-radius:0 0 14px 14px; }
    .tp-row:hover       { background:var(--bg-surface-alt); }
    .tp-cell            { padding:12px 0; min-width:0; }

    .tp-name  { font-size:14px; font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tp-email { font-size:12px; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px; }

    .tp-badge {
      display:inline-flex; align-items:center; gap:4px;
      padding:3px 9px; border-radius:20px;
      font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em;
      white-space:nowrap;
    }
    .tp-badge.active   { background:var(--success-light); color:var(--success); }
    .tp-badge.inactive { background:var(--error-light); color:var(--error); }
    .tp-badge.admin    { background:var(--accent-coral-light,#FFEAE6); color:var(--accent-coral,#E8522A); }
    .tp-badge.member   { background:var(--bg-surface-alt); color:var(--text-secondary); border:1px solid var(--border); }

    /* empty */
    .tp-empty { text-align:center; padding:56px 24px; }
    .tp-empty-icon  { color:var(--text-muted); margin:0 auto 14px; }
    .tp-empty-title { font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:5px; }
    .tp-empty-sub   { font-size:13px; color:var(--text-muted); }

    /* modal */
    .tp-backdrop {
      position:fixed; inset:0; background:rgba(0,0,0,0.4);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; padding:16px; animation:tp-fadeIn 0.15s ease;
    }
    .tp-modal {
      background:var(--bg-surface); border-radius:16px; padding:24px;
      max-width:400px; width:100%;
      box-shadow:0 24px 48px -8px rgba(0,0,0,0.25);
    }

    /* ── Mobile ── */
    @media(max-width:640px) {
      .tp-thead { grid-template-columns: minmax(0,1fr) 80px 32px; }
      .tp-row   { grid-template-columns: minmax(0,1fr) 80px 32px; padding:0 12px; }
      .tp-th-email, .tp-th-role, .tp-cell-email, .tp-cell-role { display:none; }

      .tp-card-hd { padding:11px 14px; }
      .tp-cell    { padding:11px 0; }
      .tp-name    { font-size:13px; }

      .tp-stats { grid-template-columns:repeat(3,1fr); gap:8px; }
      .tp-stat  { padding:12px 14px; border-radius:12px; }
      .tp-stat-val { font-size:22px; }
      .tp-stat-lbl { font-size:10px; }

      .tp-toolbar { padding:10px 12px; border-radius:12px; flex-wrap:wrap; }
      .tp-search  { flex:0 0 100%; order:-1; }
      .tp-sel-wrap { flex:1 1 calc(50% - 9px); min-width:0; width: auto; }

      .tp-badge { padding:2px 7px; font-size:10px; }
    }

    @media(max-width:400px) {
      .tp-stats { grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .tp-stat { padding: 10px 8px; }
      .tp-stat-val { font-size: 18px; }
      .tp-stat-lbl { font-size: 9px; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <Toast toasts={toasts} />

      <div className="tp-wrap">

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: 'var(--text-primary)', margin: 0 }}>Team</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0' }}>Manage your team members and their roles.</p>
        </div>

        {/* Stats — 3 cards only */}
        {!loading && (
          <div className="tp-stats">
            <div className="tp-stat">
              <div className="tp-stat-val" style={{ color: 'var(--text-primary)' }}>{users.length}</div>
              <div className="tp-stat-lbl">Total</div>
            </div>
            <div className="tp-stat">
              <div className="tp-stat-val" style={{ color: '#059669' }}>{activeCount}</div>
              <div className="tp-stat-lbl">Active</div>
            </div>
            <div className="tp-stat">
              <div className="tp-stat-val" style={{ color: '#DC2626' }}>{inactiveCount}</div>
              <div className="tp-stat-lbl">Inactive</div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="tp-toolbar">
          <div className="tp-search">
            <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}><SearchIcon size={14} /></span>
            <input
              placeholder="Search name, email, role…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                <XIcon size={13} />
              </button>
            )}
          </div>
          <div className="tp-sel-wrap">
            <CustomSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'ALL', label: 'All roles' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'MEMBER', label: 'Member' }
              ]}
              clearable={false}
            />
          </div>
          <div className="tp-sel-wrap">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
              clearable={false}
            />
          </div>
          {/* <select className="tp-sel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">A → Z</option>
            <option value="role">By role</option>
          </select> */}
        </div>

        {/* Table */}
        <div className="tp-card">
          <div className="tp-card-hd">
            <span className="tp-card-hd-title">Members</span>
            <span className="tp-card-hd-count">{filtered.length} of {users.length}</span>
          </div>

          {/* Column headers */}
          <div className="tp-thead">
            <div className="tp-th">Member</div>
            <div className="tp-th tp-th-email">Email</div>
            <div className="tp-th tp-th-role">Role</div>
            <div className="tp-th">Status</div>
            <div className="tp-th" />
          </div>

          {loading ? (
            [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="tp-empty">
              <div className="tp-empty-icon"><UsersIcon size={38} /></div>
              <div className="tp-empty-title">No members found</div>
              <div className="tp-empty-sub">Try adjusting your search or filters</div>
            </div>
          ) : filtered.map(u => (
            <div key={u.uuid} className="tp-row">

              {/* Member */}
              <div className="tp-cell" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar name={u.name} size="medium" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="tp-name">
                    {u.name}
                    {u.uuid === user?.uuid && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 5 }}>you</span>
                    )}
                  </div>
                  {/* email shown inline on mobile since col is hidden */}
                  <div className="tp-email" style={{ display: 'none' }} aria-hidden="true" />
                </div>
              </div>

              {/* Email — desktop only */}
              <div className="tp-cell tp-cell-email" style={{ minWidth: 0 }}>
                <div className="tp-email">{u.email}</div>
              </div>

              {/* Role — desktop only */}
              <div className="tp-cell tp-cell-role">
                <span className={`tp-badge ${u.role === 'ADMIN' ? 'admin' : 'member'}`}>
                  {u.role === 'ADMIN' && <CrownIcon size={10} />}
                  {u.role}
                </span>
              </div>

              {/* Status */}
              <div className="tp-cell">
                <span className={`tp-badge ${u.is_active ? 'active' : 'inactive'}`}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Actions */}
              <div className="tp-cell" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ActionMenu
                  u={u}
                  currentUser={user}
                  isAdmin={isAdmin}
                  onDeactivate={u => { setSelectedUser(u); setReason(''); setShowModal(true); }}
                  onActivate={handleActivate}
                  onViewExperiments={u => navigate(`/experiments?owner=${u.uuid}`)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deactivate Modal */}
      {showModal && (
        <div className="tp-backdrop" onClick={() => setShowModal(false)}>
          <div className="tp-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#DC2626' }}>
                <AlertIcon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Deactivate user</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedUser?.name}</p>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                <XIcon size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              This user will lose access immediately and cannot log in until reactivated.
            </p>

            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g., No longer with the company"
              style={{
                width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                background: 'var(--bg-surface-alt)', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 13, color: 'var(--text-primary)',
                outline: 'none', minHeight: 76, resize: 'vertical', marginBottom: 20,
                fontFamily: 'inherit',
              }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: 'var(--bg-surface-alt)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                style={{
                  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#DC2626', color: '#fff', border: 'none',
                  cursor: deactivating ? 'not-allowed' : 'pointer',
                  opacity: deactivating ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {deactivating ? (
                  <>
                    <div style={{
                      width: '14px', height: '14px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Deactivating...</span>
                  </>
                ) : (
                  <span>Deactivate</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamPage;