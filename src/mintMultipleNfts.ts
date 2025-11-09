import { mplCore } from "@metaplex-foundation/mpl-core";
import {
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import {
  createMetadata,
  dragonballNfts,
  devnetAddress,
  getOrCreateWallet,
  mintNft,
  requestAirdrop,
  uploadImage,
  uploadMetadata,
} from "./utilities";

const mintMultipleNfts = async (): Promise<void> => {
  const umi = createUmi("https://api.devnet.solana.com")
    .use(mplCore())
    .use(irysUploader({ address: devnetAddress }));
  const wallet = getOrCreateWallet(umi);
  const signer = createSignerFromKeypair(umi, wallet);
  umi.use(signerIdentity(signer));
  console.log("Wallet:", signer.publicKey);
  await requestAirdrop(umi);

  const imageUris = await Promise.all(
    dragonballNfts.map((nft) => uploadImage(nft.imagePath, umi))
  );
  const metadataUris = await Promise.all(
    dragonballNfts.map((nft, i) => {
      const metadata = createMetadata(
        nft.name,
        nft.description,
        imageUris[i],
        nft.attributes
      );
      return uploadMetadata(metadata, umi);
    })
  );

  await Promise.all(
    dragonballNfts.map((nft, i) => mintNft(metadataUris[i], nft.name, umi))
  );
  console.log("All NFTs minted successfully!");
};

mintMultipleNfts();
