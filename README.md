# AMMORA BLUEPRINT

**Design. Configure. Deploy.**

An independent community-built launch workspace for Ammora on GIWA Sepolia (chain ID 91342). This is not an official Ammora product and is not a copy of GIWORA.

## Requirements

- Node.js 24
- npm
- MetaMask or another EIP-1193 injected wallet

## Install and run

~~~bash
npm install
npm run dev
~~~

The local Vite server prints its URL (normally http://localhost:5173).

## Production build

~~~bash
npm run build
npm run preview
~~~

## SDK and deployment

The project pins @ammora-protocol/sdk@0.3.9 and uses React 19, Vite and viem. It explicitly selects giwaSepoliaAutoRouteDeployment and checks chain ID 91342 plus V4 launch protocol. It does not use the SDK implicit GIWA default.

RPC selection:
1. VITE_AMMORA_RPC_URL, if configured.
2. The RPC URL published by the selected SDK deployment.

Public RPC reads are serialized (600 ms by default) to reduce request-rate pressure. Set VITE_AMMORA_RPC_INTERVAL_MS to an integer from 0 to 60000 to override the delay. Optional .env.local:

~~~bash
VITE_AMMORA_RPC_URL=
VITE_AMMORA_RPC_INTERVAL_MS=600
~~~

Do not commit .env.local. The UI does not hardcode RPC or contract addresses.

## Deployment verification

The read-only verification, also required by Config inspection before a wallet-facing launch path, checks:

1. The selected RPC actually reports chain 91342.
2. The finalized block from the SDK auto-route profile.
3. The bundled reviewed GIWA auto-route runtime-pin manifest matches the SDK deployment's chain, slot and source commit, and contains pins for all SDK deployment contract addresses.
4. Runtime bytecode matches the reviewed hashes through verifyAmmoraDeploymentRuntime.
5. Explorer source verification for the factory, registry and the factory's immutable tokenImplementation and curveImplementation getter addresses through checkContractVerification.

Config inspection binds V4 core checks, runtime-bytecode checks and immutable Factory implementation-address reads to the same SDK 12-confirmation snapshot. Explorer source verification is an additional source/index status check on those addresses; it is not a block-pinned runtime-code check. A dashboard-only click is not required before launch review; Config inspection performs the checks again before preparing a wallet-facing call.

The bundled manifest is sourced from the official AmmoraLabs/ammora-examples repository at src/quickstart/runtime-pins.giwa.json. Runtime-pin matching and Explorer source verification are separate checks. If an RPC, Explorer or SDK verification endpoint is unavailable, the app reports an incomplete check; it does not silently treat a timeout as a successful verification.

## Implemented on-chain launch flow

1. Read the user-entered Config ID with getAmmoraV4ConfigAtBlock at a confirmed SDK snapshot.
2. Verify the V4 Config Registry, Launch Factory, Graduation Adapter and Fee Policy through verifyAmmoraV4CoreAtBlock.
3. Reject affected Config #6 and the affected Config hash; require the selected Config to be enabled and explicitly support only `migrationMode: 0` (concentrated). Compounding and unknown modes are refused.
4. Apply the documented GIWA graduation-readiness gates: quote asset must be the supported WETH path, `migrationBaseThreshold` must equal zero, and `migrationQuoteThreshold` and Config `totalSupply` must be positive. Other quote assets are refused until this app implements the required token-policy/admission checks.
5. Build launch calldata with buildCreateAmmoraV4Launch.
6. Simulate the generated call with viem at the inspected block.
7. Require explicit in-app confirmation and an independent review of the remaining sale/graduation budget, recipients, LP allocation, locks and vesting.
8. Re-check the live EIP-1193 chain ID and active account immediately before opening the wallet signature prompt. Any wallet, network or payload change resets both review confirmations.
9. Wait for a receipt and parse LaunchCreated with parseAmmoraV4LaunchCreatedReceipt. Reconcile emitted Config ID/hash before showing the deployed token and curve addresses.

Private keys are never requested or stored. Wallet account and chain changes are observed through EIP-1193 events. Disconnect clears the app session; revoke site permissions separately in MetaMask.

## Current boundaries

- **Config inspection and token + pre-graduation curve creation use the documented SDK flow.** Wallet signing is performed by the connected EIP-1193 provider.
- Token Studio and Launch Preview display the full SDK Config, curve segments and key recipient identities. The app automatically blocks non-WETH quote assets, non-zero `migrationBaseThreshold`, non-positive quote threshold/total supply, affected Configs, disabled Configs and non-concentrated migration modes. These gates reflect the current GIWA guide; they do not prove the entire graduation lifecycle is live.
- The final wallet request still requires an independent user review of the remaining sale-plus-graduation budget, fee recipients, LP allocation, permanent locks and vesting. This attestation is not an automated economic-readiness proof.
- **Config #6 is blocked** for new launches even when enabled. An enabled Config is not automatically economically safe.
- The optional supply note is display-only and does not set supply. buildCreateAmmoraV4Launch does not take it; immutable Config economics govern the launch.
- Token description is stored in the local draft. Publish it in the JSON document referenced by the metadata URI.
- Liquidity Lab shows Config data returned by the SDK. It does not fabricate balances, reserves, LP positions, quotes or estimated amounts.
- Config Vault stores browser-local drafts only; it does not create on-chain Configs.
- Activity records this browser's launch submissions only, not complete wallet history or a network-wide index.
- **This is not yet an end-to-end launchpad.** ALC swap quotes/trading, final fill, graduation/migration and recovery, ARL pool/LP position operations, Creator/Partner/LP claims, on-chain Config authoring and network analytics are not enabled in this release. The official Ammora launchpad guide describes these additional lifecycle stages; do not present this build as implementing them.

## Vercel

Production: https://ammora-blueprint.vercel.app

The GitHub repository is linked to Vercel. Merges to `main` create production deployments and pull requests create preview deployments. Framework: Vite; build command: `npm run build`; output directory: `dist`; Node.js: 24.x. Configure `VITE_AMMORA_RPC_URL` only when an approved RPC override is needed. Redeploy after changing environment variables.

## Official references

- https://docs.ammora.org/llms.txt
- https://docs.ammora.org/guides/sdk-quickstart
- https://docs.ammora.org/guides/launchpad
- https://docs.ammora.org/guides/sdk-status
- https://docs.ammora.org/examples
- https://github.com/AmmoraLabs/ammora-examples
- https://github.com/slippage7/giwora

## License

No license has been added. Do not assume this repository grants rights to reuse third-party assets or source code.
