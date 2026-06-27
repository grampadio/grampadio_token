import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { beginCell, toNano } from "@ton/core";
import "@ton/test-utils";
import { GramPadTokenMaster } from "../build/GramPadToken_GramPadTokenMaster";
import { GramPadTokenWallet } from "../build/GramPadToken_GramPadTokenWallet";
import { buildGramxMetadata } from "../utils/metadata";

const TOTAL_SUPPLY = 1_000_000_000n * 1_000_000_000n;

describe("GramPad Token", () => {
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let attacker: SandboxContract<TreasuryContract>;
  let master: SandboxContract<GramPadTokenMaster>;
  let holderWallet: SandboxContract<GramPadTokenWallet>;

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    deployer = await blockchain.treasury("deployer");
    attacker = await blockchain.treasury("attacker");

    const metadata = buildGramxMetadata();
    master = blockchain.openContract(
      await GramPadTokenMaster.fromInit(deployer.address, metadata)
    );

    const deployment = await master.send(
      deployer.getSender(),
      { value: toNano("0.75") },
      { $$type: "DeployToken", queryId: 0n }
    );
    expect(deployment.transactions).toHaveTransaction({
      from: deployer.address,
      to: master.address,
      deploy: true,
      success: true
    });

    holderWallet = blockchain.openContract(
      GramPadTokenWallet.fromAddress(
        await master.getGetWalletAddress(deployer.address)
      )
    );
  });

  it("issues exactly one billion GRAMX once", async () => {
    const masterData = await master.getGetJettonData();
    const walletData = await holderWallet.getGetWalletData();

    expect(masterData.totalSupply).toBe(TOTAL_SUPPLY);
    expect(masterData.mintable).toBe(false);
    expect(walletData.balance).toBe(TOTAL_SUPPLY);
    expect(await master.getIsInitialized()).toBe(true);
  });

  it("rejects a second genesis issuance", async () => {
    const retry = await master.send(
      attacker.getSender(),
      { value: toNano("0.75") },
      { $$type: "DeployToken", queryId: 1n }
    );

    expect(retry.transactions).toHaveTransaction({
      from: attacker.address,
      to: master.address,
      success: false
    });
    expect((await holderWallet.getGetWalletData()).balance).toBe(TOTAL_SUPPLY);
  });

  it("allows holder transfers and preserves supply", async () => {
    const amount = 25_000n * 1_000_000_000n;
    const transfer = await holderWallet.send(
      deployer.getSender(),
      { value: toNano("0.1") },
      {
        $$type: "JettonTransfer",
        queryId: 2n,
        amount,
        destination: attacker.address,
        responseDestination: deployer.address,
        customPayload: null,
        forwardTonAmount: 1n,
        forwardPayload: beginCell().storeUint(0, 1).endCell().beginParse()
      }
    );
    expect(transfer.transactions).toHaveTransaction({
      from: holderWallet.address,
      to: await master.getGetWalletAddress(attacker.address),
      success: true
    });

    const attackerWallet = blockchain.openContract(
      GramPadTokenWallet.fromAddress(
        await master.getGetWalletAddress(attacker.address)
      )
    );
    expect((await attackerWallet.getGetWalletData()).balance).toBe(amount);
    expect((await master.getGetJettonData()).totalSupply).toBe(TOTAL_SUPPLY);
  });

  it("rejects transfers not signed by the wallet owner", async () => {
    const attempt = await holderWallet.send(
      attacker.getSender(),
      { value: toNano("0.1") },
      {
        $$type: "JettonTransfer",
        queryId: 3n,
        amount: 1n,
        destination: attacker.address,
        responseDestination: attacker.address,
        customPayload: null,
        forwardTonAmount: 0n,
        forwardPayload: beginCell().storeUint(0, 1).endCell().beginParse()
      }
    );
    expect(attempt.transactions).toHaveTransaction({
      from: attacker.address,
      to: holderWallet.address,
      success: false
    });
    expect((await holderWallet.getGetWalletData()).balance).toBe(TOTAL_SUPPLY);
  });

  it("allows holders to burn and reduces total supply", async () => {
    const amount = 1_000n * 1_000_000_000n;
    await holderWallet.send(
      deployer.getSender(),
      { value: toNano("0.08") },
      {
        $$type: "JettonBurn",
        queryId: 4n,
        amount,
        responseDestination: deployer.address,
        customPayload: null
      }
    );

    expect((await holderWallet.getGetWalletData()).balance).toBe(
      TOTAL_SUPPLY - amount
    );
    expect((await master.getGetJettonData()).totalSupply).toBe(
      TOTAL_SUPPLY - amount
    );
  });
});
