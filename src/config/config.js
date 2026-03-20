import dotenv from "dotenv";

dotenv.config();
if(!process.env.MONGO_URI){
    throw new Error ("MONGO_URI IS NOT SET IN ENV");
}
if(!process.env.JWT_SECRET){
    throw new Error ("JWT SECRET IS NOT SET IN ENV");
}
if(!process.env.GOOGLE_CLIENT_ID){
    console.warn("GOOGLE_CLIENT_ID is not set");
}
if(!process.env.GOOGLE_CLIENT_SECRET){
    console.warn("GOOGLE_CLIENT_SECRET is not set");
}
if(!process.env.GOOGLE_REFRESH_TOKEN){
    console.warn("GOOGLE_REFRESH_TOKEN is not set");
}
if(!process.env.GOOGLE_USER){
    throw new Error ("GOOGLE_USER IS NOT SET IN ENV");
}
if(!process.env.GOOGLE_APP_PASSWORD && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN)){
    throw new Error("Set GOOGLE_APP_PASSWORD or full OAuth2 credentials for email sending");
}


const config={
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER: process.env.GOOGLE_USER,
    GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD
}

export default config;
