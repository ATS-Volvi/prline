module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS rag_chunks (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB,
        embedding vector(384),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx ON rag_chunks
      USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS rag_chunks_embedding_idx;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS rag_chunks;');
  }
};
