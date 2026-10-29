module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS scan_events (
        id VARCHAR(100) PRIMARY KEY,
        user_id VARCHAR(100),
        carton_id VARCHAR(100) NOT NULL,
        line_id VARCHAR(50) NOT NULL,
        shift_id VARCHAR(50),
        source_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        scan_result VARCHAR(30) NOT NULL,
        status VARCHAR(30) DEFAULT 'PROCESSED',
        scanner_id VARCHAR(50),
        station_id VARCHAR(50),
        sku VARCHAR(100),
        batch_number VARCHAR(100),
        position_meters NUMERIC,
        is_simulated BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_scan_events_line_source ON scan_events(line_id, source_timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_scan_events_carton_source ON scan_events(carton_id, source_timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_scan_events_simulated ON scan_events(is_simulated);
      CREATE INDEX IF NOT EXISTS idx_scan_events_created ON scan_events(created_at DESC);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP TABLE IF EXISTS scan_events CASCADE;`);
  }
};
