import "server-only";

import { cache } from "react";
import { getCurrentUserDocuments } from "@/lib/documents";
import type { UserDocument } from "@/lib/types";

export type DashboardStats = {
  totalDocuments: number;
  documentsUploadedThisMonth: number;
  analyzedDocuments: number;
  processingDocuments: number;
  latestDocument: UserDocument | null;
  totalStorageUsed: number;
};

function sumDocumentStorage(documents: UserDocument[]) {
  return documents.reduce((total, document) => total + (document.fileSize ?? 0), 0);
}

function getCurrentMonthWindow(now: Date) {
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const nextMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

  return { monthStart, nextMonthStart };
}

function isUploadedThisMonth(
  document: UserDocument,
  monthStart: number,
  nextMonthStart: number
) {
  const uploadedAt = new Date(document.createdAt).getTime();

  return (
    Number.isFinite(uploadedAt) &&
    uploadedAt >= monthStart &&
    uploadedAt < nextMonthStart
  );
}

export const getStorageUsage = cache(async () => {
  const documents = await getCurrentUserDocuments();

  return sumDocumentStorage(documents);
});

export const getRecentDocuments = cache(async (limit = 5) => {
  const documents = await getCurrentUserDocuments();

  return documents.slice(0, Math.max(0, limit));
});

export const getDashboardStats = cache(async (): Promise<DashboardStats> => {
  const documents = await getCurrentUserDocuments();
  const { monthStart, nextMonthStart } = getCurrentMonthWindow(new Date());

  return {
    totalDocuments: documents.length,
    documentsUploadedThisMonth: documents.filter((document) =>
      isUploadedThisMonth(document, monthStart, nextMonthStart)
    ).length,
    analyzedDocuments: documents.filter(
      (document) => document.status === "analyzed"
    ).length,
    processingDocuments: documents.filter(
      (document) => document.status === "processing"
    ).length,
    latestDocument: documents[0] ?? null,
    totalStorageUsed: await getStorageUsage(),
  };
});
