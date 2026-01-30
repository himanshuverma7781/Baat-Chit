import User from "../models/User.js";

// Block a user
export const blockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = String(req.user._id || req.user.id);

        console.log("Block user request:", { currentUserId, targetUserId: userId });

        // Can't block yourself
        if (userId === currentUserId) {
            return res.status(400).json({ message: "You cannot block yourself" });
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already blocked
        const currentUser = await User.findById(currentUserId);
        if (currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({ message: "User is already blocked" });
        }

        // Add to blocked users
        currentUser.blockedUsers.push(userId);
        await currentUser.save();

        console.log("User blocked successfully:", userId);
        res.status(200).json({ message: "User blocked successfully" });
    } catch (error) {
        console.error("Error blocking user:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = String(req.user._id || req.user.id);

        console.log("Unblock user request:", { currentUserId, targetUserId: userId });

        const currentUser = await User.findById(currentUserId);

        // Check if user is actually blocked
        if (!currentUser.blockedUsers.includes(userId)) {
            return res.status(400).json({ message: "User is not blocked" });
        }

        // Remove from blocked users
        currentUser.blockedUsers = currentUser.blockedUsers.filter(
            (blockedId) => blockedId.toString() !== userId
        );
        await currentUser.save();

        console.log("User unblocked successfully:", userId);
        res.status(200).json({ message: "User unblocked successfully" });
    } catch (error) {
        console.error("Error unblocking user:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

// Get list of blocked users
export const getBlockedUsers = async (req, res) => {
    try {
        const currentUserId = String(req.user._id || req.user.id);

        const currentUser = await User.findById(currentUserId)
            .populate("blockedUsers", "fullName profilePic email");

        console.log(`Found ${currentUser.blockedUsers.length} blocked users`);
        res.status(200).json(currentUser.blockedUsers);
    } catch (error) {
        console.error("Error getting blocked users:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Check if a user is blocked (utility endpoint)
export const checkIfBlocked = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = String(req.user._id || req.user.id);

        const currentUser = await User.findById(currentUserId);
        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const isBlockedByMe = currentUser.blockedUsers.includes(userId);
        const isBlockedByTarget = targetUser.blockedUsers.includes(currentUserId);

        res.status(200).json({
            isBlocked: isBlockedByMe,
            isBlockedByTarget: isBlockedByTarget
        });
    } catch (error) {
        console.error("Error checking block status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
