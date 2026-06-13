import React, { useState, useRef, useEffect } from 'react';

// Icons
const ChevronIcon = ({ size = 12, up = false, style }) => (
  <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform={up ? "rotate(180)" : ""}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const XIcon = ({ size = 12, style }) => (
  <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CustomSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select...',
  icon: Icon,
  clearable = true,
  defaultColor = 'var(--text-secondary)'
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));
  // Default values that should not trigger "active" styling
  const isDefault = !value || value === 'ALL' || value === '';

  return (
    <div ref={ref} style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, width: '100%' }}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen(o => !o); }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          height: 36, padding: '0 12px', width: '100%',
          background: !isDefault ? 'var(--accent-coral-light)' : 'var(--bg-surface-alt)',
          border: `1px solid ${!isDefault ? 'var(--accent-coral)' : 'var(--border)'}`,
          borderRadius: 8, cursor: 'pointer',
          fontSize: 13, fontWeight: 500,
          color: !isDefault ? 'var(--accent-coral)' : defaultColor,
          whiteSpace: 'nowrap', transition: 'all 0.15s',
          outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          {Icon && <Icon size={13} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {!isDefault && clearable && (
            <span
              onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
              style={{ display: 'flex', color: 'var(--accent-coral)', padding: '2px' }}
            >
              <XIcon size={12} />
            </span>
          )}
          {(!clearable || isDefault) && <ChevronIcon size={12} up={open} />}
        </div>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 42, left: 0, zIndex: 200,
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: '100%', overflow: 'hidden',
          maxHeight: 220, overflowY: 'auto'
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, 
                color: String(opt.value) === String(value) ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: String(opt.value) === String(value) ? 600 : 400,
                textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-alt)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
