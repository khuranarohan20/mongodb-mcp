import { z } from "zod";

export const GetDocumentsSchema = z.object({
  collection: z.string(),
  query: z.record(z.any()).optional(),
  limit: z.number().optional(),
  skip: z.number().optional(),
});

export const GetDocumentByIdSchema = z.object({
  collection: z.string(),
  id: z.string(),
});

export const CreateDocumentSchema = z.object({
  collection: z.string(),
  document: z.record(z.any()),
});

export const UpdateDocumentSchema = z.object({
  collection: z.string(),
  id: z.string(),
  document: z.record(z.any()),
});

export const DeleteDocumentSchema = z.object({
  collection: z.string(),
  id: z.string(),
});
