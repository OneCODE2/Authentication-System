import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';


const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());


app.use("/api/auth", authRouter);
app.use((err, req, res, next) => {
    console.error("Unhandled API error:", err?.message || err);
    res.status(500).json({
        message: "Internal server error"
    });
});

export default app;
