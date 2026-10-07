import { prisma } from "@/lib/db/prisma";
import { linkFileMorph } from "@/lib/services/files";
import { genDocumentId } from "@/lib/services/user-wallet";

// Faithful port of api/business/controllers/business.js.
// businesses is a plain (non-link-table) model keyed by user_id; a user may
// have several rows and "their business" is always the latest (max id).

const USER_DOC_MORPH = "api::user-document.user-document";

type BusinessInput = {
  business_fullname?: string;
  tax_code?: string;
  headquarters_address?: string;
  headquarters_address_province_code?: string;
  headquarters_address_nation_code?: string;
  current_address?: string;
  current_address_province_code?: string;
  current_address_nation_code?: string;
  current_address_map?: string;
  status?: string;
  documents?: Array<{ type: string; file_ids?: number[] }>;
};

const COLUMNS = [
  "business_fullname",
  "tax_code",
  "headquarters_address",
  "headquarters_address_province_code",
  "headquarters_address_nation_code",
  "current_address",
  "current_address_province_code",
  "current_address_nation_code",
  "current_address_map",
  "status",
] as const;

export async function getLatestBusiness(userId: number) {
  return prisma.businesses.findFirst({
    where: { user_id: userId },
    orderBy: { id: "desc" },
  });
}

// Create or update the user's latest business, sync up_users.business_id, and
// upsert any attached user-document records (morph-linking their files).
export async function createOrUpdateBusiness(userId: number, body: BusinessInput) {
  const existing = await getLatestBusiness(userId);

  let business;
  if (existing) {
    const data: Record<string, unknown> = { updated_at: new Date() };
    for (const col of COLUMNS) {
      const v = body[col];
      data[col] = v !== undefined ? v : (existing as Record<string, unknown>)[col];
    }
    business = await prisma.businesses.update({ where: { id: existing.id }, data });
  } else {
    business = await prisma.businesses.create({
      data: {
        user_id: userId,
        business_fullname: body.business_fullname ?? null,
        tax_code: body.tax_code ?? null,
        headquarters_address: body.headquarters_address ?? null,
        headquarters_address_province_code: body.headquarters_address_province_code ?? null,
        headquarters_address_nation_code: body.headquarters_address_nation_code ?? null,
        current_address: body.current_address ?? null,
        current_address_province_code: body.current_address_province_code ?? null,
        current_address_nation_code: body.current_address_nation_code ?? null,
        current_address_map: body.current_address_map ?? null,
        status: body.status || "active",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  const created = !existing;

  // Always point up_users.business_id at the latest business.
  await prisma.up_users.update({ where: { id: userId }, data: { business_id: business.id } });

  const savedDocuments = [];
  if (Array.isArray(body.documents)) {
    for (const doc of body.documents) {
      if (!doc.type) continue;
      const fileIds = Array.isArray(doc.file_ids) ? doc.file_ids : [];

      const existingDoc = await prisma.user_documents.findFirst({
        where: { type: doc.type, user_id: userId },
      });

      let saved;
      if (existingDoc) {
        saved = await prisma.user_documents.update({
          where: { id: existingDoc.id },
          data: { type: doc.type, business_id: business.id, updated_at: new Date() },
        });
        // Replace morph links for the `file` field.
        await prisma.files_related_mph.deleteMany({
          where: { related_type: USER_DOC_MORPH, related_id: existingDoc.id, field: "file" },
        });
      } else {
        saved = await prisma.user_documents.create({
          data: {
            document_id: genDocumentId(),
            type: doc.type,
            user_id: userId,
            business_id: business.id,
            published_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      for (let i = 0; i < fileIds.length; i++) {
        await linkFileMorph(fileIds[i], USER_DOC_MORPH, saved.id, "file");
      }

      savedDocuments.push(saved);
    }
  }

  return { business, savedDocuments, created };
}

// A user is verifiable iff they have at least one user-document on file.
export async function userHasDocuments(userId: number): Promise<boolean> {
  const count = await prisma.user_documents.count({ where: { user_id: userId } });
  return count > 0;
}

export async function markBusinessVerified(userId: number) {
  const business = await getLatestBusiness(userId);
  if (business) {
    await prisma.businesses.update({
      where: { id: business.id },
      data: { status: "verified", updated_at: new Date() },
    });
  }
  return business;
}
