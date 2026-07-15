import { sequelize } from './config/dbConn';
import User from '../database/models/models/user';

async function test() {
    try {
        console.log("Syncing User model...");
        await User.sync({ force: true, logging: console.log });
        console.log("User model synced.");
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
test();
