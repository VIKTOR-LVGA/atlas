import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { documentWalletCategoryLabels,inferDocumentWalletCategory,type DocumentWalletCategory } from "@/lib/document-wallet";
import {formatDate,formatFileSize} from "@/lib/utils";
import type {UserDocument,UserPolicy} from "@/lib/types";

export function DocumentWalletList({documents,policiesByDocumentId}:{documents:UserDocument[];policiesByDocumentId:Map<string,UserPolicy>}){
 const grouped=new Map<DocumentWalletCategory,UserDocument[]>();
 for(const doc of documents){
  const category=inferDocumentWalletCategory(doc,policiesByDocumentId.get(doc.id)??null);
  const list=grouped.get(category)??[];list.push(doc);grouped.set(category,list);
 }
 const categories=Object.keys(documentWalletCategoryLabels) as DocumentWalletCategory[];
 return <div className="space-y-7">
   {categories.map(category=>{
    const docs=grouped.get(category);
    if(!docs?.length)return null;
    return <section key={category}>
      <h2 className="mb-3 text-[16px] font-bold tracking-[-.02em] text-foreground">{documentWalletCategoryLabels[category]}</h2>
      <ul className="atlas-consumer-card divide-y divide-border-subtle overflow-hidden">
        {docs.map(doc=>{
          const policy=policiesByDocumentId.get(doc.id)??null;
          return <li key={doc.id}>
            <Link href={`/documents/${doc.id}`} className="atlas-consumer-press flex min-h-[82px] items-center gap-3.5 px-4 py-3.5 sm:px-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-accent-soft text-accent"><FileText className="h-5 w-5" aria-hidden/></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-foreground sm:text-[14px]">{doc.fileName}</span>
                <span className="mt-1 block truncate text-[11px] text-muted">{policy?policy.provider:"Da associare"} · {formatDate(doc.createdAt)} · {formatFileSize(doc.fileSize)}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-accent" aria-hidden/>
            </Link>
          </li>;
        })}
      </ul>
    </section>;
   })}
 </div>;
}
