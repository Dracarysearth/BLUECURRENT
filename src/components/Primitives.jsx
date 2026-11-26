import React from 'react';
import Icon from './Icons.jsx';

export function Panel({ children, className = '', title, eyebrow, action }) {
  return (
    <section className={'panel ' + className}>
      {(title || eyebrow || action) && (
        <div className="panel-heading">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({ children, variant = 'primary', icon, onClick, disabled = false, type = 'button', className = '', block = false }) {
  return (
    <button className={'button button-' + variant + (block ? ' button-block' : '') + ' ' + className} type={type} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function Status({ tone = 'neutral', children }) {
  return <span className={'status status-' + tone}><i />{children}</span>;
}

export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={'field ' + className}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function StatCard({ label, value, detail, icon, tone = 'blue' }) {
  return (
    <div className="stat-card">
      <div className={'stat-icon stat-icon-' + tone}><Icon name={icon} size={18} /></div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

export function EmptyState({ icon = 'vault', title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={22} /></div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function SectionTitle({ kicker, title, description, right }) {
  return (
    <div className="section-title">
      <div>
        <div className="eyebrow">{kicker}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {right && <div className="section-title-right">{right}</div>}
    </div>
  );
}
