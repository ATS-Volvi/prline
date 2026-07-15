import { sequelize } from './config/dbConn';

async function check() {
    try {
        const res = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("TABLES RAW:", res[0]);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
check();
