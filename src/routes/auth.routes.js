import { Router } from "express";
import * as authController from "../controllers/auth.controller.js"

const authRouter = Router();
/*
Post /api/auth/register
*/
authRouter.post("/register",authController.register)

/*
GET  /api/auth/get-me
*/
authRouter.get("/get-me", authController.getMe);


/*
POST  /api/auth/refresh-token
*/
authRouter.post("/refresh-token", authController.refreshToken);

/*
POST  /api/auth/login
*/
authRouter.post("/login", authController.login);

/*
POST  /api/auth/logout
*/
authRouter.post("/logout", authController.logout);

/*
POST  /api/auth/logoutAll
*/
authRouter.post("/logout-all", authController.logoutAll);

// POST  /api/auth/verify-email
authRouter.post("/verify-email", authController.verifyEmail); 
// GET /api/auth/sessions
authRouter.get("/sessions", authController.getSessions);
// POST /api/auth/revoke-session
authRouter.post("/revoke-session", authController.revokeSession);
export default authRouter;
