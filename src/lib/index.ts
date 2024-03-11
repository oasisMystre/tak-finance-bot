import Repository from "./repository";
import { WalletController } from "./controllers";
import TipController from "./controllers/tip.controller";

export default class Application {
  readonly tip: TipController;
  readonly wallet: WalletController;

  constructor(repository: Repository) {
    this.wallet = new WalletController(repository, {
      infuraURL: process.env.INFURA_URL!,
    });

    this.tip = new TipController(repository, this.wallet);
  }

  static #instance: Application;

  static get instance() {
    if (!Application.#instance) {
      const repository = new Repository();
      Application.#instance = new Application(repository);
    }

    return Application.#instance;
  }
}
