import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Shell from './components/Shell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TokenStudio from './pages/TokenStudio.jsx';
import LiquidityLab from './pages/LiquidityLab.jsx';
import LaunchPreview from './pages/LaunchPreview.jsx';
import ConfigVault from './pages/ConfigVault.jsx';
import Activity from './pages/Activity.jsx';
import {
  executeLaunch,
  explorerUrl,
  inspectLaunchConfig,
  prepareLaunchPreview,
  reconcileLaunchTransaction,
  simulateLaunchPreview,
  verifyDeployment,
} from './lib/ammora.js';
import { connectWallet, readWalletSnapshot, getInjectedProvider, switchToGiwaSepolia } from './lib/wallet.js';
import {
  createId,
  loadActivity,
  loadDrafts,
  persistActivity,
  persistDrafts,
  upsertDraft,
} from './lib/storage.js';

const blankForm = {
  name: '',
  symbol: '',
  description: '',
  totalSupply: '',
  decimals: '6',
  metadataURI: '',
  configId: '',
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [form, setForm] = useState(blankForm);
  const [drafts, setDrafts] = useState(() => loadDrafts());
  const [activities, setActivities] = useState(() => loadActivity());
  const [activeDraftId, setActiveDraftId] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletChainId, setWalletChainId] = useState(null);
  const [configReview, setConfigReview] = useState(null);
  const [deploymentStatus, setDeploymentStatus] = useState({ status: 'not_run' });
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [pendingLaunch, setPendingLaunch] = useState(null);
  const [deployResult, setDeployResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [studioError, setStudioError] = useState('');
  const [studioNotice, setStudioNotice] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { persistDrafts(drafts); }, [drafts]);
  useEffect(() => { persistActivity(activities); }, [activities]);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setToast(''), 3600);
  }, []);

  useEffect(() => {
    const provider = getInjectedProvider();
    if (!provider) return undefined;
    let mounted = true;

    readWalletSnapshot().then((snapshot) => {
      if (!mounted) return;
      setWalletAddress(snapshot.address);
      setWalletChainId(snapshot.chainId);
    }).catch(() => undefined);

    const onAccountsChanged = (accounts) => {
      setWalletAddress(Array.isArray(accounts) && accounts[0] ? accounts[0] : null);
    };
    const onChainChanged = (chainHex) => {
      setWalletChainId(Number.parseInt(chainHex, 16));
    };
    provider.on?.('accountsChanged', onAccountsChanged);
    provider.on?.('chainChanged', onChainChanged);

    return () => {
      mounted = false;
      provider.removeListener?.('accountsChanged', onAccountsChanged);
      provider.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  const onConnect = async () => {
    try {
      const snapshot = await connectWallet();
      setWalletAddress(snapshot.address);
      setWalletChainId(snapshot.chainId);
      notify(snapshot.chainId === 91342 ? 'Wallet connected to GIWA Sepolia.' : 'Wallet connected. Switch to GIWA Sepolia to use launch tools.');
    } catch (error) {
      notify(error?.shortMessage || error?.message || 'Wallet connection failed.');
    }
  };

  const onDisconnect = () => {
    setWalletAddress(null);
    notify('Wallet disconnected from this app. To revoke browser access, remove this site from your wallet’s connected sites.');
  };

  const onSwitchNetwork = async () => {
    try {
      const snapshot = await switchToGiwaSepolia();
      setWalletAddress(snapshot.address);
      setWalletChainId(snapshot.chainId);
      notify(snapshot.chainId === 91342 ? 'GIWA Sepolia selected.' : 'Network switch was not confirmed.');
    } catch (error) {
      notify(error?.shortMessage || error?.message || 'Network switch failed.');
    }
  };

  const onVerifyDeployment = async () => {
    setVerificationBusy(true);
    setDeploymentStatus({ status: 'checking' });
    try {
      const result = await verifyDeployment();
      setDeploymentStatus(result);
      notify('GIWA deployment runtime and Explorer source checks passed.');
    } catch (error) {
      const message = error?.shortMessage || error?.message || 'Deployment verification could not be completed.';
      setDeploymentStatus({ status: 'error', message });
      notify('Deployment verification is incomplete. Review the reported check.');
    } finally {
      setVerificationBusy(false);
    }
  };

  const onInspectConfig = async () => {
    onInvalidatePreview();
    setConfigReview(null);
    setBusy(true);
    setStudioError('');
    setStudioNotice('');
    try {
      const review = await inspectLaunchConfig(form.configId);
      setConfigReview(review);
      setDeploymentStatus(review.deploymentVerification || { status: 'not_run' });
      setForm((current) => ({ ...current, decimals: String(review.entry.config.tokenDecimals) }));
      setStudioNotice('Config #' + review.configId + ' and the implemented launch checks passed at confirmed block ' + review.blockNumber + '.');
      notify('Config inspection and launch checks completed successfully.');
    } catch (error) {
      setConfigReview(null);
      const message = error?.shortMessage || error?.message || 'Config inspection failed.';
      setDeploymentStatus({ status: 'error', message });
      setStudioError(message);
    } finally {
      setBusy(false);
    }
  };

  const onSaveDraft = () => {
    const id = activeDraftId || createId();
    const next = upsertDraft(drafts, { ...form, id });
    setDrafts(next);
    setActiveDraftId(id);
    notify('Local draft saved in this browser.');
  };

  const onNewDraft = () => {
    setForm(blankForm);
    setActiveDraftId(null);
    setConfigReview(null);
    onInvalidatePreview();
    setStudioError('');
    setStudioNotice('');
    setPage('token');
  };

  const onEditDraft = (draft) => {
    setForm({
      ...blankForm,
      ...draft,
      decimals: String(draft.decimals ?? '6'),
      configId: String(draft.configId ?? ''),
    });
    setActiveDraftId(draft.id);
    setConfigReview(null);
    onInvalidatePreview();
    setStudioError('');
    setStudioNotice('Draft loaded. Re-inspect its Config before creating a new preview.');
    setPage('token');
  };

  const onDeleteDraft = (id) => {
    const draft = drafts.find((item) => item.id === id);
    if (!window.confirm('Delete the local draft ' + (draft?.name || 'Untitled token') + '?')) return;
    setDrafts((current) => current.filter((item) => item.id !== id));
    if (activeDraftId === id) setActiveDraftId(null);
    notify('Local draft deleted.');
  };

  const onInvalidatePreview = useCallback(() => {
    setPendingLaunch(null);
    setDeployResult(null);
    setPreviewError('');
  }, []);

  const onPreview = () => {
    try {
      setStudioError('');
      const prepared = prepareLaunchPreview(form, configReview);
      setPendingLaunch(prepared);
      setDeployResult(null);
      setPreviewError('');
      setPage('preview');
    } catch (error) {
      setStudioError(error?.shortMessage || error?.message || 'Launch preview could not be prepared.');
    }
  };

  const onSimulate = async () => {
    setBusy(true);
    setPreviewError('');
    try {
      const simulation = await simulateLaunchPreview(pendingLaunch, walletAddress);
      setPendingLaunch((current) => ({ ...current, simulation: simulation.status }));
      notify('The SDK-generated transaction passed simulation on the public RPC.');
    } catch (error) {
      setPendingLaunch((current) => current ? ({ ...current, simulation: 'failed' }) : current);
      setPreviewError(error?.shortMessage || error?.message || 'Simulation failed.');
    } finally {
      setBusy(false);
    }
  };

  const updateActivity = (hash, patch) => {
    setActivities((current) => current.map((item) => item.txHash === hash ? { ...item, ...patch } : item));
  };

  const onExecute = async () => {
    if (!pendingLaunch || !walletAddress) return;
    setBusy(true);
    setPreviewError('');
    setDeployResult(null);
    try {
      const result = await executeLaunch(pendingLaunch, walletAddress, (submission) => {
        const record = {
          id: submission.hash,
          txHash: submission.hash,
          configId: submission.configId,
          configHash: submission.configHash,
          factory: submission.factory,
          wallet: submission.wallet,
          chainId: submission.chainId,
          tokenName: submission.tokenName,
          tokenSymbol: submission.tokenSymbol,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        setActivities((current) => [record, ...current.filter((item) => item.txHash !== submission.hash)]);
        notify('Transaction submitted. Waiting for canonical receipt…');
      });
      updateActivity(result.hash, {
        status: result.status,
        blockNumber: result.blockNumber,
        blockHash: result.blockHash,
        tokenAddress: result.tokenAddress,
        curveAddress: result.curveAddress,
        message: result.message,
        protocolVersion: result.protocolVersion,
      });
      setDeployResult(result);
      if (result.status === 'confirmed') {
        notify('Launch event reconciled. Token and curve addresses were read from the receipt.');
      } else if (result.status === 'failed') {
        notify('The transaction receipt reports a revert.');
      } else {
        notify('Transaction status requires receipt reconciliation. Do not resubmit.');
      }
    } catch (error) {
      setPreviewError(error?.shortMessage || error?.message || 'Launch execution failed before submission.');
    } finally {
      setBusy(false);
    }
  };

  const onRefreshActivity = async () => {
    const pending = activities.filter((item) => ['pending', 'confirmed_unreconciled'].includes(item.status));
    if (!pending.length) return;
    setBusy(true);
    try {
      const refreshed = await Promise.all(pending.map(async (item) => ({
        hash: item.txHash,
        result: await reconcileLaunchTransaction(item.txHash, item.configId, item.configHash),
      })));
      setActivities((current) => current.map((item) => {
        const match = refreshed.find((entry) => entry.hash === item.txHash);
        return match ? { ...item, ...match.result } : item;
      }));
      notify('Receipt reconciliation completed for ' + refreshed.length + ' transaction(s).');
    } catch (error) {
      notify(error?.shortMessage || error?.message || 'Receipt reconciliation could not be completed. The transaction was not marked failed.');
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notify('Copied to clipboard.');
    } catch {
      notify('Clipboard access is unavailable in this browser.');
    }
  };

  const walletNotice = useMemo(() => {
    if (!walletAddress) return 'Testnet only · Connect your wallet to inspect an on-chain Config and prepare a transaction.';
    if (walletChainId !== 91342) return 'The wallet is connected to chain ' + walletChainId + '. Switch to GIWA Sepolia (91342) before simulating or signing.';
    return 'Connected to GIWA Sepolia · Local drafts are not on-chain Configs. Review the selected Config before preparing a launch.';
  }, [walletAddress, walletChainId]);

  let content;
  switch (page) {
    case 'token':
      content = <TokenStudio
        form={form} setForm={setForm} configReview={configReview}
        onInvalidatePreview={onInvalidatePreview}
        onInvalidateConfigReview={() => { setConfigReview(null); setDeploymentStatus({ status: 'not_run' }); }}
        onInspectConfig={onInspectConfig} onSaveDraft={onSaveDraft} onPreview={onPreview}
        busy={busy} error={studioError} notice={studioNotice}
      />;
      break;
    case 'liquidity':
      content = <LiquidityLab configReview={configReview} onNavigate={setPage} />;
      break;
    case 'preview':
      content = <LaunchPreview
        preview={pendingLaunch} walletAddress={walletAddress} walletChainId={walletChainId}
        onNavigate={setPage} onSimulate={onSimulate} onExecute={onExecute}
        busy={busy} error={previewError} result={deployResult}
      />;
      break;
    case 'vault':
      content = <ConfigVault drafts={drafts} onEdit={onEditDraft} onDelete={onDeleteDraft} onCreate={onNewDraft} />;
      break;
    case 'activity':
      content = <Activity items={activities} onRefresh={onRefreshActivity} busy={busy} onCopy={onCopy} explorerUrl={explorerUrl} />;
      break;
    default:
      content = <Dashboard
        walletAddress={walletAddress} walletChainId={walletChainId}
        drafts={drafts} activities={activities} configReview={configReview} onNavigate={setPage}
        deploymentStatus={deploymentStatus} onVerifyDeployment={onVerifyDeployment}
        verificationBusy={verificationBusy}
      />;
  }

  return (
    <>
      <Shell
        page={page} onNavigate={setPage} walletAddress={walletAddress} walletChainId={walletChainId}
        onConnect={onConnect} onDisconnect={onDisconnect} onSwitchNetwork={onSwitchNetwork}
        notice={walletNotice}
      >
        {content}
      </Shell>
      {toast && <div className="toast-message" role="status" aria-live="polite"><span />{toast}</div>}
    </>
  );
}
