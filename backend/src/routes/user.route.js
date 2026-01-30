import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";   
import { getMyFriends,
     getRecommendedUsers,
     sendFriendRequest,
     acceptFriendRequest,
    getOutgoingFriendReqs,
getFriendRequests,
updateProfile } from "../controllers/user.controller.js";

const router = express.Router();


router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

router.put("/profile", updateProfile);


export default router;