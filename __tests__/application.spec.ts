import "dotenv/config"
import admin, { ServiceAccount } from "firebase-admin";

import Application from "../src/lib";
import serviceAccount from "../assets/serviceAccount.json";

async function main() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });
  const wallet = await Application.instance.wallet.getWallet("@typenonnull");
  const contract = Application.instance.wallet.getContract("0xdac17f958d2ee523a2206206994597c13d831ec7");
  await Application.instance.wallet.getBalance(wallet, contract).then(console.log);
}


main().catch(console.log);