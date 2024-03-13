import "dotenv/config";
import admin, { ServiceAccount } from "firebase-admin";

import Application from "../src/lib";
import serviceAccount from "../assets/serviceAccount.json";

async function main() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
 const wallet = await Application.instance.wallet.getWallet("@typenonnull");
  await Application.instance.tip.tipUsers(wallet, 1n, "@nuelidu");
}

main().catch(console.log);
