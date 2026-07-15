import { sequelize } from './config/dbConn';
import { seedDatabase } from '../database/models/seed';

async function run() {
    try {
        console.log("Terminating other connections to database...");
        await sequelize.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = current_database()
              AND pid <> pg_backend_pid();
        `);
        console.log("Other connections terminated.");

        console.log("Starting DB seeding...");
        await seedDatabase();
        console.log("DB seeding finished successfully.");
    } catch (e) {
        console.error("Error during clean seed:", e);
    } finally {
        await sequelize.close();
    }
}
run();
