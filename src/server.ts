import app from "./app.js";
import { connectDB } from "./config/database.js";

const connectionResult = await connectDB();

if (!connectionResult.ok) {
    console.error(connectionResult.error.message);
    process.exit(1);
}

app.listen(3000, () => {
    console.log("Server Running on port 3000");
});
