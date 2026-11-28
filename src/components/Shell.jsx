import React from 'react';
import Icon from './Icons.jsx';
import { Button, Status } from './Primitives.jsx';
import { shortAddress } from '../lib/wallet.js';
import { CHAIN_ID } from '../lib/ammora.js';

const navigation = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: 'dashboard', group: 'Workspace' },
  { id: 'token', label: 'Token Studio', mobileLabel: 'Token', icon: 'token', group: 'Workspace' },
  { id: 'liquidity', label: 'Configuration Policy', mobileLabel: 'Policy', icon: 'liquidity', group: 'Workspace' },
  { id: 'preview', label: 'Transaction Review', mobileLabel: 'Review', icon: 'preview', group: 'Launch' },
  { id: 'vault', label: 'Draft Library', mobileLabel: 'Drafts', icon: 'vault', group: 'Launch' },
  { id: 'activity', label: 'Activity Log', mobileLabel: 'Activity', icon: 'activity', group: 'Launch' },
];

export default function Shell({
  page, onNavigate, children, walletAddress, walletChainId,
  onConnect, onDisconnect, onSwitchNetwork, notice,
}) {
  const correctNetwork = walletChainId === CHAIN_ID;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to Main Content</a>
      <aside className="sidebar">
        <button className="brand-lockup" onClick={() => onNavigate('dashboard')} aria-label="Go to Dashboard">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-copy"><strong>AMMORA</strong><small>BLUEPRINT</small></span>
        </button>
        <div className="sidebar-caption">OPERATING CONSOLE</div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item, index) => (
            <React.Fragment key={item.id}>
              {(index === 0 || navigation[index - 1].group !== item.group) && <div className="nav-group-label">{item.group}</div>}
              <button className={'nav-link ' + (page === item.id ? 'active' : '')} onClick={() => onNavigate(item.id)} aria-current={page === item.id ? 'page' : undefined} title={item.label}>
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
                {page === item.id && <i className="nav-active-mark" />}
              </button>
            </React.Fragment>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-card">
            <div className="network-card-top"><span className="network-orb" />GIWA SEPOLIA</div>
            <div className="network-card-id">CHAIN ID <b>{CHAIN_ID}</b></div>
            <div className="network-card-foot">Ammora SDK Deployment · V4</div>
          </div>
          <div className="sidebar-footer"><span className="footer-dot" />Independent Community Build</div>
        </div>
      </aside>

      <main className="main-column" id="main-content" tabIndex="-1">
        <header className="topbar">
          <button className="mobile-brand-lockup" onClick={() => onNavigate('dashboard')} aria-label="Go to Dashboard"><span className="brand-mark" aria-hidden="true"><span /><span /><span /></span><span className="brand-copy"><strong>BLUEPRINT</strong><small>AMMORA V4 WORKSPACE</small></span></button>
          <div className="breadcrumb"><span>AMMORA BLUEPRINT</span><b>/</b><strong>{navigation.find((item) => item.id === page)?.label || 'Workspace'}</strong></div>
          <div className="topbar-actions">
            <Status tone={walletAddress && correctNetwork ? 'success' : walletAddress ? 'warning' : 'neutral'}>
              {walletAddress ? (correctNetwork ? 'Wallet Connected' : 'Network Mismatch') : 'Wallet Not Connected'}
            </Status>
            {walletAddress ? (
              <div className="wallet-control">
                {!correctNetwork && <Button variant="secondary" onClick={onSwitchNetwork}>Switch Network</Button>}
                <span className="wallet-address" title={walletAddress}><span className="wallet-avatar"><Icon name="wallet" size={15} /></span>{shortAddress(walletAddress)}</span>
                <button className="disconnect-button" onClick={onDisconnect} title="Disconnect Wallet">Disconnect</button>
              </div>
            ) : <Button onClick={onConnect} icon="wallet">Connect Wallet</Button>}
          </div>
        </header>
        {notice && <div className="notice-banner"><Icon name="shield" size={16} /><span>{notice}</span></div>}
        <div className="page-content">{children}</div>
        <footer className="main-footer">
          <span>AMMORA BLUEPRINT <b>·</b> INDEPENDENT COMMUNITY BUILD</span>
          <span>GIWA Sepolia · Chain {CHAIN_ID}</span>
          <a href="https://docs.ammora.org/" target="_blank" rel="noreferrer">OFFICIAL SDK DOCUMENTATION <Icon name="external" size={12} /></a>
        </footer>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)} aria-current={page === item.id ? 'page' : undefined}>
            <Icon name={item.icon} size={19} /><span>{item.mobileLabel || item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}