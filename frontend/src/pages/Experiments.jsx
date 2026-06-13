import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as experimentsAPI from '../api/experiments';
import * as usersAPI from '../api/users';
import { useAuth } from '../context/AuthContext';
import ExperimentCard from '../components/ui/ExperimentCard';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import CustomSelect from '../components/ui/CustomSelect';
import { SkeletonCard } from '../components/ui/LoadingSkeleton';
import AlertBanner from '../components/ui/AlertBanner';
import Modal from '../components/Modal';
import Avatar from '../components/ui/Avatar';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ic = ({ children, size = 16, stroke = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const PlusIcon    = ({ size = 16 }) => <Ic size={size}><path d="M12 5v14M5 12h14" /></Ic>;
const SearchIcon  = ({ size = 16 }) => <Ic size={size}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></Ic>;
const XIcon       = ({ size = 14 }) => <Ic size={size} stroke={2}><path d="M18 6L6 18M6 6l12 12" /></Ic>;
const ChevronIcon = ({ size = 14, up }) => <Ic size={size} stroke={2}><path d={up ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} /></Ic>;
const FlaskIcon   = ({ size = 40 }) => <Ic size={size} stroke={1.25}><path d="M9 3h6M9 3v6l-4 9a1 1 0 00.9 1.4h12.2A1 1 0 0023 18l-4-9V3" /></Ic>;
const FilterIcon  = ({ size = 15 }) => <Ic size={size} stroke={2}><path d="M3 6h18M7 12h10M10 18h4" /></Ic>;
const UserIcon    = ({ size = 14 }) => <Ic size={size}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></Ic>;
const CheckIcon   = ({ size = 12 }) => <Ic size={size} stroke={2.5}><polyline points="20 6 9 17 4 12" /></Ic>;

// ─── Constants ────────────────────────────────────────────────────────────────
const PREDEFINED_DOMAINS = ['Development', 'Design', 'Marketing', 'Sales', 'Research'];
const PHASES = [
  { value: 'IDEA',      label: 'Idea' },
  { value: 'BUILDING',  label: 'Building' },
  { value: 'TESTING',   label: 'Testing' },
  { value: 'DECISION',  label: 'Decision' },
  { value: 'COMPLETED', label: 'Completed' },
];
const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'my',     label: 'Mine' },
  { key: 'all',    label: 'All' },
  { key: 'completed', label: 'Completed' },
];

// ─── Phase dot colors ─────────────────────────────────────────────────────────
const PHASE_COLORS = {
  IDEA:      '#8B5CF6',
  BUILDING:  '#3B82F6',
  TESTING:   '#F59E0B',
  DECISION:  '#EF4444',
  COMPLETED: '#10B981',
};

// ─── UserPicker ───────────────────────────────────────────────────────────────
const UserPicker = ({ users, value, onChange, currentUser }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = value === currentUser?.uuid
    ? { name: 'Me', uuid: currentUser.uuid }
    : users.find(u => u.uuid === value);

  const filtered = [
    { uuid: currentUser?.uuid, name: 'Me', email: currentUser?.email },
    ...users.filter(u => u.uuid !== currentUser?.uuid),
  ].filter(u =>
    !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 36, padding: '0 12px',
          background: value ? 'var(--accent-coral-light)' : 'var(--bg-surface-alt)',
          border: `1px solid ${value ? 'var(--accent-coral)' : 'var(--border)'}`,
          borderRadius: 8, cursor: 'pointer',
          fontSize: 13, fontWeight: 500,
          color: value ? 'var(--accent-coral)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}
      >
        <UserIcon size={13} />
        <span>{selected ? selected.name : 'Owner'}</span>
        {value && (
          <span
            onClick={e => { e.stopPropagation(); onChange(''); }}
            style={{ display: 'flex', color: 'var(--accent-coral)', marginLeft: 2 }}
          >
            <XIcon size={12} />
          </span>
        )}
        {!value && <ChevronIcon size={12} up={open} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, zIndex: 200,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 220, overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--bg-surface-alt)', borderRadius: 6,
              padding: '6px 10px',
            }}>
              <SearchIcon size={13} />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search members..."
                style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {!q && (
              <button
                onClick={() => { onChange(''); setOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                All owners
              </button>
            )}
            {filtered.map(u => (
              <button
                key={u.uuid}
                onClick={() => { onChange(u.uuid); setOpen(false); setQ(''); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: value === u.uuid ? 'var(--bg-surface-alt)' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-alt)'}
                onMouseLeave={e => e.currentTarget.style.background = value === u.uuid ? 'var(--bg-surface-alt)' : 'none'}
              >
                <Avatar name={u.name} size="small" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
                {value === u.uuid && <CheckIcon size={13} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FilterChip ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onClick, onClear, color, bgColor }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 32, padding: '0 12px',
      background: active ? (bgColor || 'var(--accent-coral-light)') : 'var(--bg-surface-alt)',
      border: `1px solid ${active ? (color || 'var(--accent-coral)') : 'var(--border)'}`,
      borderRadius: 20, cursor: 'pointer',
      fontSize: 12, fontWeight: 600,
      color: active ? (color || 'var(--accent-coral)') : 'var(--text-secondary)',
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}
  >
    {color && active && (
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
    )}
    {label}
    {active && onClear && (
      <span
        onClick={e => { e.stopPropagation(); onClear(); }}
        style={{ display: 'flex', opacity: 0.7 }}
      >
        <XIcon size={11} />
      </span>
    )}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ExperimentsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();

  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [users, setUsers]             = useState([]);

  const [filter,         setFilter]         = useState(searchParams.get('view')   || 'active');
  const [searchQuery,    setSearchQuery]     = useState(searchParams.get('search') || '');
  const [selectedUser,   setSelectedUser]   = useState(searchParams.get('owner')  || '');
  const [selectedDomain, setSelectedDomain] = useState(searchParams.get('domain') || '');
  const [selectedPhase,  setSelectedPhase]  = useState(searchParams.get('phase')  || '');
  const [isOverdue,      setIsOverdue]      = useState(searchParams.get('overdue') === 'true');


  const [showCreateModal, setShowCreateModal] = useState(searchParams.get('create') === 'true');
  const [form,      setForm]      = useState({ title: '', domain: '', assumption: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [searchFocused, setSearchFocused] = useState(false);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };

  const loadUsers = useCallback(async () => {
    try {
      const r = await usersAPI.listUsers();
      setUsers(r.users || []);
    } catch {}
  }, []);

  const loadExperiments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await experimentsAPI.listExperiments(filter, {
        owner_uuid: selectedUser,
        domain:     selectedDomain,
        phase:      selectedPhase,
        overdue:    isOverdue,
      });
      setExperiments(r.experiments || []);
    } catch (err) {
      setError(err.message || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  }, [filter, selectedUser, selectedDomain, selectedPhase, isOverdue]);

  useEffect(() => { loadExperiments(); }, [loadExperiments]);
  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => {
    setFilter(searchParams.get('view') || 'active');
    setSearchQuery(searchParams.get('search') || '');
    setSelectedUser(searchParams.get('owner') || '');
    setSelectedDomain(searchParams.get('domain') || '');
    setSelectedPhase(searchParams.get('phase') || '');
    setIsOverdue(searchParams.get('overdue') === 'true');
    if (searchParams.get('create') === 'true') setShowCreateModal(true);
  }, [searchParams]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    setFormLoading(true);
    try {
      await experimentsAPI.createExperiment({
        title: form.title, domain: form.domain,
        assumption_statement: form.assumption, target_user: '',
      });
      setShowCreateModal(false);
      setForm({ title: '', domain: '', assumption: '' });
      await loadExperiments();
    } catch (err) {
      setFormError(err.message || 'Failed to create experiment');
    } finally {
      setFormLoading(false);
    }
  };

  const clearAll = () => {
    setSearchQuery(''); setSelectedDomain(''); setSelectedUser('');
    setSelectedPhase(''); setFilter('active'); setIsOverdue(false);
    setSearchParams({});
  };

  const filtered = experiments.filter(exp =>
    !searchQuery ||
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.owner_info?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasActiveFilters = selectedDomain || selectedUser || selectedPhase || isOverdue || filter !== 'active';
  const activeFilterCount = [selectedDomain, selectedUser, selectedPhase, isOverdue].filter(Boolean).length;

  const css = `
    @keyframes fadeSlide { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

    .ep-wrap { display:flex; flex-direction:column; gap:16px; max-width:1400px; margin:0 auto; width:100%; padding-top: 12px; }

    /* header row */
    .ep-header { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:0; }
    .ep-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; line-height:1.2; }
    .ep-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

    /* create button */
    .ep-create-btn {
      display:inline-flex; align-items:center; gap:7px;
      padding:9px 16px; border-radius:9px; border:none; cursor:pointer;
      font-size:13px; font-weight:600;
      background:var(--accent-coral); color:#fff;
      transition:opacity 0.15s; white-space:nowrap; flex-shrink:0;
    }
    .ep-create-btn:hover { opacity:0.88; }

    /* toolbar */
    .ep-toolbar {
      display:flex; flex-direction:column; gap:10px;
      background:var(--bg-surface); border:1px solid var(--border);
      border-radius:14px; padding:14px 16px;
    }

    /* row 1: search + tabs + filters all in one line */
    .ep-toolbar-top { display:flex; align-items:center; gap:8px; flex-wrap:nowrap; }

    /* search */
    .ep-search {
      display:flex; align-items:center; gap:10px; flex:1; min-width:180px;
      height:40px; padding:0 14px;
      background:var(--bg-surface-alt);
      border:1px solid var(--border); border-radius:10px;
      transition:border-color 0.2s, box-shadow 0.2s;
    }
    .ep-search.focused {
      border-color:var(--accent-coral);
      box-shadow:0 0 0 3px var(--accent-coral-light);
    }
    .ep-search svg { color:var(--text-muted); flex-shrink:0; }
    .ep-search input  { flex:1; border:none; background:none; outline:none; font-size:14px; color:var(--text-primary); }
    .ep-search input::placeholder { color:var(--text-muted); }

    /* tabs */
    .ep-tabs { display:flex; gap:2px; background:var(--bg-surface-alt); border-radius:8px; padding:3px; flex-shrink:0; }
    .ep-tab  {
      padding:5px 14px; border-radius:6px; border:none; cursor:pointer;
      font-size:13px; font-weight:500; color:var(--text-muted);
      background:none; transition:all 0.15s; white-space:nowrap;
    }
    .ep-tab.active { background:var(--bg-surface); color:var(--text-primary); font-weight:600; box-shadow:0 1px 3px rgba(0,0,0,0.1); }

    /* divider between tabs and filters */
    .ep-toolbar-divider { width:1px; height:24px; background:var(--border); flex-shrink:0; margin:0 4px; }

    /* clear all button */
    .ep-clear-all {
      font-size:12px; color:var(--text-muted); background:none; border:none; cursor:pointer;
      padding:4px 8px; border-radius:6px; font-weight:500; white-space:nowrap;
      transition:all 0.15s;
    }
    .ep-clear-all:hover { color:var(--text-primary); background:var(--bg-surface-alt); }

    /* phase chips - hidden on all screens */
    .ep-phase-filters { display:none; }

    /* count */
    .ep-count { font-size:13px; color:var(--text-muted); }
    .ep-count strong { color:var(--text-primary); font-weight:600; }

    /* grid */
    .ep-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; }

    /* modal fields */
    .ep-field { display:flex; flex-direction:column; gap:6px; }
    .ep-label { font-size:12px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.04em; }
    .ep-input {
      width:100%; padding:10px 14px; box-sizing:border-box;
      background:var(--bg-surface-alt); border:1px solid var(--border);
      border-radius:9px; font-size:14px; color:var(--text-primary); outline:none;
      transition:border-color 0.15s;
    }
    .ep-input:focus { border-color:var(--accent-coral); }

    /* mobile overrides */
    @media(max-width:600px) {
      .ep-title { font-size:22px; }
      .ep-toolbar { padding:10px; border-radius: 12px; }
      .ep-toolbar-top { flex-direction:row; flex-wrap:wrap; gap:8px; align-items:center; }
      .ep-search { order:1; flex: 0 0 100%; height:36px; padding:0 12px; }
      .ep-search input { font-size:13px; }
      .ep-tabs { order:2; flex: 0 0 100%; display:flex; }
      .ep-tab { flex:1; padding:6px 4px; font-size:12px; text-align:center; }
      .ep-toolbar-divider { display:none; }
      .ep-toolbar-top > div:not(.ep-search):not(.ep-tabs):not(.ep-toolbar-divider) { 
        order:3; flex: 1 1 calc(50% - 4px); min-width: 0; 
      }
      .ep-toolbar-top > div > select, .ep-toolbar-top > div > button:not(.ep-clear-all) { 
        height:36px; font-size:12px; width: 100%; 
      }
      .ep-toolbar-top > button.ep-clear-all { order:4; flex: 0 0 100%; text-align:center; padding:8px; }
      .ep-grid { grid-template-columns:1fr; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="ep-wrap">

        {/* ── Header ── */}
        <div className="ep-header">
          <div>
            <h1 className="ep-title">Experiments</h1>
            <p className="ep-sub">Track and manage your validation cycles</p>
          </div>
          
        </div>

        {/* ── Toolbar ── */}
        <div className="ep-toolbar">

          {/* Row 1: search + tabs + filters all in one line */}
          <div className="ep-toolbar-top">
            <div className={`ep-search${searchFocused ? ' focused' : ''}`}>
              <SearchIcon size={18} />
              <input
                placeholder="Search experiments..."
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    updateParam('search', searchQuery.trim());
                  }
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); updateParam('search', ''); }}
                  style={{ display: 'flex', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: '4px' }}>
                  <XIcon size={14} />
                </button>
              )}
            </div>

            <div className="ep-tabs">
              {TABS.map(t => (
                <button key={t.key} className={`ep-tab${filter === t.key ? ' active' : ''}`}
                  onClick={() => { setFilter(t.key); updateParam('view', t.key === 'active' ? '' : t.key); }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="ep-toolbar-divider" />

            {/* Filters inline */}
            {/* Domain select-chip */}
            <div style={{ position: 'relative' }}>
              <CustomSelect
                value={selectedDomain}
                onChange={v => { setSelectedDomain(v); updateParam('domain', v); }}
                options={[
                  { value: '', label: 'Department' },
                  ...PREDEFINED_DOMAINS.map(d => ({ value: d, label: d }))
                ]}
                placeholder="Department"
                clearable={true}
              />
            </div>

            {/* Owner picker — admin only */}
            {isAdmin && (
              <UserPicker
                users={users}
                value={selectedUser}
                onChange={v => { setSelectedUser(v); updateParam('owner', v); }}
                currentUser={user}
              />
            )}

            {isOverdue && (
              <FilterChip
                label="Overdue Items"
                active={true}
                color="var(--error)"
                bgColor="var(--error-light)"
                onClear={() => { setIsOverdue(false); updateParam('overdue', ''); }}
              />
            )}



            {/* Clear all — only when filters active */}
            {hasActiveFilters && (
              <button className="ep-clear-all" onClick={clearAll}>Clear all</button>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && <AlertBanner variant="error" onClose={() => setError('')}>{error}</AlertBanner>}

        {/* ── Count ──
        {!loading && filtered.length > 0 && (
          <div className="ep-count">
            <strong>{filtered.length}</strong> experiment{filtered.length !== 1 ? 's' : ''}
            {searchQuery && <span style={{ marginLeft: 4 }}>matching "<strong>{searchQuery}</strong>"</span>}
          </div>
        )} */}

        {/* ── Content ── */}
        {loading ? (
          <div className="ep-grid">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FlaskIcon}
            title={searchQuery ? 'No matches found' : 'No experiments yet'}
            description={
              searchQuery
                ? `No experiments match "${searchQuery}". Try a different search.`
                : 'Start by creating your first experiment.'
            }
            actionLabel="Create experiment"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="ep-grid">
            {filtered.map(exp => (
              <ExperimentCard key={exp.uuid} experiment={exp} currentUser={user} />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setFormError(''); setForm({ title: '', domain: '', assumption: '' }); }}
        title="New experiment"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={formLoading}>Create</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {formError && <AlertBanner variant="error" onClose={() => setFormError('')}>{formError}</AlertBanner>}

          <div className="ep-field">
            <label className="ep-label">Title <span style={{ color: 'var(--accent-coral)' }}>*</span></label>
            <input
              className="ep-input"
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., New onboarding flow"
              autoFocus
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">Department</label>
            <select
              className="ep-input"
              value={form.domain}
              onChange={e => setForm({ ...form, domain: e.target.value })}
              style={{ cursor: 'pointer' }}
            >
              <option value="">Select department…</option>
              {PREDEFINED_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="ep-field">
            <label className="ep-label">Assumption</label>
            <textarea
              className="ep-input"
              value={form.assumption}
              onChange={e => setForm({ ...form, assumption: e.target.value })}
              placeholder="We believe that…"
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>

          <div style={{
            padding: '11px 14px', borderRadius: 9,
            background: 'var(--accent-teal-light)',
            fontSize: 12, color: 'var(--accent-teal)', lineHeight: 1.6,
          }}>
            After creating, click "Start Building" to generate your timeline.
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ExperimentsPage;