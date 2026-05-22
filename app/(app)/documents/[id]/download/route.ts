import { createSignedDocumentUrl, getCurrentUserDocumentById } from "@/lib/documents";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const document = await getCurrentUserDocumentById(id);

  if (!document) {
    return new Response(null, { status: 404 });
  }

  const signedUrl = await createSignedDocumentUrl(document);

  if (!signedUrl) {
    return new Response(null, { status: 404 });
  }

  return Response.redirect(signedUrl, 302);
}
