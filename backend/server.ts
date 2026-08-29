import express, { ErrorRequestHandler } from 'express'
import Database from './config/dbConn'
import cors from 'cors'
import logger from './utils/logger'
import path from 'path'
import fs from 'fs'

import NotFoundError from './utils/errors/404notFound'
import AuthRouter from './src/api/v1/auth/routes'
import v1Router from './src/api/v1/routes'
import { createError } from './utils/errors/createError'

class Server {
    public app = express()
    public port: number = 5505
    public httpServer?: import('http').Server

    constructor() {
        this.config()
        this.router()
    }

    private async connectToDb() {
        return await Database.createConnection()
    }

    public async config() {
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

                // Allow Render (*.onrender.com) and Vercel (*.vercel.app) deployments
                if (!origin || allowed.includes(origin) || origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app')) {
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
        this.app.use(express.urlencoded({ limit: '50mb', extended: true }))
    }

    public async router() {
        // Health check routes for deployment monitoring (Render, AWS, etc.)
        this.app.get('/health', (_req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        this.app.get('/api/health', (_req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });

        this.app.use("/api/v1/auth", AuthRouter)
        this.app.use("/api/v1", v1Router)

        // Serve Frontend Static Build if available (for unified Fullstack deployment on Render)
        const frontendDistCandidates = [
            path.resolve(process.cwd(), '../frontend/dist'),
            path.resolve(__dirname, '../../../frontend/dist'),
            path.resolve(__dirname, '../../frontend/dist'),
            path.resolve(__dirname, '../frontend/dist'),
            path.resolve(process.cwd(), 'frontend/dist'),
            path.resolve(process.cwd(), 'dist'),
        ];
        const frontendDist = frontendDistCandidates.find(dir => fs.existsSync(dir));

        if (frontendDist) {
            console.log(`[Static Files] Serving frontend from: ${frontendDist}`);
            this.app.use(express.static(frontendDist));
            this.app.get('*', (request, response, next) => {
                if (request.path.startsWith('/api')) {
                    return next(createError({ status: 404, message: "API Endpoint Not Found!" }));
                }
                response.sendFile(path.join(frontendDist, 'index.html'));
            });
        } else {
            console.warn('[Static Files] No frontend dist directory found in candidates:', frontendDistCandidates);
            this.app.all('*', async (request, response, next) => {
                logger?.info(request.url)
                return next(createError({ status: 404, message: "Not Found!" }))
            })
        }

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

      public async start(port: number) {
        this.port = port;
        this.httpServer = this.app.listen(this.port, '0.0.0.0', () => {
          console.log(`Server successfully listening on 0.0.0.0:${this.port}`);
        });

        this.httpServer.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.error(`Port ${this.port} is already in use.`);
            process.exit(1);
          } else {
            console.error(`HTTP Server encountered an error:`, err);
            process.exit(1);
          }
        });

        // Initialize Database and background services asynchronously
        (async () => {
          try {
            await this.connectToDb();
            const { Associate } = await import('../database/models/models/models');
            const { sequelize } = await import('../database/config/dbConn');
            await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;').catch(() => {});
            const count = await (Associate as any).count().catch(() => 0);
            console.log(`Database verified. Found ${count} associates.`);
          } catch (err: any) {
            console.warn("Database initialization warning (non-fatal):", err?.message || err);
          }

          // Initialize RAG embedding model asynchronously in background
          try {
            const { initializeModel } = await import('./src/services/ragService');
            await initializeModel();
          } catch (ragErr: any) {
            console.warn("RAG model initialization warning (non-fatal):", ragErr?.message || ragErr);
          }
        })();
      }

      public async shutdown(): Promise<void> {
        if (!this.httpServer) return;
        return new Promise<void>((resolve) => {
          this.httpServer!.close(() => {
            console.log("HTTP server closed successfully.");
            resolve();
          });
        });
      }
}

export default Server


