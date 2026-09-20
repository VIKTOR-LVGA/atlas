export class OperationsInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationsInputError";
  }
}
