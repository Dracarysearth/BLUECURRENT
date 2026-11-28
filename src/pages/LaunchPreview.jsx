import React, { useEffect, useState } from 'react';
import { Panel, SectionTitle, Button, Status, EmptyState } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';
import { CHAIN_ID } from '../lib/ammora.js';

function formatBytes(data) {
  return typeof data === 'string' && data.startsWith('0x') ? Math.max(0, (data.length - 2) / 2) : '—';
}

function raw(value) {
  if (value === null || value === undefined) return 'Not exposed';
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function safeJson(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2);
}

function resultTitle(status) {
  const labels = {
    confirmed: 'Launch confirmed',
    failed: 'Transaction reverted',
    pending: 'Transaction submitted',
    confirmed_unreconciled: 'Receipt needs review',
  };
  return labels[status] || 'Transaction status';
}

export default function LaunchPreview({ preview, walletAddress, walletChainId, onNavigate, onSimulate, onExecute, busy, error, result }) {
  const [confirmed, setConfirmed] = useState(false);
  const [qualificationConfirmed, setQualificationConfirmed] = useState(false);

  useEffect(() => {
    // Wallet identity, network or payload changes invalidate both explicit authorizations.
    setConfirmed(false);
    setQualificationConfirmed(false);
  }, [
    preview?.configHash,
    preview?.form?.name,
    preview?.form?.symbol,
    preview?.form?.metadataURI,
    walletAddress,
    walletChainId,
  ]);

  if (!preview) {
    return (
      <div className="page-stack">
        <SectionTitle kicker="TRANSACTION REVIEW / 04" title="Transaction Review" description="Your launch review will appear here after a V4 Config has been inspected and a transaction has been prepared." />
        <Panel>
          <EmptyState icon="preview" title="No Transaction Prepared">Open Token Studio, inspect a V4 Config and prepare your launch. The transaction details will appear here before you open your wallet for approval.</EmptyState>
          <div className="center-action"><Button onClick={() => onNavigate('token')}>Go to Token Studio</Button></div>
        </Panel>
      </div>
    );
  }

  const value = preview.transaction?.value ?? 0n;
  const data = preview.transaction?.data;
  const config = preview.config || {};
  const liquidity = config.liquidityDistribution || {};
  const rightNetwork = walletChainId === CHAIN_ID;
  const submitted = Boolean(result?.hash);
  const canSign = Boolean(walletAddress && rightNetwork && preview.simulation === 'passed' && qualificationConfirmed && confirmed && !busy && !submitted);

  return (
    <div className="page-stack">
      <SectionTitle kicker="TRANSACTION REVIEW / 04" title="Review Your Launch" description="Inspect the token details, immutable Config, contract target and simulation result before opening your wallet." right={<Status tone={preview.simulation === 'passed' ? 'success' : 'warning'}>{preview.simulation === 'passed' ? 'Simulation Passed' : 'Simulation Required'}</Status>} />
      {result && (
        <div className={'result-banner result-' + result.status}>
          <Icon name={result.status === 'confirmed' ? 'check' : result.status === 'failed' ? 'close' : 'clock'} size={18} />
          <div>
            <strong>{resultTitle(result.status)}</strong>
            <span>{result.message || (result.tokenAddress ? 'The SDK event matched the reviewed Config. Token and curve addresses were taken from the canonical receipt.' : 'The transaction is not yet fully reconciled.')}</span>
            {result.tokenAddress && <div className="result-addresses"><span>Token <b className="mono">{result.tokenAddress}</b></span><span>Curve <b className="mono">{result.curveAddress}</b></span></div>}
          </div>
        </div>
      )}
      <div className="review-grid">
        <div className="page-stack">
          <Panel eyebrow="TOKEN / REVIEWED IDENTITY" title={preview.form.name}>
            <div className="review-token-row">
              <div className="review-token-mark">{String(preview.form.symbol || 'AB').slice(0, 2).toUpperCase()}</div>
              <div><strong>{preview.form.name} <span className="muted">({preview.form.symbol})</span></strong><small>{preview.form.metadataURI}</small></div>
            </div>
            <div className="review-data-grid">
              <div><small>Supply Planning Note</small><strong>{preview.form.totalSupply || 'Not specified'}</strong><em>Off-chain note only; not included in the launch call</em></div>
              <div><small>Token Decimals</small><strong>{preview.tokenDecimals}</strong></div>
              <div><small>Creator</small><strong className="mono">{walletAddress || 'Connect Wallet'}</strong></div>
              <div><small>Selected Config</small><strong>#{preview.configId}</strong></div>
            </div>
            <div className="inline-warning">The supply value above is a local planning note only. Ammora V4 uses the selected Config's immutable launch economics; this application does not override those parameters.</div>
          </Panel>
          <Panel eyebrow="TRANSACTION / BUILT BY SDK" title="Transaction Details">
            <div className="target-card">
              <div><small>Contract target</small><strong className="mono">{preview.factory}</strong></div>
              <div><small>Native value</small><strong className="mono">{String(value)} wei</strong></div>
              <div><small>Transaction data size</small><strong className="mono">{formatBytes(data)} bytes</strong></div>
              <div><small>Token approvals</small><strong>This call does not include an ERC-20 approval</strong></div>
              <div><small>Prepared at snapshot</small><strong className="mono">Block {preview.blockNumber}</strong></div>
            </div>
            <details className="raw-details"><summary>Inspect SDK Transaction Payload <Icon name="chevron" size={15} /></summary><pre>{JSON.stringify({ to: preview.factory, data, value: String(value) }, null, 2)}</pre></details>
          </Panel>
          <Panel eyebrow="POLICY / IMMUTABLE CONFIG" title="Config Identity">
            <div className="readout-line"><span>Config ID</span><strong>#{preview.configId}</strong></div>
            <div className="readout-line"><span>Config Hash</span><strong className="mono hash-wrap">{String(preview.configHash)}</strong></div>
            <div className="readout-line"><span>Deployment</span><strong>GIWA auto-route V4 · Chain {CHAIN_ID}</strong></div>
            <div className="readout-line"><span>Pool Creation Fee</span><strong className="mono">{preview.poolCreationFee} wei</strong></div>
            <div className="readout-line"><span>Quote Token</span><strong className="mono">{raw(config.quoteToken)}</strong></div>
            <div className="readout-line"><span>Config Owner</span><strong className="mono">{raw(preview.identity?.owner)}</strong></div>
            <div className="readout-line"><span>Fee Claimer</span><strong className="mono">{raw(preview.identity?.feeClaimer)}</strong></div>
            <div className="readout-line"><span>Migration Model</span><strong>{Number(config.migrationMode) === 0 ? 'Concentrated (0)' : 'Not supported here'}</strong></div>
            <div className="readout-line"><span>Migration Quote Threshold</span><strong className="mono">{raw(config.migrationQuoteThreshold)}</strong></div>
            <div className="readout-line"><span>Migration Base Threshold</span><strong className="mono">{raw(config.migrationBaseThreshold)}</strong></div>
            <div className="readout-line"><span>Cliff Fee</span><strong>{raw(config.cliffFeeBps)} bps</strong></div>
            <div className="readout-line"><span>Creator Share</span><strong>{raw(config.creatorShareOfNonProtocolBps)} bps</strong></div>
            <div className="readout-line"><span>Partner Recipient</span><strong className="mono hash-wrap">{raw(config.partnerRecipient)}</strong></div>
            <div className="readout-line"><span>Liquidity Partner</span><strong className="mono hash-wrap">{raw(liquidity.partner)}</strong></div>
            <div className="readout-line"><span>Leftover Receiver</span><strong className="mono hash-wrap">{raw(config.leftoverReceiver)}</strong></div>
            <div className="readout-line"><span>LP Permanent Locks</span><strong>Partner {raw(liquidity.partnerPermanentLockedBps)} bps · Creator {raw(liquidity.creatorPermanentLockedBps)} bps</strong></div>
            <div className="readout-line"><span>Supported Pre-Launch Checks</span><strong>WETH · base threshold 0 · positive quote threshold</strong></div>
            <div className="readout-line"><span>Runtime Code Checks</span><strong>{preview.deploymentVerification?.runtimeContractsVerified ?? '—'} contracts</strong></div>
            <div className="readout-line"><span>Explorer Source Checks</span><strong>{preview.deploymentVerification?.explorer?.length ?? '—'} addresses checked separately</strong></div>
            <div className="readout-line"><span>Runtime Snapshot</span><strong className="mono">Block {preview.deploymentVerification?.blockNumber ?? preview.blockNumber} · {preview.deploymentVerification?.slot ?? 'auto-route'}</strong></div>
            <details className="raw-details">
              <summary>Inspect the complete SDK Config <Icon name="chevron" size={15} /></summary>
              <pre>{safeJson(config)}</pre>
            </details>
            <div className="inline-success">
              The implemented pre-sign checks passed for this Config snapshot: the supported GIWA WETH quote path, migrationBaseThreshold = 0, positive total and quote thresholds, and Concentrated migration mode. These checks are repeated before signing, but they are not a full graduation-readiness certification.
            </div>
            <div className="inline-warning">
              These checks do not prove that the full migration will succeed. Independently review the complete sale and graduation budget, quote-token decimals, partner and creator recipients, fee schedule, liquidity allocation, permanent locks and vesting. This application does not calculate all destination-liquidity economics or execute final fills, graduation, migration or pool claims.
            </div>
          </Panel>
        </div>
        <aside className="page-stack">
          <Panel eyebrow="PRE-SIGN CHECKLIST" title="Wallet Authorization">
            <div className="checklist">
              <div className="checklist-item"><Status tone="success">Passed</Status><span>SDK selected GIWA Sepolia auto-route V4 deployment.</span></div>
              <div className="checklist-item"><Status tone="success">Passed</Status><span>Config enabled state and hash inspected at a confirmed snapshot.</span></div>
              <div className="checklist-item"><Status tone="success">Passed</Status><span>{preview.deploymentVerification?.runtimeContractsVerified ?? 0} SDK-pinned runtime contracts and {preview.deploymentVerification?.explorer?.length ?? 0} Explorer sources verified.</span></div>
              <div className="checklist-item"><Status tone="success">Passed</Status><span>Supported WETH quote path, zero base threshold, positive supply thresholds and Concentrated migration mode checked.</span></div>
              <div className="checklist-item"><Status tone={walletAddress ? 'success' : 'warning'}>{walletAddress ? 'Ready' : 'Required'}</Status><span>Creator wallet connected: {walletAddress ? walletAddress.slice(0, 8) + '…' : 'not connected'}.</span></div>
              <div className="checklist-item"><Status tone={rightNetwork ? 'success' : 'warning'}>{rightNetwork ? 'Ready' : 'Required'}</Status><span>Wallet network is {rightNetwork ? 'GIWA Sepolia' : 'not GIWA Sepolia'}.</span></div>
              <div className="checklist-item"><Status tone={preview.simulation === 'passed' ? 'success' : 'warning'}>{preview.simulation === 'passed' ? 'Passed' : 'Required'}</Status><span>The same SDK-generated transaction was simulated on a public RPC.</span></div>
            </div>
            {!walletAddress && <Button block onClick={() => onNavigate('dashboard')} variant="secondary">Connect Your Wallet</Button>}
            {walletAddress && !rightNetwork && <div className="inline-warning">Switch your wallet to GIWA Sepolia before continuing.</div>}
            {error && <div className="inline-error">{error}</div>}
            <Button block variant="secondary" onClick={onSimulate} disabled={!walletAddress || !rightNetwork || busy || submitted} icon="shield">{busy ? 'Checking…' : 'Run Simulation'}</Button>
            <label className="confirmation-check">
              <input type="checkbox" checked={qualificationConfirmed} disabled={submitted} onChange={(event) => setQualificationConfirmed(event.target.checked)} />
              <span>I have independently reviewed this Config's quote asset, supply, fee recipients, liquidity allocation, locks, vesting and estimated graduation reserves against the official launchpad guide. I understand that this is my own attestation, not an automated certification.</span>
            </label>
            <label className="confirmation-check">
              <input type="checkbox" checked={confirmed} disabled={submitted} onChange={(event) => setConfirmed(event.target.checked)} />
              <span>I have reviewed the Config hash, contract address, transaction value, token details and connected creator address. I am ready to review the transaction in my wallet.</span>
            </label>
            <Button block onClick={onExecute} disabled={!canSign} icon="wallet">{submitted ? 'Submitted — View Activity' : busy ? 'Preparing…'  : 'Review in Wallet'}</Button>
            <p className="fine-print">This release creates the token and its pre-graduation curve only. It does not support swaps, final fills, graduation or migration, ARL pool trades, LP claims, or creator and partner fee claims. Your wallet displays the transaction for final approval. This application never requests or stores private keys. Do not submit again while an earlier transaction is pending or awaiting reconciliation.</p>
            <p className="fine-print"><a href="https://docs.ammora.org/guides/launchpad" target="_blank" rel="noreferrer">Read the Official Ammora SDK Launchpad Guide</a></p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
