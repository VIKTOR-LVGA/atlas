import Link from "next/link";
import { notFound } from "next/navigation";
import { ClaimWorkspace } from "@/components/insurance-os/ClaimWorkspace";
import {
  buildClaimDossierText,
  getCurrentUserClaim,
  listClaimFiles,
} from "@/lib/insurance-os/claims";
import { isIosFeatureEnabled } from "@/lib/insurance-os/flags";
import { getCurrentUserPolicies } from "@/lib/policies";
import { getPolicyTypeLabel } from "@/lib/policy-types";

export const metadata = { title: "Dossier sinistro" };

export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isIosFeatureEnabled("claims")) {
    notFound();
  }

  const { id } = await params;
  const claim = await getCurrentUserClaim(id);
  if (!claim) notFound();

  const [files, policies] = await Promise.all([
    listClaimFiles(claim.id),
    getCurrentUserPolicies(),
  ]);

  const relatedPolicies = policies
    .filter((policy) => claim.relatedPolicyIds.includes(policy.id))
    .map((policy) => ({
      id: policy.id,
      label: `${policy.provider} · ${getPolicyTypeLabel(policy.policyType, policy.policyCategoryLabel)}`,
    }));

  return (
    <div className="space-y-6">
      <Link href="/claims" className="text-[12px] font-medium text-muted hover:text-foreground">
        Sinistri
      </Link>
      <ClaimWorkspace
        claim={claim}
        files={files}
        relatedPolicies={relatedPolicies}
        dossierText={buildClaimDossierText(claim, files)}
      />
    </div>
  );
}
