import {
  buildCurrentUserDataExport,
  buildPoliciesCsv,
  getExportFilename,
} from "@/lib/account-data-export";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "json";

  try {
    const bundle = await buildCurrentUserDataExport();

    if (!bundle) {
      return Response.json(
        { error: "Accedi di nuovo per esportare i tuoi dati." },
        { status: 401 }
      );
    }

    const filename = getExportFilename(format, bundle.generatedAt);

    if (format === "csv") {
      const csv = buildPoliciesCsv(bundle.policies);

      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return Response.json(bundle, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Non siamo riusciti a preparare l'esportazione. Riprova tra qualche minuto.",
      },
      { status: 500 }
    );
  }
}
