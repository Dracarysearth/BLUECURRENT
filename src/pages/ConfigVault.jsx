import React from 'react';
import { Panel, SectionTitle, Button, Status, EmptyState } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';

function date(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export default function ConfigVault({ drafts, onEdit, onDelete, onCreate }) {
  return (
    <div className="page-stack">
      <SectionTitle kicker="LOCAL CONFIGURATION / 05" title="Config Vault" description="Your working set of saved token drafts. These records live in browser local storage, not on-chain." right={<Button onClick={onCreate} icon="plus">New draft</Button>} />

      <div className="vault-stats">
        <div><span className="eyebrow">LOCAL DRAFTS</span><strong>{drafts.length}</strong></div>
        <div><span className="eyebrow">STORAGE</span><strong>Browser localStorage</strong></div>
        <div><span className="eyebrow">ON-CHAIN CONFIGS</span><strong>Not managed here</strong></div>
      </div>

      <Panel eyebrow="SAVED CONFIGURATIONS" title="Draft library">
        {drafts.length ? (
          <div className="vault-grid">
            {drafts.map((draft) => (
              <article className="vault-card" key={draft.id}>
                <div className="vault-card-top"><div className="vault-card-symbol">{String(draft.symbol || 'AB').slice(0, 2).toUpperCase()}</div><Status tone="neutral">Local draft</Status></div>
                <h3>{draft.name || 'Untitled token'}</h3>
                <p>{draft.description || 'No description added.'}</p>
                <div className="vault-card-meta"><span>SYMBOL</span><b>{draft.symbol || '—'}</b><span>CONFIG ID</span><b>{draft.configId || 'Not selected'}</b><span>UPDATED</span><b>{date(draft.updatedAt || draft.createdAt)}</b></div>
                <div className="vault-card-actions">
                  <Button variant="secondary" onClick={() => onEdit(draft)}>Edit draft</Button>
                  <button className="icon-button danger-hover" onClick={() => onDelete(draft.id)} aria-label={'Delete ' + draft.name}><Icon name="close" size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="vault" title="Your vault is empty">Save a Token Studio draft to keep token identity and its Config selection in this browser.</EmptyState>
        )}
      </Panel>

      <div className="integrity-note"><Icon name="shield" size={17} /><span>Deleting browser data or switching browsers can remove these drafts. A local draft is not a registered Ammora Config and has no contract address, ownership or transaction status.</span></div>
    </div>
  );
}