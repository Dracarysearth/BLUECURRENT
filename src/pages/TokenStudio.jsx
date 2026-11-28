import React from 'react';
import { Panel, SectionTitle, Field, Button, Status } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';

function raw(value) {
  if (value === null || value === undefined) return 'Not exposed';
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function safeJson(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2);
}

export default function TokenStudio({
  form, setForm, configReview, onInspectConfig, onSaveDraft, onPreview,
  onInvalidatePreview, onInvalidateConfigReview, busy, error, notice,
}) {
  const update = (key, value) => {
    onInvalidatePreview?.();
    if (key === 'configId' && String(value) !== String(configReview?.configId ?? '')) {
      onInvalidateConfigReview?.();
    }
    setForm((current) => ({ ...current, [key]: value }));
  };
  const config = configReview?.entry?.config;
  const identity = configReview?.entry?.identity || {};
  const liquidity = config?.liquidityDistribution || {};
  const matched = Boolean(configReview && String(configReview.configId) === String(form.configId));
  const usable = Boolean(matched && configReview.entry.enabled && Number(form.decimals) === Number(config.tokenDecimals));

  return (
    <div className="page-stack">
      <SectionTitle kicker="TOKEN SETUP / 02" title="Token Studio" description="Prepare your token details, inspect a live V4 Config and review the exact settings that will govern the launch." right={<Status tone={usable ? 'success' : 'neutral'}>{usable ? 'Config verified' : 'Review required'}</Status>} />

      <div className="studio-layout">
        <div className="page-stack">
          <Panel eyebrow="01 / TOKEN DETAILS" title="Token information">
            <div className="form-grid">
              <Field label="Token Name">
                <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Ammora Blueprint" maxLength={64} />
              </Field>
              <Field label="Token Symbol" hint="2–12 alphanumeric characters">
                <input value={form.symbol} onChange={(event) => update('symbol', event.target.value.toUpperCase())} placeholder="e.g. BLUE" maxLength={12} />
              </Field>
              <Field label="Supply Planning Note" hint="For your reference only. This value is not sent on-chain; the selected immutable Config determines the launch supply.">
                <input value={form.totalSupply} onChange={(event) => update('totalSupply', event.target.value)} inputMode="decimal" placeholder="1000000000" />
              </Field>
              <Field label="Token Decimals" hint={config ? 'Selected Config requires ' + config.tokenDecimals : 'Inspect a Config to confirm the required decimals'}>
                <select value={form.decimals} onChange={(event) => update('decimals', event.target.value)}>
                  <option value="6">6 decimals</option><option value="7">7 decimals</option><option value="8">8 decimals</option><option value="9">9 decimals</option>
                </select>
              </Field>
              <Field label="Project Description" className="field-full" hint="Saved in this browser's draft. Publish the final description in the metadata document referenced by the URI.">
                <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Describe the token, its purpose and the community behind it." rows={3} maxLength={500} />
              </Field>
              <Field label="Metadata URI" className="field-full" hint="Use an HTTPS, IPFS or Arweave URI. Host the metadata document separately before launching.">
                <input value={form.metadataURI} onChange={(event) => update('metadataURI', event.target.value)} placeholder="ipfs://... or https://..." />
              </Field>
            </div>
          </Panel>

          <Panel eyebrow="02 / LAUNCH CONFIGURATION" title="Choose an existing V4 Config">
            <div className="config-select-row">
              <Field label="V4 Config ID" hint="Enter a Config ID you have independently selected. No Config is selected automatically.">
                <input value={form.configId} onChange={(event) => update('configId', event.target.value.replace(/[^\d]/g, ''))} inputMode="numeric" placeholder="Enter Config ID" />
              </Field>
              <Button onClick={onInspectConfig} disabled={busy || !form.configId} icon="shield">{busy ? 'Inspecting…' : 'Inspect Config'}</Button>
            </div>
            {error && <div className="inline-error"><Icon name="shield" size={16} />{error}</div>}
            {notice && <div className="inline-success"><Icon name="check" size={16} />{notice}</div>}
            {matched && (
              <div className="config-inspection">
                <div className="config-inspection-top">
                  <div><span className="eyebrow">INSPECTED CONFIG</span><strong>Config #{configReview.configId}</strong></div>
                  <Status tone={configReview.entry.enabled ? 'success' : 'warning'}>{configReview.entry.enabled ? 'Enabled' : 'Disabled'}</Status>
                </div>
                <div className="inspection-grid">
                  <div><small>Config hash</small><span className="mono hash-wrap">{String(configReview.entry.configHash)}</span></div>
                  <div><small>Token decimals</small><strong>{config.tokenDecimals}</strong></div>
                  <div><small>Pool creation fee</small><span className="mono">{String(config.poolCreationFee)} wei</span></div>
                  <div><small>Confirmed snapshot</small><span className="mono">Block {configReview.blockNumber}</span></div>
                </div>
                <div className="inspection-foot"><Icon name="shield" size={15} />V4 core, runtime bytecode and Factory implementation identities were checked against the SDK's 12-confirmation snapshot. Explorer source verification was checked separately for those addresses. The documented WETH quote-asset and zero base-threshold checks also passed. These checks do not certify the full ALC-to-ARL lifecycle or fee-claim flows.</div>
              </div>
            )}
            {Number(form.configId) === 6 && <div className="inline-error"><Icon name="shield" size={16} />Config #6 is affected and blocked for new launches on this GIWA registry.</div>}
          </Panel>

          {matched && (
            <Panel eyebrow="03 / IMMUTABLE LAUNCH SETTINGS" title="Full Config review">
              <div className="policy-readout-grid">
                <div><small>Quote token</small><strong className="mono">{raw(config.quoteToken)}</strong></div>
                <div><small>Config owner</small><strong className="mono">{raw(identity.owner)}</strong></div>
                <div><small>Fee claimer</small><strong className="mono">{raw(identity.feeClaimer)}</strong></div>
                <div><small>Immutable total supply</small><strong className="mono">{raw(config.totalSupply)}</strong></div>
                <div><small>Migration model</small><strong>{Number(config.migrationMode) === 0 ? 'Concentrated (0)' : 'Unsupported by this workspace'}</strong></div>
                <div><small>Token decimals</small><strong>{raw(config.tokenDecimals)}</strong></div>
                <div><small>Migration quote threshold</small><strong className="mono">{raw(config.migrationQuoteThreshold)}</strong></div>
                <div><small>Migration base threshold</small><strong className="mono">{raw(config.migrationBaseThreshold)}</strong></div>
                <div><small>Cliff fee</small><strong>{raw(config.cliffFeeBps)} bps</strong></div>
                <div><small>Creator share (non-protocol)</small><strong>{raw(config.creatorShareOfNonProtocolBps)} bps</strong></div>
                <div><small>Migration quote fee</small><strong>{raw(config.migrationQuoteFeeBps)} bps</strong></div>
                <div><small>Post-migration fee</small><strong>{raw(config.postMigrationFeeBps)} bps</strong></div>
                <div><small>Partner recipient</small><strong className="mono">{raw(config.partnerRecipient)}</strong></div>
                <div><small>Liquidity partner</small><strong className="mono">{raw(liquidity.partner)}</strong></div>
                <div><small>Leftover receiver</small><strong className="mono">{raw(config.leftoverReceiver)}</strong></div>
                <div><small>Partner permanently locked</small><strong>{raw(liquidity.partnerPermanentLockedBps)} bps</strong></div>
                <div><small>Creator permanently locked</small><strong>{raw(liquidity.creatorPermanentLockedBps)} bps</strong></div>
                <div><small>Partner unlocked at graduation</small><strong>{raw(liquidity.partnerUnlockedBps)} bps</strong></div>
                <div><small>Partner vesting allocation</small><strong>{raw(liquidity.partnerVesting?.allocationBps)} bps</strong></div>
                <div><small>Creator vesting allocation</small><strong>{raw(liquidity.creatorVesting?.allocationBps)} bps</strong></div>
                <div><small>Locked base vesting</small><strong className="mono">{raw(config.lockedBaseVesting?.cliffUnlockAmount)} raw units at the cliff</strong></div>
                <div><small>Curve segments</small><strong>{configReview.entry.segments?.length ?? 0}</strong></div>
                <div><small>Supported pre-launch checks</small><strong>WETH · base threshold = 0 · Concentrated mode</strong></div>
              </div>
              <details className="raw-details">
                <summary>View full SDK Config and curve segments <Icon name="chevron" size={15} /></summary>
                <pre>{safeJson({ config, segments: configReview.entry.segments ?? [], identity })}</pre>
              </details>
              <div className="inline-warning">
                An enabled Config and a successful read do not guarantee that a launch can graduate successfully. Before signing, independently review the quote asset, sale and total supply, migration reserves, fee recipients, liquidity allocation, locks and vesting against the official SDK guide. This application does not calculate or certify those economics.
              </div>
            </Panel>
          )}

          <div className="form-actions">
            <Button variant="secondary" onClick={onSaveDraft} icon="vault">Save Draft</Button>
            <Button onClick={onPreview} disabled={!usable || busy} icon="arrow">Review Launch</Button>
          </div>
        </div>

        <aside className="page-stack">
          <Panel className="token-card-panel" eyebrow="LIVE PREVIEW" title="Token Preview">
            <div className="token-preview-card">
              <div className="token-preview-top"><span className="token-chip">TOKEN / V4</span><span className="preview-glow" /></div>
              <div className="token-monogram">{(form.symbol || 'AB').slice(0, 2).toUpperCase()}</div>
              <h3>{form.name || 'Your token name'}</h3>
              <div className="token-symbol">{form.symbol ? '$' + form.symbol : '$SYMBOL'}</div>
              <p>{form.description || 'Your project description will appear here.'}</p>
              <div className="token-preview-meta"><span>SUPPLY NOTE</span><strong>{form.totalSupply || 'Not set'}</strong></div>
              <div className="token-preview-meta"><span>DECIMALS</span><strong>{form.decimals}</strong></div>
            </div>
          </Panel>

          <Panel eyebrow="TRANSACTION SCOPE" title="What this launch uses">
            <div className="scope-list">
              <div><Icon name="check" /><span>Launch builder: <b>buildCreateAmmoraV4Launch</b></span></div>
              <div><Icon name="check" /><span>Selected SDK deployment: <b>GIWA auto-route V4</b></span></div>
              <div><Icon name="check" /><span>Creator address: <b>connected wallet</b></span></div>
              <div className="scope-muted"><Icon name="clock" /><span>The supply planning note is not a launch argument. The selected Config defines the on-chain supply and launch economics.</span></div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}