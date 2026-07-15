import buffer from 'buffer';
if (!(buffer as any).SlowBuffer) {
  (buffer as any).SlowBuffer = buffer.Buffer;
}

import { variables } from "./config/envLoader";
import Server from "./server";

let server: Server | null = null;

const start=async ()=>{
    try {
        const { PORT } = variables;
        server = new Server();
        await server.start(Number(PORT));
      } catch (error) {
        console.error(error);
        process.exit(1);
      }
}
start();

const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    if (server) {
        try {
            await server.shutdown();
        } catch (e) {
            console.error("Error closing server during shutdown:", e);
        }
    }
    process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  
  process.on("uncaughtException", (err) => {
    console.error(err);
    console.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
  });
  