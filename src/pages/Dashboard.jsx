import React from 'react';
import { Panel, SectionTitle, StatCard, Status, Button, EmptyState } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';
import { shortAddress } from '../lib/wallet.js';

function timeLabel(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Dashboard({
  walletAddress, walletChainId, drafts, activities, configReview, onNavigate,
  deploymentStatus, onVerifyDeployment, verificationBusy,
}) {
  const confirmed = activities.filter((item) => item.status === 'confirmed').length;
  const latest = activities.slice(0, 4);
  const verified = deploymentStatus?.status === 'verified';

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="CONTROL ROOM / 01"
        title="Build with intent."
        description="A focused launch workspace for the Ammora ecosystem on GIWA Sepolia."
        right={<div className="hero-tag"><span className="hero-tag-dot" />TESTNET ENVIRONMENT</div>}
      />

      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-overline">DESIGN. CONFIGURE. DEPLOY.</div>
          <h2>Bring your token<br /><em>to the blueprint.</em></h2>
          <p>Shape the launch parameters, inspect the immutable Config and review every transaction before it reaches your wallet.</p>
          <Button onClick={() => onNavigate('token')} icon="arrow">Open Token Studio</Button>
        </div>
        <div className="blueprint-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="blueprint-core"><span className="core-top">AMMORA</span><strong>AB</strong><span className="core-bottom">V4 / 91342</span></div>
          <span className="art-node node-a" /><span className="art-node node-b" /><span className="art-node node-c" />
          <span className="art-label art-label-a">CONFIG / 04</span><span className="art-label art-label-b">EXECUTION LAYER</span>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard label="Local configurations" value={drafts.length} detail="Saved in this browser only" icon="vault" tone="blue" />
        <StatCard label="Wallet session" value={walletAddress ? shortAddress(walletAddress) : 'Offline'} detail={walletAddress ? 'Connected EIP-1193 account' : 'Connect MetaMask to continue'} icon="wallet" tone="cyan" />
        <StatCard label="Launch transactions" value={activities.length} detail={confirmed + ' receipt-reconciled'} icon="activity" tone="green" />
        <StatCard label="Selected Config" value={configReview ? '#' + configReview.configId : '—'} detail={configReview ? 'Inspected at block ' + configReview.blockNumber : 'No on-chain Config inspected'} icon="shield" tone="amber" />
      </div>

      <div className="dashboard-grid">
        <Panel className="quick-panel" eyebrow="WORKFLOW" title="Your workspace">
          <div className="workflow-list">
            <button className="workflow-row" onClick={() => onNavigate('token')}>
              <span className="workflow-icon"><Icon name="token" /></span>
              <span className="workflow-text"><strong>Token Studio</strong><small>Configure token identity and inspect a V4 launch Config.</small></span>
              <Icon name="arrow" size={17} />
            </button>
            <button className="workflow-row" onClick={() => onNavigate('liquidity')}>
              <span className="workflow-icon"><Icon name="liquidity" /></span>
              <span className="workflow-text"><strong>Liquidity Lab</strong><small>Review actual Config allocation data and pool models.</small></span>
              <Icon name="arrow" size={17} />
            </button>
            <button className="workflow-row" onClick={() => onNavigate('vault')}>
              <span className="workflow-icon"><Icon name="vault" /></span>
              <span className="workflow-text"><strong>Config Vault</strong><small>Organize local drafts without confusing them with chain state.</small></span>
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </Panel>

        <Panel className="network-panel" eyebrow="CONNECTION" title="Network & wallet">
          <div className="network-readout">
            <div className="network-emblem"><span /></div>
            <div><strong>GIWA Sepolia</strong><small>SDK-selected auto-route / V4 deployment</small></div>
            <Status tone={verified ? 'success' : deploymentStatus?.status === 'error' ? 'warning' : 'neutral'}>
              {verified ? 'Runtime verified' : deploymentStatus?.status === 'error' ? 'Check incomplete' : 'Not verified'}
            </Status>
          </div>
          <div className="readout-line"><span>Chain ID</span><strong className="mono">91342</strong></div>
          <div className="readout-line"><span>Wallet</span><strong className="mono">{walletAddress ? shortAddress(walletAddress) : 'Not connected'}</strong></div>
          <div className="readout-line"><span>Wallet network</span><strong>{walletChainId ? (walletChainId === 91342 ? 'GIWA Sepolia' : 'Chain ' + walletChainId) : 'Unknown'}</strong></div>
          <div className="readout-line"><span>Runtime contracts</span><strong>{verified ? deploymentStatus.runtimeContractsVerified + ' verified' : 'Not checked'}</strong></div>
          <div className="readout-line"><span>Explorer contracts</span><strong>{verified ? deploymentStatus.explorer.length + ' source verified' : 'Not checked'}</strong></div>
          {deploymentStatus?.status === 'error' && <div className="inline-warning">{deploymentStatus.message}</div>}
          {verified && <div className="verification-foot">Verified at confirmed block <span className="mono">{deploymentStatus.blockNumber}</span> · slot <span className="mono">{deploymentStatus.slot}</span></div>}
          <Button block variant="secondary" onClick={onVerifyDeployment} disabled={verificationBusy} icon="shield">
            {verificationBusy ? 'Verifying deployment…' : verified ? 'Run verification again' : 'Verify deployment'}
          </Button>
        </Panel>
      </div>

      <Panel eyebrow="RECENT ACTIVITY" title="Latest launch actions" action={<Button variant="ghost" onClick={() => onNavigate('activity')}>View activity <Icon name="arrow" size={14} /></Button>}>
        {latest.length ? (
          <div className="activity-list">
            {latest.map((item) => (
              <div className="activity-row" key={item.id}>
                <span className="activity-icon"><Icon name="token" size={16} /></span>
                <div className="activity-main">
                  <strong>{item.tokenName || 'Token launch'} <small>{item.tokenSymbol ? '(' + item.tokenSymbol + ')' : ''}</small></strong>
                  <span className="mono">{item.txHash ? shortAddress(item.txHash) : 'No transaction hash'}</span>
                </div>
                <span className="activity-time">{timeLabel(item.createdAt)}</span>
                <Status tone={item.status === 'confirmed' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'}>
                  {String(item.status || 'pending').replaceAll('_', ' ')}
                </Status>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="activity" title="No launch activity yet">
            Only transactions submitted by this browser are recorded here. On-chain history is not indexed globally.
          </EmptyState>
        )}
      </Panel>

      <div className="integrity-note"><Icon name="shield" size={17} /><span><strong>Safety boundary</strong> — previews and local drafts are not deployments. A launch is marked reconciled only after a successful receipt and the SDK LaunchCreated event match the reviewed Config identity.</span></div>
    </div>
  );
}
