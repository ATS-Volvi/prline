import { Request, Response } from 'express';
import * as ragService from '../services/ragService';
import { logAction } from '../services/auditService';
import * as queryRouter from '../services/queryRouter';

export const ragChatController = async (req: Request, res: Response) => {
  try {
    const { query, dateRange, lineId, conversationHistory } = req.body;
    const userId = req.authData?.userId || 'unknown-user';
    const userRole = req.authData?.userType || 'reviewer';

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid query parameter.' });
      return;
    }

    // Proactively refresh embeddings in the background (non-blocking for immediate response)
    ragService.refreshEmbeddings(userId).catch(err => {
      console.error('Background RAG refresh failed:', err);
    });

    // Filters formulation
    const filters: any = {};
    if (lineId && lineId !== 'ALL') {
      filters.lineId = lineId;
    }
    
    if (dateRange) {
      const days = parseInt(dateRange);
      if (!isNaN(days)) {
        const today = new Date();
        const dateFrom = today.toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        const dateTo = futureDate.toISOString().split('T')[0];
        
        filters.dateFrom = dateFrom;
        filters.dateTo = dateTo;
      }
    }

    // Query Router / Hybrid Intelligence check
    const intent = queryRouter.classifyIntent(query);
    if (intent) {
      const result = await queryRouter.handle(intent, userId, filters);
      
      // Log structured interaction
      await logAction(
        'RAG_CHAT_QUERY',
        `Query: "${query}". Answered via Hybrid Router [${intent}] with ${result.rows.length} rows.`,
        userId,
        userRole
      );

      res.json({
        answer: result.answer,
        sources: result.rows.map((r: any) => ({ 
          entityType: intent, 
          entityId: r.id || 'N/A', 
          content: r.summary || '', 
          score: 1 
        })),
        chart: result.chart
      });
      return;
    }

    // 1. Retrieve top-8 similar chunks
    const chunks = await ragService.retrieve(query, 8, filters);

    // 2. Filter out chunks below threshold (e.g. 0.3)
    const filteredChunks = chunks.filter(c => c.score >= 0.3);

    let answer = '';
    let chartSpec: any = null;

    if (filteredChunks.length === 0) {
      answer = "I don't have enough data to answer that query.";
    } else {
      // 3. Generate answer
      answer = await ragService.generateAnswer(query, filteredChunks, conversationHistory);
      
      // 4. Suggest chart
      chartSpec = ragService.suggestChart(query, filteredChunks);
    }

    // 5. Format sources
    const sources = filteredChunks.map(c => ({
      entityType: c.entityType,
      entityId: c.entityId,
      content: c.content,
      score: c.score
    }));

    // 6. Log the interaction to the audit log
    const chunkIds = filteredChunks.map(c => c.entityId).join(', ');
    await logAction(
      'RAG_CHAT_QUERY',
      `Query: "${query}". Answered with ${sources.length} sources (${chunkIds}).`,
      userId,
      userRole
    );

    res.json({
      answer,
      sources,
      chart: chartSpec
    });

  } catch (error: any) {
    console.error('Error in ragChatController:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const ragStatusController = async (req: Request, res: Response) => {
  try {
    const { RagChunk } = await import('../../../database/models/models/models');
    const chunkCount = await RagChunk.count();
    res.json({
      chunkCount,
      lastRefreshAt: ragService.lastRefreshAt,
      lastRefreshError: ragService.lastRefreshError,
      embeddingModelLoaded: ragService.embeddingModelLoaded
    });
  } catch (error: any) {
    console.error('Error in ragStatusController:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
