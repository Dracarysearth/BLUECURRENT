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

The Dashboard's read-only verification checks:

1. The selected RPC actually reports chain 91342.
2. The finalized block from the SDK auto-route profile.
3. The bundled reviewed GIWA auto-route runtime-pin manifest matches the SDK deployment's chain, slot and source commit, and contains pins for all SDK deployment contract addresses.
4. Runtime bytecode matches the reviewed hashes through verifyAmmoraDeploymentRuntime.
5. Explorer source verification for the factory, registry and the factory's immutable tokenImplementation and curveImplementation getter addresses through checkContractVerification.

The bundled manifest is sourced from the official AmmoraLabs/ammora-examples repository at src/quickstart/runtime-pins.giwa.json. Runtime-pin matching and Explorer source verification are separate checks. If an RPC, Explorer or SDK verification endpoint is unavailable, the app reports an incomplete check; it does not silently treat a timeout as a successful verification.

## Implemented on-chain launch flow

1. Read the user-entered Config ID with getAmmoraV4ConfigAtBlock at a confirmed SDK snapshot.
2. Verify the V4 Config Registry, Launch Factory, Graduation Adapter and Fee Policy through verifyAmmoraV4CoreAtBlock.
3. Reject affected Config #6 and the affected Config hash; require the selected Config to be enabled.
4. Build launch calldata with buildCreateAmmoraV4Launch.
5. Simulate the generated call with viem at the inspected block.
6. Require explicit in-app confirmation and wallet signing.
7. Wait for a receipt and parse LaunchCreated with parseAmmoraV4LaunchCreatedReceipt. Reconcile emitted Config ID/hash before showing the deployed token and curve addresses.

Private keys are never requested or stored. Wallet account and chain changes are observed through EIP-1193 events. Disconnect clears the app session; revoke site permissions separately in MetaMask.

## Current boundaries

- **Config inspection and token launch use the documented SDK flow.** Wallet signing is performed by the connected EIP-1193 provider.
- **Config #6 is blocked** for new launches even when enabled. An enabled Config is not automatically economically safe.
- Total supply is a local planning field only. buildCreateAmmoraV4Launch does not take it; immutable Config economics govern the launch.
- Token description is stored in the local draft. Publish it in the JSON document referenced by the metadata URI.
- Liquidity Lab shows Config data returned by the SDK. It does not fabricate balances, reserves, LP positions, quotes or estimated amounts.
- Config Vault stores browser-local drafts only; it does not create on-chain Configs.
- Activity records this browser's launch submissions only, not complete wallet history or a network-wide index.
- Swaps, graduation/migration, LP position creation, claims, Config authoring and network analytics are not enabled in this release.

## Vercel

Import the repository into Vercel and select the Vite preset. Use npm install, npm run build and dist as the output directory. Configure VITE_AMMORA_RPC_URL only when an approved RPC override is needed. Redeploy after changing environment variables.

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
