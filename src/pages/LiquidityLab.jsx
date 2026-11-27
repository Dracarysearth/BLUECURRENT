import React from 'react';
import { Panel, SectionTitle, Status, Button, EmptyState } from '../components/Primitives.jsx';
import Icon from '../components/Icons.jsx';

function safeJson(value) {
  return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2);
}

export default function LiquidityLab({ configReview, onNavigate }) {
  const config = configReview?.entry?.config;
  const distribution = config?.liquidityDistribution;
  const segments = configReview?.entry?.segments || [];
  const mode = config?.migrationMode;
  const modeNumber = mode === null || mode === undefined ? null : Number(mode);
  const concentratedMode = modeNumber === 0;
  const compoundingMode = modeNumber === 1;
  const quoteFields = config
    ? Object.entries(config).filter(([key]) => /quote/i.test(key))
    : [];

  return (
    <div className="page-stack">
      <SectionTitle
        kicker="CONFIG POLICY / 03"
        title="Configuration Policy"
        description="Review the selected Config's quote asset, migration model, fee terms, liquidity allocations and vesting rules. This screen reads Config data; it does not manage live pools or positions."
        right={<Status tone={config ? 'success' : 'neutral'}>{config ? 'Config data loaded' : 'No Config selected'}</Status>}
      />

      {!config ? (
        <Panel>
          <EmptyState icon="liquidity" title="No Config selected">
            Quote asset, liquidity allocation and migration settings come from the immutable on-chain Config. Open Token Studio and inspect the Config you intend to review.
          </EmptyState>
          <div className="center-action"><Button onClick={() => onNavigate('token')}>Open Token Studio</Button></div>
        </Panel>
      ) : (
        <>
          <div className="liquidity-hero">
            <div>
              <span className="eyebrow">CONFIGURATION SNAPSHOT</span>
              <h2>Config #{configReview.configId}</h2>
              <p>Registry snapshot at block <span className="mono">{configReview.blockNumber}</span></p>
            </div>
            <div className="liquidity-hero-right">
              <Status tone={configReview.entry.enabled ? 'success' : 'warning'}>{configReview.entry.enabled ? 'Enabled' : 'Disabled'}</Status>
              <span className="mono">{String(configReview.entry.configHash).slice(0, 18)}…</span>
            </div>
          </div>

          <div className="liquidity-grid">
            <Panel eyebrow="01 / POOL MODEL" title="Graduation model">
              <div className="model-compare">
                <div className={'model-card ' + (concentratedMode ? 'model-selected' : '')}>
                  <div className="model-card-icon"><Icon name="activity" size={20} /></div>
                  <strong>Concentrated</strong><span>Migration mode 0</span>
                  <p>Liquidity is organized around a price range. Position shape and range selection affect capital efficiency and execution exposure.</p>
                  {concentratedMode && <Status tone="success">Selected in Config</Status>}
                </div>
                <div className={'model-card ' + (compoundingMode ? 'model-selected' : '')}>
                  <div className="model-card-icon"><Icon name="liquidity" size={20} /></div>
                  <strong>Compounding</strong><span>Migration mode 1</span>
                  <p>Liquidity uses the protocol's compounding position model. Reinvestment mechanics and position rules are Config-dependent.</p>
                  {compoundingMode && <Status tone="success">Selected in Config</Status>}
                </div>
              </div>
              {mode === null || mode === undefined
                ? <div className="inline-warning">The Config did not expose a migrationMode field in this SDK result. No pool model is inferred.</div>
                : null}
            </Panel>

            <Panel eyebrow="02 / QUOTE ASSET" title="Quote-asset settings">
              {quoteFields.length ? (
                <div className="quote-field-list">
                  {quoteFields.map(([key, value]) => (
                    <div className="readout-line" key={key}>
                      <span>{key}</span>
                      <strong className="mono">{typeof value === 'object' ? safeJson(value) : String(value)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="vault" title="Quote asset not exposed">
                  The SDK response does not expose a field identifying the quote asset. Review the complete Config data below; this application will not infer an address.
                </EmptyState>
              )}
              <p className="muted-small">This panel displays only SDK-returned Config fields whose names include “quote”. No asset address is inferred from a symbol or interface default.</p>
            </Panel>
          </div>

          <div className="liquidity-grid">
            <Panel eyebrow="03 / ALLOCATION POLICY" title="Liquidity policy fields">
              {distribution && Object.keys(distribution).length ? (
                <>
                  <div className="allocation-visual">
                    <div className="allocation-ring"><div><strong>{Object.keys(distribution).length}</strong><span>POLICY<br />FIELDS</span></div></div>
                    <div className="allocation-legend">
                      {Object.entries(distribution).map(([key, value]) => (
                        <div className="allocation-item" key={key}>
                          <span className="allocation-dot" />
                          <div><strong>{key}</strong><small className="mono">{typeof value === 'object' ? 'Structured value' : String(value)}</small></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="muted-small">This is a map of the fields returned by the Config, not a percentage chart. No allocation percentages are calculated unless the SDK provides a supported normalized value.</p>
                </>
              ) : (
                <EmptyState icon="vault" title="No distribution object">The selected Config response does not expose a liquidityDistribution object.</EmptyState>
              )}
            </Panel>

            <Panel eyebrow="04 / POSITION MANAGEMENT" title="Live position data">
              <div className="position-unavailable">
                <div className="position-unavailable-icon"><Icon name="clock" size={20} /></div>
                <Status tone="warning">Not available in this release</Status>
                <h3>No pool selected</h3>
                <p>A Config is not a pool or a liquidity position. This release does not include a verified pool-selection or position-quoting flow, so token amounts, price ranges and estimated liquidity are not displayed.</p>
              </div>
            </Panel>
          </div>

          <Panel eyebrow="05 / CONFIG DATA" title="Curve segments and economics">
            <div className="policy-summary">
              <div><small>Immutable token decimals</small><strong>{String(config.tokenDecimals)}</strong></div>
              <div><small>Pool creation fee</small><strong className="mono">{String(config.poolCreationFee)} wei</strong></div>
              <div><small>Segments returned</small><strong>{segments.length}</strong></div>
            </div>
            <details className="raw-details">
              <summary>View segment data returned by the SDK <Icon name="chevron" size={15} /></summary>
              <pre>{safeJson(segments)}</pre>
            </details>
            <details className="raw-details">
              <summary>View the complete SDK Config <Icon name="chevron" size={15} /></summary>
              <pre>{safeJson(config)}</pre>
            </details>
          </Panel>

          <div className="integrity-note">
            <Icon name="shield" size={17} />
            <span>Live balances, token reserves, liquidity positions and estimated amounts are not displayed because no pool has been selected and no position quote has been obtained. A Config alone does not represent a live liquidity position.</span>
          </div>
        </>
      )}
    </div>
  );
}
