import { sequelize } from './config/dbConn';

async function check() {
    try {
        console.log("Dropping schema public...");
        await sequelize.query('DROP SCHEMA public CASCADE;');
        console.log("Creating schema public...");
        await sequelize.query('CREATE SCHEMA public;');
        console.log("Creating vector extension...");
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
        
        console.log("Getting tables...");
        const res = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("TABLES AFTER DROP:", res[0]);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
check();
