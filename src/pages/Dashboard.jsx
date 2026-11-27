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
        kicker="PROTOCOL WORKSPACE / 01"
        title="Build with intent."
        description="A focused Ammora V4 workbench: inspect live Config policy, validate the deployment and review every wallet request before execution."
        right={<div className="hero-tag"><span className="hero-tag-dot" />TESTNET ENVIRONMENT</div>}
      />

      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="welcome-overline">GIWA SEPOLIA · SDK 0.3.9</div>
          <h2>From config<br /><em>to on-chain.</em></h2>
          <p>Start with a live V4 Config. Validate the contract deployment, simulate the SDK-built call and keep the final signature in your wallet.</p>
          <div className="welcome-actions">
            <Button onClick={() => onNavigate('token')} icon="arrow">Open Token Studio</Button>
            <a className="button button-secondary" href="https://docs.ammora.org/guides/launchpad" target="_blank" rel="noreferrer">
              <Icon name="external" size={15} /> SDK launch guide
            </a>
          </div>
        </div>
        <div className="blueprint-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
          <div className="blueprint-core"><span className="core-top">AMMORA</span><strong>AB</strong><span className="core-bottom">V4 / 91342</span></div>
          <span className="art-node node-a" /><span className="art-node node-b" /><span className="art-node node-c" />
          <span className="art-label art-label-a">CONFIG / V4</span><span className="art-label art-label-b">EXECUTION LAYER</span>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard label="Local configurations" value={drafts.length} detail="Saved in this browser only" icon="vault" tone="blue" />
        <StatCard label="Wallet session" value={walletAddress ? shortAddress(walletAddress) : 'Offline'} detail={walletAddress ? 'Connected EIP-1193 account' : 'Connect MetaMask to continue'} icon="wallet" tone="cyan" />
        <StatCard label="Launch transactions" value={activities.length} detail={confirmed + ' receipt-reconciled'} icon="activity" tone="green" />
        <StatCard label="Selected Config" value={configReview ? '#' + configReview.configId : '—'} detail={configReview ? 'Inspected at block ' + configReview.blockNumber : 'No on-chain Config inspected'} icon="shield" tone="amber" />
      </div>

      <section className="protocol-ribbon" aria-label="Protocol and deployment profile">
        <div className="protocol-fact">
          <span>SDK VERSION</span><strong>0.3.9</strong><small>Exact dependency pin</small>
        </div>
        <div className="protocol-fact">
          <span>NETWORK</span><strong>GIWA Sepolia</strong><small>Chain ID 91342</small>
        </div>
        <div className="protocol-fact">
          <span>DEPLOYMENT</span><strong>Auto-route V4</strong><small>SDK-selected profile</small>
        </div>
        <div className="protocol-fact">
          <span>AUTHORIZATION</span><strong>Wallet-first</strong><small>User signs each transaction</small>
        </div>
      </section>

      <section className="execution-path" aria-label="Supported launch workflow">
        <div className="execution-path-heading">
          <div><span className="eyebrow">SUPPORTED WORKFLOW</span><h2>From inspection to confirmed receipt</h2></div>
          <span className="execution-path-caption">CURRENT RELEASE</span>
        </div>
        <div className="execution-steps">
          <article className="execution-step is-live">
            <span className="execution-number">01</span>
            <div><strong>Inspect Config</strong><small>Registry, V4 core and runtime checks</small></div>
            <span className="execution-state">LIVE</span>
          </article>
          <article className="execution-step is-live">
            <span className="execution-number">02</span>
            <div><strong>Build & simulate</strong><small>SDK calldata at a confirmed block</small></div>
            <span className="execution-state">LIVE</span>
          </article>
          <article className="execution-step is-live">
            <span className="execution-number">03</span>
            <div><strong>Sign & reconcile</strong><small>Wallet approval and canonical receipt</small></div>
            <span className="execution-state">LIVE</span>
          </article>
          <article className="execution-step is-limited">
            <span className="execution-number">04</span>
            <div><strong>Trade & graduate</strong><small>Next lifecycle integration</small></div>
            <span className="execution-state">NEXT</span>
          </article>
        </div>
      </section>

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
              <span className="workflow-text"><strong>Policy Inspector</strong><small>Review the selected Config's actual graduation model, quote asset and LP policy.</small></span>
              <Icon name="arrow" size={17} />
            </button>
            <button className="workflow-row" onClick={() => onNavigate('vault')}>
              <span className="workflow-icon"><Icon name="vault" /></span>
              <span className="workflow-text"><strong>Draft Vault</strong><small>Organize local drafts without confusing them with on-chain Configs.</small></span>
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

      <Panel eyebrow="RELEASE SCOPE / TRANSPARENT BY DESIGN" title="A focused V4 launch workspace">
        <div className="scope-release-grid">
          <div>
            <Status tone="success">Implemented</Status>
            <ul>
              <li>GIWA Sepolia chain and SDK deployment identity checks</li>
              <li>Confirmed-block V4 Config reads and complete runtime/source verification before launch review</li>
              <li>SDK-built token + pre-graduation curve creation</li>
              <li>Wallet simulation, explicit signing and receipt/event reconciliation</li>
            </ul>
          </div>
          <div>
            <Status tone="warning">Not in this release</Status>
            <ul>
              <li>ALC swap quotes and pre-graduation trading</li>
              <li>Final fill, graduation and migration recovery</li>
              <li>ARL pool / LP position management</li>
              <li>Creator, Partner and LP fee claims</li>
              <li>On-chain Config authoring</li>
            </ul>
          </div>
        </div>
        <div className="integrity-note"><Icon name="shield" size={16} /><span>“Auto-route” is the SDK deployment-generation name. This release sends the V4 Launch Factory call only; it does not provide aggregation-router or native-route execution. Read the <a href="https://docs.ammora.org/guides/launchpad" target="_blank" rel="noreferrer">official launchpad lifecycle guide</a> for the remaining stages.</span></div>
      </Panel>

      <Panel eyebrow="FOR REVIEWERS & BUILDERS" title="Technical references" action={<Status tone="success">Public source</Status>}>
        <div className="resource-grid">
          <a className="resource-card" href="https://docs.ammora.org/guides/launchpad" target="_blank" rel="noreferrer">
            <span className="resource-icon"><Icon name="book" size={18} /></span>
            <span className="resource-copy"><strong>Official launchpad guide</strong><small>SDK workflow, Config policy and lifecycle boundaries</small></span>
            <Icon name="external" size={15} />
          </a>
          <a className="resource-card" href="https://github.com/AmmoraLabs/ammora-examples" target="_blank" rel="noreferrer">
            <span className="resource-icon"><Icon name="code" size={18} /></span>
            <span className="resource-copy"><strong>Official SDK examples</strong><small>Reference implementations for SDK 0.3.9</small></span>
            <Icon name="external" size={15} />
          </a>
          <a className="resource-card" href="https://github.com/Dracarysearth/BLUECURRENT" target="_blank" rel="noreferrer">
            <span className="resource-icon"><Icon name="github" size={18} /></span>
            <span className="resource-copy"><strong>Project source code</strong><small>Independent build · Vite · React · viem</small></span>
            <Icon name="external" size={15} />
          </a>
        </div>
        <div className="integrity-note"><Icon name="shield" size={16} /><span>This is an independent community build, not an official Ammora product. The current release creates a V4 token and pre-graduation curve; unsupported lifecycle actions are disclosed rather than simulated in the UI.</span></div>
      </Panel>

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
