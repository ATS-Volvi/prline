import { Sequelize } from "sequelize"
import { variables } from "./envLoader"

export const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize(variables.DB_NAME, variables.DB_USERNAME, variables.DB_PASSWORD, {
      host: "localhost",
      dialect: "postgres",
      logging: false
    });

class Database{
    
    static async createConnection(){
        

        try {
            await sequelize.authenticate()
            console.log("DB connection established");
            
        } catch (error) {
            console.log("unable to connect to DB : ",error);
            
        }
    }
}

export default Database