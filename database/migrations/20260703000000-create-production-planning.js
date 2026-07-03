module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS production_assumptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        fy_label VARCHAR(20),
        fy_start_date DATE,
        num_lines INT,
        rated_capacity_kg_hr NUMERIC,
        hours_per_shift NUMERIC,
        shifts_per_day INT,
        working_days_per_month NUMERIC,
        planned_downtime_pct NUMERIC,
        rejection_pct NUMERIC,
        annual_target_mt NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS monthly_seasonality (
        id SERIAL PRIMARY KEY,
        assumptions_id INT REFERENCES production_assumptions(id) ON DELETE CASCADE,
        month VARCHAR(3) NOT NULL,
        index_value NUMERIC NOT NULL,
        note VARCHAR(255)
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS manpower_norms (
        id SERIAL PRIMARY KEY,
        assumptions_id INT REFERENCES production_assumptions(id) ON DELETE CASCADE,
        role VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        scope VARCHAR(20) NOT NULL,
        count_per_unit NUMERIC NOT NULL,
        notes VARCHAR(255)
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS coverage_buffers (
        id SERIAL PRIMARY KEY,
        assumptions_id INT REFERENCES production_assumptions(id) ON DELETE CASCADE,
        working_days_per_associate_per_week NUMERIC DEFAULT 6,
        off_factor_adj NUMERIC,
        absentee_buffer_pct NUMERIC
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS daily_production_actual (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        production_date DATE NOT NULL,
        line_id VARCHAR(100),
        shift VARCHAR(10),
        actual_output_mt NUMERIC NOT NULL,
        entered_by VARCHAR(100),
        notes VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, production_date, line_id, shift)
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS daily_production_actual;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS coverage_buffers;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS manpower_norms;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS monthly_seasonality;');
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS production_assumptions;');
  }
};
