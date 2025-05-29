import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs"
import { SUI_NETWORK, getSigner } from "./config";
import dotenv from "dotenv";

dotenv.config();

const client = new SuiClient({
  url: SUI_NETWORK,
});

export type DisplayFieldsType = {
    keys: string[];
    values: string[];
};

export async function createDisplay(type: string) {
  const tx = new Transaction();
  const signer = await getSigner();

  let displayObject: DisplayFieldsType = {
    keys: [
      "name",
      "image_url",
      "description",
      "royalty",
      "rarity",
      "background_color",
    ],
    values: [
      "Angry Apes",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMwA9z70m2SCZtFjMh1ZaZIvFo9VJkAkKaxw&s",
      "Karate monkey",
      "50%",
      "Rare",
      "#FF0000",

    ],
  };

  const publisherID = process.env.PUBLISHER_ID || "";
  const packageID = process.env.PACKAGE_ID || "";

  tx.setGasBudget(10000000);

  let display = tx.moveCall({
    target: "0x2::display::new_with_fields",
    arguments: [
      tx.object(publisherID),
      tx.pure(bcs.vector(bcs.string()).serialize(displayObject.keys)),
      tx.pure(bcs.vector(bcs.string()).serialize(displayObject.values))
    ],
    typeArguments: [`${packageID}::nft::Public<${packageID}::nft::${type}>`],
  });

  tx.moveCall({
    target: "0x2::display::update_version",
    arguments: [display],
    typeArguments: [`${packageID}::nft::Public<${packageID}::nft::${type}>`],
  });

  tx.transferObjects([display], signer.toSuiAddress());

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: signer,
    options: {
      showEffects: true,
    },
  });

  const display_id = (result.effects?.created &&
    result.effects?.created[0].reference.objectId) as string;

  console.log("Display created successfully");

  return display_id;
}

createDisplay("NFT1");