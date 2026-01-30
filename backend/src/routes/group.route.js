import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getUserGroups,
  getGroupById,
  addMembersToGroup,
  removeMemberFromGroup,
  leaveGroup,
  deleteGroup,
  updateGroupPicture,
  toggleAdminOnlyMessaging,
} from "../controllers/group.controller.js";

const router = express.Router();

// Test route to verify router is working
router.get("/test", (req, res) => {
  res.json({ message: "Group routes are working!" });
});

router.post("/create", protectRoute, createGroup);
router.get("/", protectRoute, getUserGroups);
router.get("/:groupId", protectRoute, getGroupById);
router.post("/:groupId/add-members", protectRoute, addMembersToGroup);
router.delete("/:groupId/remove/:memberId", protectRoute, removeMemberFromGroup);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.delete("/:groupId", protectRoute, deleteGroup);
router.put("/:groupId/picture", protectRoute, updateGroupPicture);
router.put("/:groupId/admin-only-messaging", protectRoute, toggleAdminOnlyMessaging);

export default router;
