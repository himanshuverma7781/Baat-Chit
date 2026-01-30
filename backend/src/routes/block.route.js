import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkIfBlocked,
} from "../controllers/block.controller.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

router.post("/:userId", blockUser);
router.delete("/:userId", unblockUser);
router.get("/", getBlockedUsers);
router.get("/check/:userId", checkIfBlocked);

export default router;
