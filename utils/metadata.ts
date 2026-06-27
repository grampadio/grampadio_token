import { createHash } from "crypto";
import { beginCell, Cell, Dictionary } from "@ton/core";

export const GRAMX_LOGO_URL =
  "https://brown-gigantic-crab-18.mypinata.cloud/ipfs/bafkreigmh33ljdmvddex3dksa32g4od67niyir7i5f7q4ynkxnmwo7bvam";

export const GRAMX_METADATA = {
  name: "Grampad Token",
  symbol: "GRAMX",
  decimals: "9",
  description:
    "GramPad Token ($GRAMX) is the utility token of the GramPad launchpad ecosystem, built for IDO participation, staking, governance, fee discounts, rewards, and investor protection across TON/Web3 projects"
} as const;

function keyHash(key: string): bigint {
  return BigInt(`0x${createHash("sha256").update(key).digest("hex")}`);
}

function snakeTail(data: Buffer): Cell {
  const chunk = data.subarray(0, 127);
  const rest = data.subarray(chunk.length);
  const builder = beginCell().storeBuffer(chunk);
  if (rest.length > 0) {
    builder.storeRef(snakeTail(rest));
  }
  return builder.endCell();
}

function snakeValue(data: Buffer): Cell {
  const chunk = data.subarray(0, 126);
  const rest = data.subarray(chunk.length);
  const builder = beginCell().storeUint(0, 8).storeBuffer(chunk);
  if (rest.length > 0) {
    builder.storeRef(snakeTail(rest));
  }
  return builder.endCell();
}

export function buildGramxMetadata(): Cell {
  const values = Dictionary.empty(
    Dictionary.Keys.BigUint(256),
    Dictionary.Values.Cell()
  );

  values.set(keyHash("name"), snakeValue(Buffer.from(GRAMX_METADATA.name)));
  values.set(keyHash("symbol"), snakeValue(Buffer.from(GRAMX_METADATA.symbol)));
  values.set(
    keyHash("decimals"),
    snakeValue(Buffer.from(GRAMX_METADATA.decimals))
  );
  values.set(
    keyHash("description"),
    snakeValue(Buffer.from(GRAMX_METADATA.description))
  );
  values.set(keyHash("image"), snakeValue(Buffer.from(GRAMX_LOGO_URL)));

  return beginCell().storeUint(0, 8).storeDict(values).endCell();
}
