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
  return String(status || 'pending').replaceAll('_', ' ');
}

export default function Activity({ items, onRefresh, busy, onCopy, explorerUrl }) {
  return (
    <div className="page-stack">
      <SectionTitle kicker="TRANSACTION JOURNAL / 06" title="Activity" description="A local transaction journal for launches submitted by this browser. No network-wide history is fabricated." right={<Button variant="secondary" onClick={onRefresh} disabled={busy || !items.some((item) => ['pending', 'confirmed_unreconciled'].includes(item.status))} icon="clock">{busy ? 'Checking…' : 'Reconcile receipts'}</Button>} />

      <div className="activity-summary-strip">
        <div><span className="eyebrow">RECORDED</span><strong>{items.length}</strong></div>
        <div><span className="eyebrow">CONFIRMED & PARSED</span><strong>{items.filter((item) => item.status === 'confirmed').length}</strong></div>
        <div><span className="eyebrow">PENDING / REVIEW</span><strong>{items.filter((item) => ['pending', 'confirmed_unreconciled'].includes(item.status)).length}</strong></div>
      </div>

      <Panel eyebrow="ON-CHAIN SUBMISSIONS" title="Launch transactions">
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
          <EmptyState icon="activity" title="No transactions recorded">When a launch is submitted through this app, its hash and receipt status will appear here. Failed reads remain pending until a canonical receipt is found.</EmptyState>
        )}
      </Panel>

      <div className="integrity-note"><Icon name="shield" size={17} /><span>A submitted hash is not a completed launch. Receipt status, emitted token/curve addresses, Config ID and Config hash must be reconciled before success is shown. Receipt lookup errors are not treated as failure.</span></div>
    </div>
  );
}