import "server-only";

export class DataFetchError extends Error {
  constructor(scope: string, cause?: { message?: string }) {
    super(
      "Impossibile caricare i dati adesso. Aggiorna la pagina o riprova tra poco."
    );
    this.name = "DataFetchError";
    if (cause?.message) {
      console.error(`[atlas:data] ${scope}`, cause.message);
    }
  }
}
