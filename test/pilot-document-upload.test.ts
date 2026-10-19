import assert from "node:assert/strict";
import { isOwnedDirectPdfPath, normalizeUploadedPdfName } from "../lib/document-upload-validation";

const owner = "66d41a5b-4c3d-4ec1-811a-18b2cafb7d6e";
const other = "e89d22d2-af18-412a-b5af-66d0f948f9f8";
const uuid = "5531315a-caa5-4842-b96a-520359f54fe8";
assert.equal(isOwnedDirectPdfPath(owner + "/" + uuid + ".pdf", owner), true);
assert.equal(isOwnedDirectPdfPath(other + "/" + uuid + ".pdf", owner), false);
assert.equal(isOwnedDirectPdfPath(owner + "/../" + uuid + ".pdf", owner), false);
assert.equal(isOwnedDirectPdfPath(owner + "/randomname.pdf", owner), false);
assert.equal(isOwnedDirectPdfPath(owner + "/" + uuid + ".jpg", owner), false);
assert.equal(normalizeUploadedPdfName("polizza.pdf"), "polizza.pdf");
assert.equal(normalizeUploadedPdfName("sample.exe"), null);
assert.equal(normalizeUploadedPdfName("a".repeat(220) + ".pdf")?.endsWith(".pdf"), true);
assert.equal(normalizeUploadedPdfName("a".repeat(220) + ".pdf")?.length, 180);
console.info("PASS private direct-upload path and filename validation");
