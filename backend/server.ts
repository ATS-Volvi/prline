import express, { ErrorRequestHandler } from 'express'
import Database from './config/dbConn'
import cors from 'cors'
import logger from './utils/logger'


import NotFoundError from './utils/errors/404notFound'
import AuthRouter from './src/api/v1/auth/routes'
import v1Router from './src/api/v1/routes'
import { createError } from './utils/errors/createError'
class Server{
    public app=express()
    public port?:Number

    constructor() {
        this.config()
        this.router()
      }

      private async connectToDb() {
        return await Database.createConnection()
      }

      public async config(){
        this.app.set('trust proxy', true)
        this.app.set('case sensitive routing', true)
        const corsOptions = {
          origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            const allowed = [
              process.env.FRONTEND_URL,
              'http://localhost:5173',
              'http://localhost:5174',
              'http://localhost:5175',
              'http://localhost:3000',
            ].filter(Boolean) as string[];

            // Allow Vercel preview deployments (*.vercel.app)
            if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
              callback(null, true);
            } else {
              callback(new Error(`CORS blocked: ${origin}`));
            }
          },
          credentials: true,
          methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
          allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Client-Type']
        };

        this.app.use(cors(corsOptions));
          this.app.use(express.json({ limit: '50mb' }))
          this.app.use(express.urlencoded({ limit: '50mb' }))
      
          
          
      }

      public async router(){
        
        this.app.use("/api/v1/auth",AuthRouter)
        this.app.use("/api/v1", v1Router)
        this.app.all('*', async (request, response, next) => {
          logger?.info(request.url)
          return next(createError({status:404,message:"Not Found!"}))
        })

        const errorMiddleware:ErrorRequestHandler=(
          err:any,
          request:express.Request,
          response:express.Response,
          next:express.NextFunction
        )=>{
          const errorStatus=err.status || 500;
          const errorMessage=err.message || "something went wrong";
          console.log(err);
          
          response.status(errorStatus).json({
            status:errorStatus,
            message:errorMessage,
            stack:err.stack,
            success:false
          })
        }
        this.app.use(errorMiddleware)
      }

      public async start(port:number){
        await this.connectToDb()

        try {
          const { Associate, RagChunk, ProductionAssumptions, MonthlySeasonality, ManpowerNorm, CoverageBuffers, DailyProductionActual } = await import('../database/models/models/models');
          const { seedDatabase } = await import('../database/models/seed');
          const { sequelize } = await import('../database/config/dbConn');
          await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
          await sequelize.sync({ alter: true });
          const count = await (Associate as any).count();
          if (count === 0) {
            console.log("No associates found. Seeding database...");
            await seedDatabase();
          } else {
            console.log(`Database already initialized with ${count} associates.`);
          }
        } catch (err) {
          console.log("Database tables not found or uninitialized. Seeding...");
          try {
            const { seedDatabase } = await import('../database/models/seed');
            await seedDatabase();
          } catch (seedErr) {
            console.error("Failed to seed database on startup:", seedErr);
          }
        }

        // Initialize RAG embedding model pre-flight
        try {
          const { initializeModel } = await import('./src/services/ragService');
          await initializeModel();
        } catch (ragErr) {
          console.error("Failed to initialize RAG model on startup:", ragErr);
        }

        this.port = port
        this.app.listen(this.port, () => {
          console.log(`Listening on ${this.port}`)
        })
      }
}

export default Server


