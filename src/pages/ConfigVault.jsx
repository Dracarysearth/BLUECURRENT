import React from 'react';
import { Panel, SectionTitle, Button, Status, EmptyState } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';

function date(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

export default function ConfigVault({ drafts, onEdit, onDelete, onCreate }) {
  return (
    <div className="page-stack">
      <SectionTitle kicker="LOCAL DRAFTS / 05" title="Draft Library" description="Save and organize token drafts in this browser. Drafts are local working files; they are not on-chain Ammora Configs." right={<Button onClick={onCreate} icon="plus">Create Draft</Button>} />

      <div className="vault-stats">
        <div><span className="eyebrow">LOCAL DRAFTS</span><strong>{drafts.length}</strong></div>
        <div><span className="eyebrow">SAVED IN</span><strong>This browser</strong></div>
        <div><span className="eyebrow">ON-CHAIN CONFIGS</span><strong>Not created here</strong></div>
      </div>

      <Panel eyebrow="YOUR WORKSPACE" title="Saved Token Drafts">
        {drafts.length ? (
          <div className="vault-grid">
            {drafts.map((draft) => (
              <article className="vault-card" key={draft.id}>
                <div className="vault-card-top"><div className="vault-card-symbol">{String(draft.symbol || 'AB').slice(0, 2).toUpperCase()}</div><Status tone="neutral">Saved locally</Status></div>
                <h3>{draft.name || 'Untitled token'}</h3>
                <p>{draft.description || 'No project description added.'}</p>
                <div className="vault-card-meta"><span>SYMBOL</span><b>{draft.symbol || '—'}</b><span>V4 CONFIG ID</span><b>{draft.configId || 'Not selected'}</b><span>LAST UPDATED</span><b>{date(draft.updatedAt || draft.createdAt)}</b></div>
                <div className="vault-card-actions">
                  <Button variant="secondary" onClick={() => onEdit(draft)}>Open Draft</Button>
                  <button className="icon-button danger-hover" onClick={() => onDelete(draft.id)} aria-label={'Delete ' + draft.name}><Icon name="close" size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="vault" title="No saved drafts yet">Save a draft from Token Studio to keep its token details and Config ID in this browser.</EmptyState>
        )}
      </Panel>

      <div className="integrity-note"><Icon name="shield" size={17} /><span>Clearing this browser's site data or moving to another browser may remove these drafts. A local draft is not a registered Ammora Config and has no contract address, on-chain ownership or transaction status.</span></div>
    </div>
  );
}