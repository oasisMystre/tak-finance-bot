import { Firebase }from "./providers";

export default class Repository {
  readonly firebase: Firebase;

  constructor() {
    this.firebase = new Firebase();
  }
}
