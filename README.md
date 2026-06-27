# GramPad Token (GRAMX)

Immutable fixed-supply Jetton for TON.

- Name: GramPad Token
- Symbol: GRAMX
- Decimals: 9
- Genesis supply: 1,000,000,000 GRAMX
- Mintable: no
- Master owner/admin controls: none
- Contract upgrades: none
- Metadata updates: none
- Holder burns: supported
- Logo URL: immutable TEP-64 `image` metadata pointing to the supplied IPFS CID

Logo:
`https://brown-gigantic-crab-18.mypinata.cloud/ipfs/bafkreidg5s7wuinmlzsfopy272li4nyiqb2spd3y5kbrs67q3wil4g7o2i`

The `admin_address` returned by the mandatory TEP-74 getter is the initial
holder address for wallet compatibility. It grants no authority: the master
contract exposes no admin, mint, ownership, metadata-update, withdrawal, or
upgrade message handler.

## Build and test

```sh
npm install
npm test
npm run lint:contracts
```

## Deploy

The deployment wallet receives the full genesis supply. Testnet should be used
and validated before mainnet:

```sh
npm run deploy -- --testnet
npm run deploy -- --mainnet
```

Blueprint prompts for a wallet connection. Never put a seed phrase or private
key in this repository.

If the default TON Center provider fails, bypass Blueprint's retry adapter:

```sh
npm run deploy -- --custom https://testnet.toncenter.com/api/v2/jsonRPC \
  --custom-version v2 --custom-type testnet --tonconnect
```

## Verify

After deployment:

```sh
npm run verify -- --testnet --tonconnect
# or
npm run verify -- --mainnet --tonconnect
```

Choose manual address entry when prompted and paste the deployed master address.
Verification publishes an on-chain source proof and requires an additional
wallet transaction.

No smart contract can honestly be described as "100% safe." This repository
reduces authority and attack surface, but production deployment should still
receive an independent audit and a testnet rehearsal.
