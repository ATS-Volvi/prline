import { sequelize } from '../../config/dbConn';
import { RagChunk, Skill, ProductionLine, Workstation, Shift, Associate, AssociateSkill, LeaveRecord, Allocation, AuditLog } from '../../../database/models/models/models';
import axios from 'axios';

let embedderPipeline: any = null;
export let lastRefreshAt: string | null = null;
export let lastRefreshError: string | null = null;
export let embeddingModelLoaded = false;

// Lazy-load the Xenova transformers pipeline
async function getEmbedder() {
  if (!embedderPipeline) {
    // Dynamic import to support ES modules if needed
    const { pipeline } = await import('@xenova/transformers');
    embedderPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedderPipeline;
}

export async function initializeModel() {
  console.log('[RAG] Loading embedding model...');
  try {
    await getEmbedder();
    embeddingModelLoaded = true;
    console.log('[RAG] Embedding model ready.');
  } catch (error: any) {
    embeddingModelLoaded = false;
    const errorMsg = error.message || String(error);
    console.error(`[RAG] FAILED to load embedding model: ${errorMsg}. RAG chat will not function until this is resolved.`);
  }
}

export async function embedText(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Config flag
export const USE_LOCAL_LLM = process.env.USE_LOCAL_LLM === 'true';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export interface ChunkInput {
  entityType: string;
  entityId: string;
  content: string;
  metadata: any;
}

export function chunkifyState(state: any): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  const associates = state.associates || [];
  const skills = state.skills || [];
  const associateSkills = state.associateSkills || [];
  const workstations = state.workstations || [];
  const productionLines = state.productionLines || [];
  const shifts = state.shifts || [];
  const allocations = state.allocations || [];
  const leaveRecords = state.leaveRecords || [];
  const auditLogs = state.auditLogs || [];

  // 1. Associates
  associates.forEach((a: any) => {
    chunks.push({
      entityType: 'associate',
      entityId: a.id,
      content: `Associate ${a.id} named ${a.name} is status ${a.status}, joined on ${a.joiningDate}, with plant reference ID ${a.plantIdRef || 'N/A'}. Employment category is ${a.category}.`,
      metadata: { associateId: a.id, status: a.status, category: a.category }
    });
  });

  // 2. Skills
  skills.forEach((s: any) => {
    chunks.push({
      entityType: 'skill',
      entityId: s.id,
      content: `Skill ${s.id} is named "${s.name}". Description: ${s.description || 'No description available'}.`,
      metadata: { skillId: s.id }
    });
  });

  // 3. Associate Skills / Certifications
  associateSkills.forEach((as: any, idx: number) => {
    const assocName = associates.find((a: any) => a.id === as.associateId)?.name || as.associateId;
    const skillName = skills.find((s: any) => s.id === as.skillId)?.name || as.skillId;
    chunks.push({
      entityType: 'certification',
      entityId: `cert-${as.associateId}-${as.skillId}-${idx}`,
      content: `Associate ${assocName} (ID: ${as.associateId}) holds certification for skill ${skillName} (ID: ${as.skillId}) at competency level ${as.level}. Certified by ${as.certifiedBy} on ${as.trainingDate}, expiring on ${as.expiryDate}. Recertification required: ${as.reCertificationRequired ? 'Yes' : 'No'}.`,
      metadata: { associateId: as.associateId, skillId: as.skillId, level: as.level, expiryDate: as.expiryDate }
    });
  });

  // 4. Workstations
  workstations.forEach((w: any) => {
    const lineName = productionLines.find((l: any) => l.id === w.lineId)?.name || w.lineId;
    const skillName = skills.find((s: any) => s.id === w.requiredSkillId)?.name || w.requiredSkillId;
    chunks.push({
      entityType: 'workstation',
      entityId: w.id,
      content: `Workstation ${w.id} named "${w.name}" belongs to production line ${lineName} (ID: ${w.lineId}). It requires skill ${skillName} (ID: ${w.requiredSkillId}) at a minimum level of ${w.minSkillLevel}. It has a maximum staffing capacity of ${w.maxStaffCount} operators.`,
      metadata: { workstationId: w.id, lineId: w.lineId, skillId: w.requiredSkillId, minSkillLevel: w.minSkillLevel }
    });
  });

  // 5. Production Lines
  productionLines.forEach((l: any) => {
    chunks.push({
      entityType: 'production_line',
      entityId: l.id,
      content: `Production Line ${l.id} named "${l.name}" is currently producing product "${l.currentProduct}". Its operating status is ${l.status}.`,
      metadata: { lineId: l.id, status: l.status }
    });
  });

  // 6. Shifts
  shifts.forEach((s: any) => {
    const days = Array.isArray(s.workingDays) ? s.workingDays : JSON.parse(s.workingDays || '[]');
    chunks.push({
      entityType: 'shift',
      entityId: s.id,
      content: `Shift ${s.id} named "${s.name}" runs during timings ${s.timings}. It is active on days: ${days.join(', ')}.`,
      metadata: { shiftId: s.id }
    });
  });

  // 7. Allocations
  allocations.forEach((al: any) => {
    const assocName = associates.find((a: any) => a.id === al.associateId)?.name || al.associateId;
    const wsName = workstations.find((w: any) => w.id === al.workstationId)?.name || al.workstationId;
    const lineName = productionLines.find((l: any) => l.id === al.lineId)?.name || al.lineId;
    chunks.push({
      entityType: 'allocation',
      entityId: al.id,
      content: `Allocation record ${al.id}: Associate ${assocName} (ID: ${al.associateId}) is assigned to workstation "${wsName}" (ID: ${al.workstationId}) on line "${lineName}" (ID: ${al.lineId}) for shift ${al.shiftId} on date ${al.date}.`,
      metadata: { associateId: al.associateId, workstationId: al.workstationId, lineId: al.lineId, shiftId: al.shiftId, date: al.date }
    });
  });

  // 8. Leave Records
  leaveRecords.forEach((lr: any) => {
    const assocName = associates.find((a: any) => a.id === lr.associateId)?.name || lr.associateId;
    chunks.push({
      entityType: 'leave',
      entityId: lr.id,
      content: `Leave record ${lr.id}: Associate ${assocName} (ID: ${lr.associateId}) is registered on leave for date ${lr.date}. Reason code: ${lr.reason || 'N/A'}. Status: ${lr.status || 'Approved'}.`,
      metadata: { associateId: lr.associateId, date: lr.date }
    });
  });

  // 9. Audit Logs
  auditLogs.slice(0, 50).forEach((log: any) => {
    chunks.push({
      entityType: 'audit_log',
      entityId: log.id,
      content: `Audit log entry ${log.id}: Action "${log.actionType}" occurred at timestamp ${log.timestamp}. Details: "${log.details}". Initiated by user ID ${log.userId} with role ${log.userRole}.`,
      metadata: { actionType: log.actionType, timestamp: log.timestamp }
    });
  });

  return chunks;
}

// Generate simple string hashes to diff contents
function getHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

export async function refreshEmbeddings(userId: string) {
  try {
    // 1. Fetch current live state
    const associates = await Associate.findAll({ where: { userId } });
    const skills = await Skill.findAll({ where: { userId } });
    const associateSkills = await AssociateSkill.findAll({ where: { userId } });
    const workstations = await Workstation.findAll({ where: { userId } });
    const productionLines = await ProductionLine.findAll({ where: { userId } });
    const shiftsRaw = await Shift.findAll({ where: { userId } });
    const allocations = await Allocation.findAll({ where: { userId } });
    const leaveRecords = await LeaveRecord.findAll({ where: { userId } });
    const auditLogs = await AuditLog.findAll({ where: { userId }, order: [['timestamp', 'DESC']] });

    const shifts = shiftsRaw.map((s: any) => ({
      ...s.toJSON(),
      workingDays: JSON.parse(s.workingDays || '[]')
    }));

    const state = {
      associates,
      skills,
      associateSkills,
      workstations,
      productionLines,
      shifts,
      allocations,
      leaveRecords,
      auditLogs
    };

    const chunks = chunkifyState(state);

    // 2. Fetch existing database chunks to diff
    const existingChunks = await RagChunk.findAll();
    const existingMap = new Map<string, { hash: string; id: number }>();
    existingChunks.forEach((c: any) => {
      existingMap.set(`${c.entityType}:${c.entityId}`, { hash: getHash(c.content), id: c.id });
    });

    const activeKeys = new Set<string>();

    for (const chunk of chunks) {
      const key = `${chunk.entityType}:${chunk.entityId}`;
      activeKeys.add(key);

      const existing = existingMap.get(key);
      const currentHash = getHash(chunk.content);

      if (!existing) {
        // Embed and create
        const embedding = await embedText(chunk.content);
        await RagChunk.create({
          entityType: chunk.entityType,
          entityId: chunk.entityId,
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: `[${embedding.join(',')}]` as any
        });
      } else if (existing.hash !== currentHash) {
        // Embed and update
        const embedding = await embedText(chunk.content);
        await RagChunk.update({
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: `[${embedding.join(',')}]` as any
        }, { where: { id: existing.id } });
      }
    }

    // Clean up stale chunks
    for (const [key, val] of existingMap.entries()) {
      if (!activeKeys.has(key)) {
        await RagChunk.destroy({ where: { id: val.id } });
      }
    }

    lastRefreshAt = new Date().toISOString();
    lastRefreshError = null;
    const finalCount = await RagChunk.count();
    console.log(`[RAG] Embeddings refreshed successfully. ${chunks.length} chunks processed. Total database chunks: ${finalCount}`);
    return { success: true, chunksIndexed: chunks.length };

  } catch (error: any) {
    const errorMsg = error.message || String(error);
    lastRefreshAt = new Date().toISOString();
    lastRefreshError = errorMsg;
    console.error('[RAG] Error refreshing RAG embeddings:', error);
    return { success: false, chunksIndexed: 0, error: errorMsg };
  }
}

export async function retrieve(query: string, k = 8, filters?: { lineId?: string; dateFrom?: string; dateTo?: string }) {
  const queryVec = await embedText(query);
  
  // Custom Raw SQL because vector cosine ops aren't natively mapped to sequelize model operators easily
  let filterSql = '';
  const replacements: any = { queryVec: JSON.stringify(queryVec), k };

  if (filters?.lineId && filters.lineId !== 'ALL') {
    filterSql += ` AND (metadata->>'lineId' = :lineId OR metadata->>'lineId' IS NULL)`;
    replacements.lineId = filters.lineId;
  }
  if (filters?.dateFrom) {
    filterSql += ` AND (metadata->>'date' >= :dateFrom OR metadata->>'date' IS NULL)`;
    replacements.dateFrom = filters.dateFrom;
  }
  if (filters?.dateTo) {
    filterSql += ` AND (metadata->>'date' <= :dateTo OR metadata->>'date' IS NULL)`;
    replacements.dateTo = filters.dateTo;
  }

  const results: any[] = await sequelize.query(`
    SELECT id, entity_type as "entityType", entity_id as "entityId", content, metadata,
           (embedding <=> CAST(:queryVec AS vector)) as distance
    FROM rag_chunks
    WHERE 1=1 ${filterSql}
    ORDER BY embedding <=> CAST(:queryVec AS vector) ASC
    LIMIT :k
  `, {
    replacements,
    type: 'SELECT'
  });

  return results.map(r => ({
    ...r,
    score: 1 - r.distance
  }));
}

export async function generateAnswer(
  query: string, 
  chunks: any[], 
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const context = chunks.map(c => `[${c.entityType} | ${c.entityId}]: ${c.content}`).join('\n');

  if (USE_LOCAL_LLM) {
    try {
      let historyPrompt = '';
      if (conversationHistory && conversationHistory.length > 0) {
        const last3 = conversationHistory.slice(-3);
        historyPrompt = 'Conversation History:\n' + last3.map(turn => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.content}`).join('\n') + '\n\n';
      }

      const prompt = `You are PlantOps AI. Answer the question using ONLY the context below. 
If the context doesn't contain the answer, say so — do not guess. 
Cite specific entity IDs/names from the context in your answer.

Context:
${context}

${historyPrompt}Question: ${query}`;

      const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
        model: 'llama3.2:3b', // fallback is phi3:mini
        prompt,
        stream: false
      }, { timeout: 15000 });

      const generatedAnswer = response.data.response;

      // Grounding Check
      let isGrounded = true;
      const potentialIds = generatedAnswer.match(/[A-Z0-9_-]{3,}/g) || [];
      const contextLower = context.toLowerCase();
      
      for (const id of potentialIds) {
        if (['RAG', 'LLM', 'AI', 'NOT', 'AND', 'ONLY', 'THE', 'YOU', 'ARE', 'FOR'].includes(id.toUpperCase())) {
          continue;
        }
        if (/^\d+$/.test(id)) {
          continue;
        }
        
        if (!contextLower.includes(id.toLowerCase())) {
          console.warn(`[RAG Grounding] Grounding check failed. Model generated ungrounded entity ID/name: "${id}"`);
          isGrounded = false;
          break;
        }
      }

      if (isGrounded) {
        return generatedAnswer;
      } else {
        console.warn('[RAG Grounding] Discarding Ollama answer due to grounding check failure, falling back to extractive summary.');
      }
    } catch (err) {
      console.warn('Ollama local generation failed, falling back to extractive RAG:', err);
    }
  }

  // Extractive RAG Fallback fallback
  if (chunks.length === 0) return "I don't have data to answer that.";

  const q = query.toLowerCase();
  const isLogQuery = q.includes('log') || q.includes('audit') || q.includes('history') || q.includes('change');
  const relevantChunks = isLogQuery ? chunks : chunks.filter(c => c.entityType !== 'audit_log');

  if (relevantChunks.length === 0) {
    return "I couldn't find any relevant active records matching your query in the database.";
  }

  // 1. Check if the query is certification/skills related
  if (q.match(/expir|certif|renew|lapse|overdue|skill|qualification/)) {
    const certChunks = relevantChunks.filter(c => c.entityType === 'certification');
    if (certChunks.length > 0) {
      let result = `### 🔴 Expired & Expiring Certifications\n\n`;
      result += `Here is the current status of operator certifications and skills requiring attention:\n\n`;
      result += `| Operator Name | Certified Skill | Competency | Expiry Date | Status |\n`;
      result += `| :--- | :--- | :--- | :--- | :--- |\n`;

      const today = new Date();
      
      certChunks.forEach(c => {
        const nameMatch = c.content.match(/Associate\s+([^(]+)\s+\(ID:\s*([^)]+)\)/);
        const skillMatch = c.content.match(/certification for skill\s+([^(]+)\s+\(ID:\s*([^)]+)\)/);
        const levelMatch = c.content.match(/competency level\s+([^.]+)\./);
        const expiryMatch = c.content.match(/expiring on\s+([^.]+)\./);

        const assocName = nameMatch ? nameMatch[1].trim() : 'Unknown';
        const assocId = nameMatch ? nameMatch[2].trim() : 'N/A';
        const skillName = skillMatch ? skillMatch[1].trim() : 'Unknown';
        const level = levelMatch ? levelMatch[1].trim() : 'Operator';
        const expiryStr = expiryMatch ? expiryMatch[1].trim() : '';

        let status = '🟢 Valid';
        if (expiryStr) {
          const expDate = new Date(expiryStr);
          if (expDate < today) {
            status = '🔴 Expired';
          } else {
            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 30) {
              status = `🟡 Expiring in ${diffDays} days`;
            }
          }
        }

        result += `| **${assocName}** (ID: ${assocId}) | ${skillName} | ${level} | ${expiryStr || 'N/A'} | ${status} |\n`;
      });

      return result;
    }
  }

  // 2. Check if the query is leave/absence related
  if (q.match(/leave|absent|off|holiday|attendance|away/)) {
    const leaveChunks = relevantChunks.filter(c => c.entityType === 'leave');
    if (leaveChunks.length > 0) {
      let result = `### 📋 Operator Leaves & Absences\n\n`;
      result += `The following associates are scheduled to be away or on leave:\n\n`;
      result += `| Associate Name | Date | Reason Code | Status |\n`;
      result += `| :--- | :--- | :--- | :--- |\n`;

      leaveChunks.forEach(c => {
        const nameMatch = c.content.match(/Associate\s+([^(]+)\s+\(ID:\s*([^)]+)\)/);
        const dateMatch = c.content.match(/date\s+([^.]+)\./);
        const reasonMatch = c.content.match(/Reason code:\s*([^.]+)\./);
        const statusMatch = c.content.match(/Status:\s*([^.]+)\./);

        const assocName = nameMatch ? nameMatch[1].trim() : 'Unknown';
        const assocId = nameMatch ? nameMatch[2].trim() : 'N/A';
        const date = dateMatch ? dateMatch[1].trim() : 'N/A';
        const reason = reasonMatch ? reasonMatch[1].trim() : 'Not Specified';
        const status = statusMatch ? statusMatch[1].trim() : 'Approved';

        result += `| **${assocName}** (ID: ${assocId}) | ${date} | ${reason} | ${status} |\n`;
      });

      return result;
    }
  }

  // 3. Check if the query is allocation/staffing related
  if (q.match(/allocat|staff|assign|workstation|coverage/)) {
    const allocChunks = relevantChunks.filter(c => c.entityType === 'allocation');
    if (allocChunks.length > 0) {
      let result = `### 🛠️ Workstation Allocations\n\n`;
      result += `Here are the active workstation deployments and staffing roster allocations:\n\n`;
      result += `| Operator | Workstation | Production Line | Shift | Date |\n`;
      result += `| :--- | :--- | :--- | :--- | :--- |\n`;

      allocChunks.forEach(c => {
        const nameMatch = c.content.match(/Associate\s+([^(]+)\s+\(ID:\s*([^)]+)\)/);
        const wsMatch = c.content.match(/workstation\s+"([^"]+)"/);
        const lineMatch = c.content.match(/line\s+"([^"]+)"/);
        const shiftMatch = c.content.match(/shift\s+(\w+)/);
        const dateMatch = c.content.match(/date\s+([^.]+)\./);

        const assocName = nameMatch ? nameMatch[1].trim() : 'Unknown';
        const assocId = nameMatch ? nameMatch[2].trim() : 'N/A';
        const wsName = wsMatch ? wsMatch[1].trim() : 'Unknown';
        const lineName = lineMatch ? lineMatch[1].trim() : 'Unknown';
        const shift = shiftMatch ? shiftMatch[1].trim() : 'Day';
        const date = dateMatch ? dateMatch[1].trim() : 'N/A';

        result += `| **${assocName}** (ID: ${assocId}) | ${wsName} | ${lineName} | ${shift} | ${date} |\n`;
      });

      return result;
    }
  }

  // Fallback beautiful listing grouping by entity type
  let answer = `### 🔍 Live Database Records Found\n\n`;
  answer += `I found the following matching records in the PlantOps system:\n\n`;

  const grouped = relevantChunks.reduce((acc, c) => {
    if (!acc[c.entityType]) acc[c.entityType] = [];
    acc[c.entityType].push(c);
    return acc;
  }, {} as Record<string, any[]>);

  for (const type of Object.keys(grouped)) {
    const items = grouped[type];
    const formattedType = type.replace('_', ' ').toUpperCase();
    answer += `#### 📁 ${formattedType} RECORDS:\n`;
    items.slice(0, 4).forEach((item: any) => {
      const cleanContent = item.content.replace(/^Leave record \w+:\s*/i, '')
                                       .replace(/^Allocation record \w+:\s*/i, '')
                                       .replace(/^Audit log entry \w+:\s*/i, '');
      answer += `- ${cleanContent}\n`;
    });
    if (items.length > 4) {
      answer += `- *And ${items.length - 4} other similar record(s).*\n`;
    }
    answer += `\n`;
  }

  return answer.trim();
}

export function suggestChart(query: string, chunks: any[]): any {
  const q = query.toLowerCase();

  // 1. Certification / Skill Questions
  if (q.match(/expir|certif|renewal|laps|overdue|skill.gap|missing.skill/)) {
    // Generate skill bar/pie chart
    const certChunks = chunks.filter(c => c.entityType === 'certification');
    const skillCounts: Record<string, { valid: number; expired: number }> = {};

    certChunks.forEach(c => {
      const skillId = c.metadata?.skillId || 'Other';
      if (!skillCounts[skillId]) skillCounts[skillId] = { valid: 0, expired: 0 };
      const isExpired = c.content.toLowerCase().includes('expired: yes') || new Date(c.metadata?.expiryDate) < new Date();
      if (isExpired) {
        skillCounts[skillId].expired++;
      } else {
        skillCounts[skillId].valid++;
      }
    });

    const data = Object.entries(skillCounts).map(([name, counts]) => ({
      name,
      Valid: counts.valid,
      Expired: counts.expired
    }));

    if (data.length > 0) {
      return {
        type: 'bar',
        title: 'Certification Expiry Status by Skill',
        data,
        xKey: 'name',
        bars: [{ key: 'Valid', color: '#14b8a6' }, { key: 'Expired', color: '#f43f5e' }],
        stacked: true
      };
    }
  }

  // 2. Allocation / Staffing
  if (q.match(/allocat|staff|assign|roster|deployed|workstation|filled|coverage/)) {
    const allocChunks = chunks.filter(c => c.entityType === 'allocation');
    const lineCounts: Record<string, number> = {};

    allocChunks.forEach(c => {
      const lineId = c.metadata?.lineId || 'Other';
      lineCounts[lineId] = (lineCounts[lineId] || 0) + 1;
    });

    const data = Object.entries(lineCounts).map(([name, Deployments]) => ({
      name,
      Deployments
    }));

    if (data.length > 0) {
      return {
        type: 'bar',
        title: 'Assignments Count by Line',
        data,
        xKey: 'name',
        bars: [{ key: 'Deployments', color: '#14b8a6' }],
        stacked: false
      };
    }
  }

  // 3. Headcount / Leave / Attendance
  if (q.match(/leave|absent|off.day|holiday|sick|availab/)) {
    const leaveChunks = chunks.filter(c => c.entityType === 'leave');
    const dateCounts: Record<string, number> = {};

    leaveChunks.forEach(c => {
      const date = c.metadata?.date || 'Other';
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const data = Object.entries(dateCounts).map(([name, count]) => ({
      name,
      'On Leave': count
    })).sort((a, b) => a.name.localeCompare(b.name));

    if (data.length > 0) {
      return {
        type: 'bar',
        title: 'Absenteeism/Leave Volume Over Time',
        data,
        xKey: 'name',
        bars: [{ key: 'On Leave', color: '#f59e0b' }],
        stacked: false
      };
    }
  }

  if (!chunks || chunks.length === 0) return null;

  // Find dominant entity type
  const counts: Record<string, number> = {};
  chunks.forEach(c => {
    counts[c.entityType] = (counts[c.entityType] || 0) + 1;
  });

  let dominantType = '';
  let maxCount = 0;
  for (const [type, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantType = type;
    }
  }

  const filteredChunks = chunks.filter(c => c.entityType === dominantType);
  const keys = new Set<string>();
  filteredChunks.forEach(c => {
    if (c.metadata) {
      Object.keys(c.metadata).forEach(k => keys.add(k));
    }
  });

  let chartableField = '';
  if (keys.has('date')) chartableField = 'date';
  else if (keys.has('expiryDate')) chartableField = 'expiryDate';
  else if (keys.has('level')) chartableField = 'level';
  else if (keys.has('status')) chartableField = 'status';

  if (chartableField) {
    const bucketCounts: Record<string, number> = {};
    filteredChunks.forEach(c => {
      const val = c.metadata?.[chartableField] || 'Unknown';
      bucketCounts[val] = (bucketCounts[val] || 0) + 1;
    });

    const data = Object.entries(bucketCounts).map(([name, count]) => ({
      name,
      Count: count
    })).sort((a, b) => a.name.localeCompare(b.name));

    return {
      type: 'bar',
      title: `${dominantType.toUpperCase().replace('_', ' ')} breakdown by ${chartableField}`,
      data,
      xKey: 'name',
      bars: [{ key: 'Count', color: '#14b8a6' }],
      stacked: false
    };
  }

  return null;
}
