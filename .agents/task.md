# Tasks

- `[x]` Install dependencies in backend (`@xenova/transformers`, `pgvector`)
- `[x]` Create database migration for `rag_chunks`
- `[x]` Define Sequelize model for `RagChunk`
- `[x]` Implement `ragService.ts`
  - `[x]` `chunkifyState`
  - `[x]` `embedText`
  - `[x]` `refreshEmbeddings`
  - `[x]` `retrieve`
  - `[x]` `generateAnswer`
  - `[x]` `suggestChart`
- `[x]` Implement `reportsController.ts`
- `[x]` Integrate routes in `backend/src/api/v1/routes.ts`
- `[x]` Update frontend `AiReports.tsx`
  - `[x]` Call RAG API in `handleSendMessage`
  - `[x]` Render sources and dynamically switch charts
  - `[x]` Update mock warning label
- `[x]` Verify the pipeline
