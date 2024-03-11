import "dotenv/config";
import admin, { ServiceAccount } from "firebase-admin";

import Application from "../src/lib";
import serviceAccount from "../assets/serviceAccount.json";

async function main() {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
  });

  await Application.instance.tip.tipUsers("@typenonnull", 1n, ["@nuelidu"]);
}

main().catch(console.log);
