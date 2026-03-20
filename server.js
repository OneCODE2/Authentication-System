import app from "./src/app.js";
import connectDB from "./src/config/database.js";

const API_PORT = Number(process.env.API_PORT || 5000);

async function startServer() {
    try {
        await connectDB();
        app.listen(API_PORT, () => {
            console.log(`API Server Running on port ${API_PORT}`);
        });
    } catch (error) {
        console.error("API startup failed:", error?.message || error);
        process.exit(1);
    }
}

startServer();
