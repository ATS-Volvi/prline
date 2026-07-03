import { Request, Response } from 'express';
import * as ragService from '../services/ragService';
import { logAction } from '../services/auditService';

export const ragChatController = async (req: Request, res: Response) => {
  try {
    const { query, dateRange, lineId } = req.body;
    const userId = req.authData?.userId || 'unknown-user';
    const userRole = req.authData?.userType || 'reviewer';

    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid query parameter.' });
      return;
    }

    // Proactively refresh embeddings first (so we always run on relatively fresh state)
    await ragService.refreshEmbeddings(userId);

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
      answer = await ragService.generateAnswer(query, filteredChunks);
      
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
