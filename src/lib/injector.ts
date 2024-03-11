import Repository from "./repository";

export default abstract class Injector {
  constructor(protected readonly repository: Repository) {}
}
