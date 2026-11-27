import { createWalletClient, custom } from 'viem';
import { ammoraChain, deployment } from './ammora.js';

export function getInjectedProvider() {
  if (typeof window === 'undefined') return null;
  return window.ethereum ?? null;
}

export async function readWalletSnapshot() {
  const provider = getInjectedProvider();
  if (!provider) return { address: null, chainId: null };
  const [accounts, chainHex] = await Promise.all([
    provider.request({ method: 'eth_accounts' }),
    provider.request({ method: 'eth_chainId' }),
  ]);
  return {
    address: Array.isArray(accounts) && accounts[0] ? accounts[0] : null,
    chainId: Number.parseInt(chainHex, 16),
  };
}

export async function connectWallet() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('No EIP-1193 wallet was detected. Install or unlock MetaMask, then reconnect.');
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  const snapshot = await readWalletSnapshot();
  if (!Array.isArray(accounts) || !accounts[0] || !snapshot.address) {
    throw new Error('The wallet did not return an account.');
  }
  return snapshot;
}

export function createConnectedWalletClient() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('MetaMask provider is unavailable.');
  return createWalletClient({ chain: ammoraChain, transport: custom(provider) });
}

export async function switchToGiwaSepolia() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error('No EIP-1193 wallet was detected.');
  const chainIdHex = '0x' + deployment.chain.id.toString(16);
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
  } catch (error) {
    if (error?.code !== 4902) throw error;
    const rpcUrl = deployment.chain.rpcUrls?.[0];
    if (!rpcUrl) throw new Error('The selected SDK deployment does not publish an RPC URL for wallet setup.');
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: deployment.chain.name,
        nativeCurrency: deployment.chain.nativeCurrency,
        rpcUrls: [rpcUrl],
      }],
    });
  }
  return readWalletSnapshot();
}

export function shortAddress(address) {
  return address ? address.slice(0, 6) + '…' + address.slice(-4) : 'Not connected';
}