import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getStreamToken, sendAIMessage } from '../controllers/chat.controller.js';
import { chatWithGPT } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute,getStreamToken)
router.post("/chat", chatWithGPT);
router.post("/ai-message", protectRoute, sendAIMessage);


export default router;