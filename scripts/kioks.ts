// //first run this to create kiosk and add first object and if you want to add additional object in the same kiosk then uncomment the part 2 code and run it again
// import { Transaction } from "@mysten/sui/transactions";
// import { SuiClient, SuiObjectResponse } from "@mysten/sui/client";
// import dotenv from "dotenv";
// import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// // Configure dotenv
// dotenv.config();

// // Configuration
// const SUI_NETWORK: string = process.env.SUI_NETWORK || "https://fullnode.mainnet.sui.io";
// const client: SuiClient = new SuiClient({ url: SUI_NETWORK });

// // Interface for transaction result
// interface TransactionResult {
//   kioskID: string;
//   poapID: string;
//   kioskOwnerCapID: string;
// }

// // Interface for Sui object owner
// interface SuiObjectOwner {
//   AddressOwner?: string;
//   Shared?: { initial_shared_version: number };
// }

// // Interface for transaction effects
// interface TransactionEffects {
//   status: { status: string; error?: string };
//   created?: Array<{ owner: SuiObjectOwner; reference: { objectId: string } }>;
// }

// // Utility function to derive signer from mnemonic
// async function getSigner(): Promise<Ed25519Keypair> {
//   const mnemonic: string | undefined = process.env.MNEMONIC;
//   if (!mnemonic) {
//     throw new Error("MNEMONIC not set in .env");
//   }
//   const keypair: Ed25519Keypair = Ed25519Keypair.deriveKeypair(mnemonic);
//   return keypair;
// }

// // Utility function to verify POAP ownership
// async function verifyPoapOwnership(poapID: string, signerAddress: string): Promise<string> {
//   try {
//     const poap: SuiObjectResponse = await client.getObject({
//       id: poapID,
//       options: { showOwner: true, showType: true },
//     });
//     console.log("POAP Object:", JSON.stringify(poap, null, 2));
//     if (!poap.data) {
//       throw new Error(`POAP ${poapID} does not exist`);
//     }
//     const owner = poap.data.owner as SuiObjectOwner;
//     if (owner.AddressOwner !== signerAddress) {
//       throw new Error(`POAP ${poapID} is not owned by ${signerAddress}`);
//     }
//     const poapType: string = poap.data.type!;
//     console.log("POAP Type:", poapType);
//     return poapType;
//   } catch (error: unknown) {
//     console.error("Error verifying POAP:", error);
//     throw error;
//   }
// }

// async function placeObjectInKiosk(): Promise<TransactionResult> {
//   const packageID: string | undefined = process.env.PACKAGE_ID;
//   if (!packageID) {
//     throw new Error("Missing PACKAGE_ID in .env");
//   }

//   const signer: Ed25519Keypair = await getSigner();
//   const signerAddress: string = await signer.toSuiAddress();
//   const poapID: string = "0x2bad340dc1ba5663444d4f9251b71ec4e48faddccd04c45d3f42099386941b6f";

//   // Verify POAP ownership and type
//   console.log("Signer Address:", signerAddress);
//   const poapType: string = await verifyPoapOwnership(poapID, signerAddress);

//   // Step 1: Create and share Kiosk (first transaction)
//   const tx1: Transaction = new Transaction();
//   tx1.setGasBudget(100000000);
//   const kioskResult = tx1.moveCall({
//     target: "0x2::kiosk::new",
//     arguments: [],
//   });
//   console.log("Step 1: Kiosk created", kioskResult);

//   const kiosk = tx1.object(kioskResult[0]);
//   tx1.moveCall({
//     target: "0x2::transfer::public_share_object",
//     arguments: [kiosk],
//     typeArguments: ["0x2::kiosk::Kiosk"],
//   });
//   console.log("Step 2: Kiosk shared");

//   const kioskOwnerCap = tx1.object(kioskResult[1]);
//   tx1.transferObjects([kioskOwnerCap], signerAddress);
//   console.log("Step 3: KioskOwnerCap transfer prepared");

//   console.log("Transaction 1 Block:", JSON.stringify(tx1, null, 2));

//   const result1 = await client.signAndExecuteTransaction({
//     transaction: tx1,
//     signer: signer,
//     options: {
//       showEffects: true,
//       showObjectChanges: true,
//     },
//   });
//   console.log("Transaction 1 executed");
// // @ts-ignore
// const effects1: TransactionEffects | undefined = result1.effects;
// if (effects1?.status.status !== "success") {
//     throw new Error(`Transaction 1 failed: ${JSON.stringify(effects1?.status)}`);
// }

// const kioskID: string | undefined = effects1?.created?.find(
//     (obj) => "Shared" in (obj.owner || {})
// )?.reference.objectId;

// const kioskOwnerCapID: string | undefined = effects1?.created?.find(
//     (obj) => obj.owner?.AddressOwner === signerAddress
// )?.reference.objectId;

// if (!kioskID || !kioskOwnerCapID) {
//     throw new Error("Failed to extract kioskID or kioskOwnerCapID from Transaction 1");
// }

// console.log("Kiosk created successfully:", kioskID);
// console.log("KioskOwnerCap created successfully:", kioskOwnerCapID);
// console.log("Transaction 1 effects:", JSON.stringify(effects1, null, 2));

// // Step 2: Place POAP in Kiosk (second transaction)
// const tx2: Transaction = new Transaction();
// tx2.setGasBudget(100000000);
// tx2.moveCall({
//     target: "0x2::kiosk::place",
//     arguments: [
//         tx2.object(kioskID), // Use the shared Kiosk IDa
//         tx2.object(kioskOwnerCapID),
//         tx2.object(poapID),
//     ],
//     typeArguments: [poapType],
// });
// console.log("Step 4: POAP placed in kiosk");

// // Log transaction block for debugging
// console.log("Transaction 2 Block:", JSON.stringify(tx2, null, 2));

// const result2 = await client.signAndExecuteTransaction({
//     transaction: tx2,
//     signer: signer,
//     options: {
//         showEffects: true,
//         showObjectChanges: true,
//     },
//   });
//   console.log("Transaction 2 executed");
  
//   // @ts-ignore
//   const effects2: TransactionEffects | undefined = result2.effects;
//   if (effects2?.status.status !== "success") {
//       throw new Error(`Transaction 2 failed: ${JSON.stringify(effects2?.status)}`);
//     }
    
//     console.log("POAP placed in kiosk:", poapID);
//     console.log("Transaction 2 effects:", JSON.stringify(effects2, null, 2));
    
//     return { kioskID, poapID, kioskOwnerCapID };
// }

// // Execute
// placeObjectInKiosk().then(console.log).catch(console.error);







// part 2 for adding additional nft in same kiosk
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, SuiObjectResponse } from "@mysten/sui/client";
import dotenv from "dotenv";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

// Configure dotenv
dotenv.config();

// Configuration
const SUI_NETWORK: string = process.env.SUI_NETWORK || "https://fullnode.testnet.sui.io";
const client: SuiClient = new SuiClient({ url: SUI_NETWORK });

// Interface for Sui object owner
interface SuiObjectOwner {
  AddressOwner?: string;
  Shared?: { initial_shared_version: number };
}

// Interface for transaction effects
interface TransactionEffects {
  status: { status: string; error?: string };
  created?: Array<{ owner: SuiObjectOwner; reference: { objectId: string } }>;
}

// Utility function to derive signer from mnemonic
async function getSigner(): Promise<Ed25519Keypair> {
  const mnemonic: string | undefined = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("MNEMONIC not set in .env");
  }
  const keypair: Ed25519Keypair = Ed25519Keypair.deriveKeypair(mnemonic);
  return keypair;
}

// Utility function to verify NFT ownership
async function verifyNftOwnership(nftID: string, signerAddress: string): Promise<string> {
  try {
    const nft: SuiObjectResponse = await client.getObject({
      id: nftID,
      options: { showOwner: true, showType: true },
    });
    console.log("NFT Object:", JSON.stringify(nft, null, 2));
    if (!nft.data) {
      throw new Error(`NFT ${nftID} does not exist`);
    }
    const owner = nft.data.owner as SuiObjectOwner;
    if (owner.AddressOwner !== signerAddress) {
      throw new Error(`NFT ${nftID} is not owned by ${signerAddress}`);
    }
    const nftType: string = nft.data.type!;
    console.log("NFT Type:", nftType);
    return nftType;
  } catch (error: unknown) {
    console.error("Error verifying NFT:", error);
    throw error;
  }
}

// Function to place an additional NFT in the existing kiosk
async function addNftToKiosk(kioskID: string, kioskOwnerCapID: string, nftID: string): Promise<void> {
  const signer: Ed25519Keypair = await getSigner();
  const signerAddress: string = await signer.toSuiAddress();

  // Verify NFT ownership and type
  console.log("Signer Address:", signerAddress);
  const nftType: string = await verifyNftOwnership(nftID, signerAddress);

  // Create transaction to place NFT in kiosk
  const tx: Transaction = new Transaction();
  tx.setGasBudget(100000000);
  tx.moveCall({
    target: "0x2::kiosk::place",
    arguments: [
      tx.object(kioskID),
      tx.object(kioskOwnerCapID),
      tx.object(nftID),
    ],
    typeArguments: [nftType],
  });
  console.log("Placing NFT in kiosk:", nftID);

  // Log transaction block for debugging
  console.log("Transaction Block:", JSON.stringify(tx, null, 2));

  // Execute transaction
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: signer,
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });
  console.log("Transaction executed");

  // @ts-ignore
  const effects: TransactionEffects | undefined = result.effects;
  if (effects?.status.status !== "success") {
    throw new Error(`Transaction failed: ${JSON.stringify(effects?.status)}`);
  }

  console.log("NFT placed in kiosk:", nftID);
  console.log("Transaction effects:", JSON.stringify(effects, null, 2));
}

// Execute
async function main() {
  try {
    const kioskID = "0xd4c441548bd5dbd704cacb06c00191c0e2f8e234804eecfa6f4e5d2dad87cfae";
    const kioskOwnerCapID = "0xc3542e6794c2b53f5bf3266845dee10fe24f0f9bea87c15e4ec41dcbe0fedee9";
    const newNftID = "0xd2ec7292b2f01855946756081948de6992627828f719987adf4957c132c5bf14";

    await addNftToKiosk(kioskID, kioskOwnerCapID, newNftID);
    console.log("Additional NFT added successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
