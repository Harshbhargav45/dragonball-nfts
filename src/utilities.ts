import { Keypair, sol, Umi } from "@metaplex-foundation/umi";
import { create } from "@metaplex-foundation/mpl-core";
import { createGenericFile, generateSigner } from "@metaplex-foundation/umi";
import { base58 } from "@metaplex-foundation/umi/serializers";
import fs from "fs";
import path from "path";

export const mainnetAddress = "https://node1.irys.xyz";
export const devnetAddress = "https://devnet.irys.xyz";
export const filePath = "./src/user_wallet.json";

export function loadKeypairFromFile(secretFilePath: string, umi: Umi): Keypair {
  const secret = JSON.parse(fs.readFileSync(secretFilePath, "utf-8"));
  const secretKey = Uint8Array.from(secret);
  return umi.eddsa.createKeypairFromSecretKey(secretKey);
}

export function getOrCreateWallet(umi: Umi): Keypair {
  if (fs.existsSync(filePath)) return loadKeypairFromFile(filePath, umi);
  const keypair = generateSigner(umi);
  fs.writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)));
  console.log("Created wallet at:", filePath);
  return keypair;
}

export async function requestAirdrop(umi: Umi): Promise<void> {
  const publicKey = umi.identity.publicKey;
  const balance = await umi.rpc.getBalance(publicKey);
  const balanceInSol = Number(balance.basisPoints) / 1_000_000_000;
  if (balanceInSol < 0.5) {
    console.log("Requesting airdrop...");
    await umi.rpc.airdrop(publicKey, sol(0.6));
  }
}

export async function uploadImage(
  imagePath: string,
  umi: Umi
): Promise<string> {
  const imageFile = fs.readFileSync(imagePath);
  const extension = path.extname(imagePath).toLowerCase();
  const mimeType = extension === ".png" ? "image/png" : "image/jpeg";
  const umiImageFile = createGenericFile(imageFile, path.basename(imagePath), {
    tags: [{ name: "Content-Type", value: mimeType }],
  });
  const imageUri = await umi.uploader.upload([umiImageFile]);
  return imageUri[0] as string;
}

interface Metadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
  properties: { files: Array<{ uri: string; type: string }>; category: string };
}

export async function uploadMetadata(
  metadata: Metadata,
  umi: Umi
): Promise<string> {
  const metadataUri = await umi.uploader.uploadJson(metadata);
  return metadataUri;
}

export async function mintNft(
  metadataUri: string,
  name: string,
  umi: Umi
): Promise<void> {
  const mintSigner = generateSigner(umi);
  const tx = await create(umi, {
    asset: mintSigner,
    name: name,
    uri: metadataUri,
  }).sendAndConfirm(umi);
  const signature = base58.deserialize(tx.signature)[0];
  console.log(`NFT Created: ${name}`);
  console.log(
    `Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
  console.log(
    `Metaplex: https://core.metaplex.com/explorer/${mintSigner.publicKey}?env=devnet`
  );
}

export function createMetadata(
  name: string,
  description: string,
  imageUri: string,
  attributes: Array<{ trait_type: string; value: string }>
): Metadata {
  return {
    name,
    description,
    image: imageUri,
    attributes,
    properties: {
      files: [{ uri: imageUri, type: "image/jpg" }],
      category: "image",
    },
  };
}

export const dragonballNfts = [
  {
    name: "Goku",
    imagePath: "./assets/goku.jpg",
    description:
      "The Saiyan raised on Earth who defends it with his immense strength and pure heart.",
    attributes: [
      { trait_type: "Power Level", value: "9000+" },
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Form", value: "Super Saiyan" },
      { trait_type: "Price", value: "0.2 SOL" },
    ],
  },
  {
    name: "Vegeta",
    imagePath: "./assets/vegeta.jpg",
    description:
      "The proud Prince of Saiyans who constantly strives to surpass Goku.",
    attributes: [
      { trait_type: "Power Level", value: "8500" },
      { trait_type: "Rarity", value: "Epic" },
      { trait_type: "Form", value: "Super Saiyan Blue" },
      { trait_type: "Price", value: "0.25 SOL" },
    ],
  },
  {
    name: "Gohan",
    imagePath: "./assets/gohan.jpg",
    description:
      "Goku's eldest son, known for his untapped potential and great heart.",
    attributes: [
      { trait_type: "Power Level", value: "7000" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Form", value: "Ultimate Gohan" },
      { trait_type: "Price", value: "0.15 SOL" },
    ],
  },
  {
    name: "Gotenks",
    imagePath: "./assets/gotenks.jpg",
    description:
      "The fusion of Goten and Trunks, playful but powerful warrior.",
    attributes: [
      { trait_type: "Power Level", value: "7800" },
      { trait_type: "Rarity", value: "Epic" },
      { trait_type: "Form", value: "Super Saiyan 3" },
      { trait_type: "Price", value: "0.18 SOL" },
    ],
  },
];
