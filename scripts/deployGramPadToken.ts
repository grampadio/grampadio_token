import { toNano } from "@ton/core";
import { NetworkProvider } from "@ton/blueprint";
import { GramPadTokenMaster } from "../build/GramPadToken_GramPadTokenMaster";
import { buildGramxMetadata } from "../utils/metadata";

export async function run(provider: NetworkProvider) {
  const initialHolder = provider.sender().address;
  if (!initialHolder) {
    throw new Error("Connect a wallet before deploying GRAMX");
  }

  const metadata = buildGramxMetadata();
  const master = provider.open(
    await GramPadTokenMaster.fromInit(initialHolder, metadata)
  );

  if (await provider.isContractDeployed(master.address)) {
    throw new Error(`GRAMX is already deployed at ${master.address.toString()}`);
  }

  await master.send(
    provider.sender(),
    { value: toNano("0.75") },
    { $$type: "DeployToken", queryId: 0n }
  );
  await provider.waitForDeploy(master.address);

  console.log(`GRAMX master: ${master.address.toString()}`);
  console.log(`Initial holder: ${initialHolder.toString()}`);
}
