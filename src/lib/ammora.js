import {
  buildCreateAmmoraV4Launch,
  checkContractVerification,
  getAmmoraV4ConfigAtBlock,
  giwaSepoliaAutoRoute,
  giwaSepoliaAutoRouteDeployment,
  parseAmmoraV4LaunchCreatedReceipt,
  resolveAmmoraFinalizedHead,
  verifyAmmoraDeploymentRuntime,
  verifyAmmoraV4CoreAtBlock,
} from '@ammora-protocol/sdk';
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  http,
  isAddress,
} from 'viem';
import runtimePinSnapshot from './runtime-pins.giwa.json';

export const CHAIN_ID = 91342;
export const deployment = giwaSepoliaAutoRouteDeployment;
const launchContracts = deployment.contracts.launch;
const blockedConfigHash = '0x6048908774397e0691bb0e19f72dabb790eb0d892d6081d3622b39e7f738e667';

if (deployment.chain.id !== CHAIN_ID || launchContracts.protocolVersion !== 4) {
  throw new Error('The installed Ammora SDK does not expose the expected GIWA Sepolia V4 auto-route deployment.');
}

const rpcUrl = import.meta.env.VITE_AMMORA_RPC_URL?.trim() || deployment.chain.rpcUrls?.[0];
if (!rpcUrl) throw new Error('No RPC URL is published by the selected Ammora SDK deployment. Set VITE_AMMORA_RPC_URL.');
const rpcIntervalMs = Number(import.meta.env.VITE_AMMORA_RPC_INTERVAL_MS ?? '600');

export const ammoraChain = defineChain({
  id: deployment.chain.id,
  name: deployment.chain.name,
  nativeCurrency: deployment.chain.nativeCurrency,
  rpcUrls: { default: { http: [rpcUrl] } },
});

function pacedHttp(url, intervalMs = rpcIntervalMs) {
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 0 || intervalMs > 60000) {
    throw new Error('VITE_AMMORA_RPC_INTERVAL_MS must be an integer from 0 to 60000.');
  }
  let tail = Promise.resolve();
  let nextStart = 0;
  return (parameters) => {
    const base = http(url, { retryCount: 0 })(parameters);
    return custom({
      request: (args) => {
        const result = tail.then(async () => {
          await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, nextStart - Date.now())));
          try {
            return await base.request(args);
          } finally {
            nextStart = Date.now() + intervalMs;
          }
        });
        tail = result.catch(() => undefined);
        return result;
      },
    }, { retryCount: 0 })(parameters);
  };
}

let client;
export function getPublicClient() {
  if (!client) {
    client = createPublicClient({
      chain: ammoraChain,
      transport: pacedHttp(rpcUrl),
    });
  }
  return client;
}

export function explorerUrl(txHash) {
  const catalog = deployment.chain;
  const base = catalog.blockExplorers?.default?.url || catalog.explorers?.default?.url || null;
  return base && txHash ? base.replace(/\/$/, '') + '/tx/' + txHash : null;
}

async function confirmedSnapshot(publicClient) {
  const actualChainId = await publicClient.getChainId();
  if (actualChainId !== CHAIN_ID) {
    throw new Error('RPC returned chain ' + actualChainId + '; GIWA Sepolia (' + CHAIN_ID + ') is required.');
  }
  return resolveAmmoraFinalizedHead([publicClient], giwaSepoliaAutoRoute.finality);
}

function parseReviewedRuntimePins(snapshot, target, generation) {
  const object = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Expected a reviewed runtime-pin object.');
    }
    return value;
  };
  const root = object(snapshot);
  const deployments = object(root.deployments);
  const profile = object(deployments[generation]);
  if (root.schemaVersion !== 1 || root.chainId !== String(target.chain.id) ||
      profile.slot !== target.slot || profile.sourceCommit !== target.sourceCommit) {
    throw new Error('The bundled runtime-pin snapshot does not match this SDK chain, generation, slot and source commit.');
  }

  const sourceHashes = object(profile.runtimeCodeHashes);
  const pins = {};
  for (const [address, hash] of Object.entries(sourceHashes)) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(address) || typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      throw new Error('The bundled runtime-pin snapshot contains a malformed address or code hash.');
    }
    pins[address.toLowerCase()] = hash;
  }

  const contractAddresses = (value) => typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)
    ? [value.toLowerCase()]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(contractAddresses)
      : [];
  for (const address of contractAddresses(target.contracts)) {
    if (!pins[address]) {
      throw new Error('The runtime-pin snapshot does not cover SDK deployment contract ' + address + '.');
    }
  }
  return pins;
}

export async function verifyDeployment() {
  const publicClient = getPublicClient();
  const blockNumber = await confirmedSnapshot(publicClient);
  const generation = 'auto-route';
  const runtimeCodeHashes = parseReviewedRuntimePins(runtimePinSnapshot, deployment, generation);
  const runtime = await verifyAmmoraDeploymentRuntime(
    publicClient,
    deployment,
    blockNumber,
    runtimeCodeHashes,
  );

  // Auto-route publishes no Explorer manifest; authenticate the factory runtime,
  // then obtain implementation identities from its immutable getters.
  const explorerTargets = {
    factory: launchContracts.factory,
    registry: launchContracts.configRegistry,
    tokenImplementation: await publicClient.readContract({
      address: launchContracts.factory,
      abi: [{ type: 'function', name: 'tokenImplementation', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }],
      functionName: 'tokenImplementation',
      blockNumber,
    }),
    curveImplementation: await publicClient.readContract({
      address: launchContracts.factory,
      abi: [{ type: 'function', name: 'curveImplementation', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }],
      functionName: 'curveImplementation',
      blockNumber,
    }),
  };

  const explorer = await Promise.all(Object.entries(explorerTargets).map(async ([name, address]) => {
    const status = await checkContractVerification(address);
    if (!status.isIndexed || !status.isContract || !status.isVerified) {
      throw new Error(name + ' ' + address + ' is not source verified in Explorer.');
    }
    return { name, address, contractName: status.contractName };
  }));

  return {
    status: 'verified',
    chainId: CHAIN_ID,
    slot: deployment.slot,
    protocolVersion: launchContracts.protocolVersion,
    sourceCommit: deployment.sourceCommit,
    blockNumber: String(blockNumber),
    runtimeContractsVerified: runtime.contracts.length,
    explorer,
    verificationManifestUrl: deployment.explorerVerification?.verificationManifestUrl ?? null,
    implementationIdentitySource: 'Immutable getters on runtime-authenticated factory',
  };
}

async function verifyV4Core(publicClient, blockNumber) {
  await verifyAmmoraV4CoreAtBlock(publicClient, {
    configRegistry: launchContracts.configRegistry,
    launchFactory: launchContracts.factory,
    graduationAdapter: launchContracts.graduationAdapter,
    feePolicy: launchContracts.feePolicy,
  }, blockNumber);
}

export async function inspectLaunchConfig(configIdInput) {
  const raw = String(configIdInput ?? '').trim();
  if (!/^[1-9]\d*$/.test(raw)) {
    throw new Error('Enter a positive integer Config ID. The app will not choose one automatically.');
  }
  const configId = BigInt(raw);
  if (configId === 6n) {
    throw new Error('Config #6 is affected and blocked for new launches on this GIWA deployment, even when enabled.');
  }

  const publicClient = getPublicClient();
  const blockNumber = await confirmedSnapshot(publicClient);
  await verifyV4Core(publicClient, blockNumber);
  const entry = await getAmmoraV4ConfigAtBlock(
    publicClient,
    launchContracts.configRegistry,
    configId,
    blockNumber,
  );

  if (!entry?.config) {
    throw new Error('Config #' + raw + ' was not returned by the selected V4 Registry.');
  }
  if (String(entry.configHash ?? '').toLowerCase() === blockedConfigHash) {
    throw new Error('This Config matches the affected GIWA policy hash and is blocked for new launches.');
  }

  return {
    configId: raw,
    entry,
    blockNumber: String(blockNumber),
    network: deployment.chain.name,
    registry: launchContracts.configRegistry,
    factory: launchContracts.factory,
    coreVerified: true,
  };
}

function validateTokenFields(form, configReview) {
  if (!configReview?.entry?.config) {
    throw new Error('Inspect an on-chain Config before preparing a launch.');
  }
  if (String(form.configId) !== String(configReview.configId)) {
    throw new Error('The inspected Config ID does not match the selected Config ID.');
  }
  if (!configReview.entry.enabled) {
    throw new Error('The selected Config is disabled and cannot be used for a new launch.');
  }
  if (String(form.name ?? '').trim().length < 2) {
    throw new Error('Token name must contain at least 2 characters.');
  }
  if (!/^[A-Za-z0-9]{2,12}$/.test(String(form.symbol ?? '').trim())) {
    throw new Error('Token symbol must be 2–12 letters or numbers.');
  }
  const supplyText = String(form.totalSupply ?? '').trim();
  const supply = Number(supplyText);
  if (!/^\d+(?:\.\d+)?$/.test(supplyText) || !Number.isFinite(supply) || supply <= 0) {
    throw new Error('Enter a positive total-supply intent using digits and an optional decimal point.');
  }
  if (!Number.isInteger(Number(form.decimals)) || Number(form.decimals) < 6 || Number(form.decimals) > 9) {
    throw new Error('GIWA V4 token decimals must be between 6 and 9.');
  }
  if (Number(form.decimals) !== Number(configReview.entry.config.tokenDecimals)) {
    throw new Error('Token decimals must match the immutable Config (' + configReview.entry.config.tokenDecimals + ').');
  }
  const metadataURI = String(form.metadataURI ?? '').trim();
  if (!/^(https:\/\/|ipfs:\/\/|ar:\/\/)/i.test(metadataURI)) {
    throw new Error('Metadata URI must use https://, ipfs:// or ar://.');
  }
}

function buildLaunchTransaction(form, configReview) {
  validateTokenFields(form, configReview);
  const entry = configReview.entry;
  const transaction = buildCreateAmmoraV4Launch({
    name: String(form.name).trim(),
    symbol: String(form.symbol).trim(),
    metadataURI: String(form.metadataURI).trim(),
    creatorMetadataURI: String(form.metadataURI).trim(),
    tokenDecimals: Number(form.decimals),
  }, BigInt(configReview.configId), entry.config.poolCreationFee);

  return {
    transaction,
    factory: launchContracts.factory,
    configId: configReview.configId,
    configHash: entry.configHash,
    blockNumber: configReview.blockNumber,
    configEnabled: entry.enabled,
    tokenDecimals: Number(entry.config.tokenDecimals),
    poolCreationFee: String(entry.config.poolCreationFee),
  };
}

export function prepareLaunchPreview(form, configReview) {
  const prepared = buildLaunchTransaction(form, configReview);
  return {
    ...prepared,
    form: { ...form },
    preparedAt: new Date().toISOString(),
    simulation: 'not-run',
  };
}

export async function simulateLaunchPreview(preview, account) {
  if (!account || !isAddress(account)) {
    throw new Error('Connect a valid wallet address before simulation.');
  }
  const publicClient = getPublicClient();
  const blockNumber = BigInt(preview.blockNumber);
  const actualChainId = await publicClient.getChainId();
  if (actualChainId !== CHAIN_ID) {
    throw new Error('RPC chain mismatch: expected ' + CHAIN_ID + ', received ' + actualChainId + '.');
  }
  await publicClient.call({
    account,
    to: preview.factory,
    ...preview.transaction,
    blockNumber,
  });
  return { status: 'passed', blockNumber: preview.blockNumber };
}

export async function executeLaunch(preview, account, onSubmitted) {
  if (!account || !isAddress(account)) {
    throw new Error('Connect the creator wallet before signing.');
  }
  const freshReview = await inspectLaunchConfig(preview.configId);
  if (!freshReview.entry.enabled) {
    throw new Error('The selected Config was disabled before signing.');
  }
  if (String(freshReview.entry.configHash).toLowerCase() !== String(preview.configHash).toLowerCase()) {
    throw new Error('The Config hash changed after preview. Review the launch again.');
  }

  const { transaction } = buildLaunchTransaction(preview.form, freshReview);
  const publicClient = getPublicClient();
  await publicClient.call({
    account,
    to: launchContracts.factory,
    ...transaction,
    blockNumber: BigInt(freshReview.blockNumber),
  });

  const provider = typeof window !== 'undefined' ? window.ethereum : null;
  if (!provider) throw new Error('MetaMask provider is unavailable.');
  const walletClient = createWalletClient({
    chain: ammoraChain,
    transport: custom(provider),
  });
  const hash = await walletClient.sendTransaction({
    account,
    to: launchContracts.factory,
    ...transaction,
  });
  onSubmitted?.({
    hash,
    configId: preview.configId,
    configHash: preview.configHash,
    factory: launchContracts.factory,
    wallet: account,
    chainId: CHAIN_ID,
    tokenName: preview.form.name,
    tokenSymbol: preview.form.symbol,
  });

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    return {
      status: 'pending',
      hash,
      message: 'Transaction was submitted. Receipt is not available yet: ' + (error?.shortMessage || error?.message || 'RPC did not return a receipt'),
    };
  }

  if (receipt.status !== 'success') {
    return {
      status: 'failed',
      hash,
      blockNumber: String(receipt.blockNumber),
      message: 'The transaction receipt reports a revert.',
    };
  }

  try {
    const created = parseAmmoraV4LaunchCreatedReceipt(receipt, launchContracts.factory);
    if (BigInt(created.configId) !== BigInt(preview.configId) ||
        String(created.configHash).toLowerCase() !== String(preview.configHash).toLowerCase()) {
      return {
        status: 'confirmed_unreconciled',
        hash,
        blockNumber: String(receipt.blockNumber),
        message: 'The receipt is successful, but the emitted Config identity does not match the reviewed Config. Do not retry.',
      };
    }
    return {
      status: 'confirmed',
      hash,
      blockNumber: String(receipt.blockNumber),
      blockHash: receipt.blockHash,
      tokenAddress: created.token,
      curveAddress: created.curve,
      configId: String(created.configId),
      configHash: created.configHash,
      protocolVersion: created.protocolVersion,
    };
  } catch (error) {
    return {
      status: 'confirmed_unreconciled',
      hash,
      blockNumber: String(receipt.blockNumber),
      message: 'Receipt succeeded, but the LaunchCreated event could not be reconciled: ' + (error?.shortMessage || error?.message || 'unknown parser error') + '. Do not retry.',
    };
  }
}

export async function reconcileLaunchTransaction(hash, expectedConfigId, expectedConfigHash) {
  const publicClient = getPublicClient();
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    if (receipt.status !== 'success') {
      return {
        status: 'failed',
        blockNumber: String(receipt.blockNumber),
        message: 'The canonical receipt reports a revert.',
      };
    }
    try {
      const created = parseAmmoraV4LaunchCreatedReceipt(receipt, launchContracts.factory);
      if ((expectedConfigId && String(created.configId) !== String(expectedConfigId)) ||
          (expectedConfigHash && String(created.configHash).toLowerCase() !== String(expectedConfigHash).toLowerCase())) {
        return {
          status: 'confirmed_unreconciled',
          blockNumber: String(receipt.blockNumber),
          message: 'The receipt succeeded but the emitted Config identity differs from the local record. Manual review required; do not retry.',
        };
      }
      return {
        status: 'confirmed',
        blockNumber: String(receipt.blockNumber),
        blockHash: receipt.blockHash,
        tokenAddress: created.token,
        curveAddress: created.curve,
        configId: String(created.configId),
        configHash: created.configHash,
        protocolVersion: created.protocolVersion,
      };
    } catch (error) {
      return {
        status: 'confirmed_unreconciled',
        blockNumber: String(receipt.blockNumber),
        message: 'Receipt succeeded but event parsing needs review: ' + (error?.shortMessage || error?.message || 'unknown parser error'),
      };
    }
  } catch {
    return {
      status: 'pending',
      message: 'No receipt is available from the configured RPC yet. This is not evidence of failure.',
    };
  }
}
