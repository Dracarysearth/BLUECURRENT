import React from 'react';
import { Panel, SectionTitle, Button, Status, EmptyState } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';
import { shortAddress } from '../lib/wallet.js';

function time(value) {
  return value ? new Date(value).toLocaleString() : '—';
}
function statusTone(status) {
  if (status === 'confirmed') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'confirmed_unreconciled') return 'warning';
  return 'neutral';
}
function statusText(status) {
  const labels = {
    confirmed: 'Confirmed',
    failed: 'Reverted',
    pending: 'Pending',
    confirmed_unreconciled: 'Receipt needs review',
  };
  return labels[status] || 'Status unavailable';
}

export default function Activity({ items, onRefresh, busy, onCopy, explorerUrl }) {
  return (
    <div className="page-stack">
      <SectionTitle kicker="TRANSACTION HISTORY / 06" title="Activity Log" description="Review launches submitted from this browser and reconcile transactions that are still pending. This is not a complete wallet or network-wide history." right={<Button variant="secondary" onClick={onRefresh} disabled={busy || !items.some((item) => ['pending', 'confirmed_unreconciled'].includes(item.status))} icon="clock">{busy ? 'Checking…' : 'Refresh pending receipts'}</Button>} />

      <div className="activity-summary-strip">
        <div><span className="eyebrow">TRANSACTIONS</span><strong>{items.length}</strong></div>
        <div><span className="eyebrow">CONFIRMED LAUNCHES</span><strong>{items.filter((item) => item.status === 'confirmed').length}</strong></div>
        <div><span className="eyebrow">PENDING / NEEDS REVIEW</span><strong>{items.filter((item) => ['pending', 'confirmed_unreconciled'].includes(item.status)).length}</strong></div>
      </div>

      <Panel eyebrow="SUBMITTED TRANSACTIONS" title="Launch activity">
        {items.length ? (
          <div className="transaction-list">
            {items.map((item) => {
              const link = explorerUrl(item.txHash);
              return (
                <article className="transaction-card" key={item.id}>
                  <div className="transaction-icon"><Icon name="token" size={19} /></div>
                  <div className="transaction-body">
                    <div className="transaction-title-row"><strong>{item.tokenName || 'Token launch'} <span>{item.tokenSymbol ? '$' + item.tokenSymbol : ''}</span></strong><Status tone={statusTone(item.status)}>{statusText(item.status)}</Status></div>
                    <div className="transaction-detail-grid">
                      <div><small>TRANSACTION HASH</small><button className="mono text-copy" onClick={() => onCopy(item.txHash)}>{shortAddress(item.txHash)} <Icon name="copy" size={13} /></button></div>
                      <div><small>CONFIG</small><strong>#{item.configId || '—'}</strong></div>
                      <div><small>CREATOR</small><strong className="mono">{shortAddress(item.wallet)}</strong></div>
                      <div><small>SUBMITTED</small><strong>{time(item.createdAt)}</strong></div>
                    </div>
                    {item.tokenAddress && <div className="parsed-row"><span>Token <b className="mono">{item.tokenAddress}</b></span><span>Curve <b className="mono">{item.curveAddress}</b></span></div>}
                    {item.blockNumber && <div className="receipt-block">Receipt block <b className="mono">{item.blockNumber}</b></div>}
                    {item.message && <div className="inline-warning">{item.message}</div>}
                  </div>
                  <div className="transaction-actions">
                    {link ? <a href={link} target="_blank" rel="noreferrer" className="icon-button" aria-label="Open explorer"><Icon name="external" size={17} /></a> : <span className="no-explorer" title="No explorer URL is published in the selected SDK chain catalog">Explorer unavailable</span>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="activity" title="No launch transactions yet">Transactions submitted through this application will appear here with their hash and receipt status. A failed receipt lookup remains pending; it is never treated as a transaction failure.</EmptyState>
        )}
      </Panel>

      <div className="integrity-note"><Icon name="shield" size={17} /><span>A transaction hash alone does not confirm a launch. The canonical receipt, emitted token and curve addresses, Config ID and Config hash must be reconciled before the activity is marked as confirmed. A receipt lookup error is not treated as a revert.</span></div>
    </div>
  );
}