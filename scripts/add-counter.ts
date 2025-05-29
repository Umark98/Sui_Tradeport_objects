import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { SUI_NETWORK, getSigner } from "./config";
import dotenv from "dotenv";

dotenv.config();

const client = new SuiClient({
  url: SUI_NETWORK,
});

export async function addFieldForMoments<T>(type: string) {
  const tx = new Transaction();
  const signer = await getSigner();

  const adminCap = process.env.ADMIN_CAP?.toString() || "";
  const dynamicCounter = process.env.DYNAMIC_COUNTER?.toString() || "";
  const packageID = process.env.PACKAGE_ID?.toString() || "";

  tx.moveCall({
    target: `${packageID}::moments::add_field`,
    arguments: [
      tx.object(adminCap), 
      tx.object(dynamicCounter)  
    ],
    typeArguments: [`${packageID}::moments::${type}`],
  });

  tx.setGasBudget(1000000000);

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: signer,
    options: {
      showEffects: true,
    },
  });

  console.log('New type added to dynamic counter successfully!');

  return result;
}

addFieldForMoments("SuiCreaturesPOAP1"); 