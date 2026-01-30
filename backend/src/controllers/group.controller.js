import Group from "../models/Group.js";
import User from "../models/User.js";
import { streamClient } from "../lib/stream.js";

// Create a new group
export const createGroup = async (req, res) => {
  try {
    console.log("Create group request received");
    console.log("Request body:", req.body);
    console.log("User from auth:", req.user);

    const { name, description, memberIds, groupImage } = req.body;
    const adminId = req.user._id || req.user.id;

    console.log("Admin ID:", adminId);
    console.log("Member IDs:", memberIds);

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: "Group name and members are required" });
    }

    // Ensure admin is included in members
    const allMembers = [...new Set([adminId.toString(), ...memberIds])];
    console.log("All members:", allMembers);

    // Create group in database first to get the ID
    const group = await Group.create({
      name,
      description,
      admin: adminId,
      members: allMembers,
      streamChannelId: "", // Will be set to group._id after creation
      groupImage: groupImage || "", // Add group image
    });

    console.log("Group created:", group);

    // Update with proper channel ID (using group's own _id)
    group.streamChannelId = `group-${group._id}`;
    await group.save();

    console.log("Channel ID set to:", group.streamChannelId);

    // Sync with Stream Chat: Create channel immediately
    try {
      const channel = streamClient.channel("messaging", group.streamChannelId, {
        name: name,
        created_by_id: adminId.toString(),
        members: allMembers,
      });
      await channel.create();
      console.log("Stream Chat channel created successfully");
    } catch (streamError) {
      console.error("Error creating Stream Chat channel:", streamError);
      // We don't fail the request, but log it. Admin might need to sync later.
    }

    // Populate group data
    await group.populate("admin", "fullName profilePic");
    await group.populate("members", "fullName profilePic");

    console.log("Group populated:", group);

    const responseData = {
      _id: group._id,
      name: group.name,
      description: group.description,
      groupImage: group.groupImage,
      admin: group.admin,
      members: group.members,
      streamChannelId: group.streamChannelId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    console.log("Sending response:", responseData);
    res.status(201).json(responseData);
    console.log("Response sent successfully");
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all groups for current user
export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    console.log("Getting groups for user:", userId);
    console.log("User object:", req.user);

    const groups = await Group.find({ members: userId })
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic")
      .sort({ updatedAt: -1 });

    console.log(`Found ${groups.length} groups for user ${userId}`);
    console.log("Groups:", groups.map(g => ({
      id: g._id,
      name: g.name,
      members: g.members.map(m => m._id)
    })));

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error getting groups:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get single group details
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.user._id || req.user.id);

    console.log("Fetching group by ID:", groupId);
    console.log("Requested by user:", userId);

    const group = await Group.findById(groupId)
      .populate("admin", "fullName profilePic")
      .populate("members", "fullName profilePic");

    if (!group) {
      console.log("Group not found:", groupId);
      return res.status(404).json({ message: "Group not found" });
    }

    // Debug: print all member IDs and admin ID
    const memberIds = group.members.map(member => String(member._id));
    const adminId = String(group.admin._id);
    console.log("All group member IDs:", memberIds);
    console.log("Group admin ID:", adminId);
    console.log("Requesting user ID:", userId);

    // Check if user is a member of the group
    const isMember = memberIds.includes(userId);
    const isAdmin = adminId === userId;

    if (!isMember && !isAdmin) {
      console.log("User is not a member of this group:", { userId, groupId });
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    console.log("Group found:", { id: group._id, name: group.name, members: memberIds });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error getting group:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Add members to group
export const addMembersToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = String(req.user._id || req.user.id);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (String(group.admin) !== userId) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Add new members
    const newMembers = memberIds.filter(
      (memberId) => !group.members.includes(memberId)
    );

    if (newMembers.length === 0) {
      return res.status(400).json({ message: "All users are already members" });
    }

    group.members.push(...newMembers);
    await group.save();

    // Sync with Stream Chat: Add members
    try {
      const channel = streamClient.channel("messaging", `group-${group._id}`);
      await channel.addMembers(newMembers);
      console.log("Added members to Stream Chat channel");
    } catch (streamError) {
      console.error("Error adding members to Stream Chat:", streamError);
    }

    await group.populate("admin", "fullName profilePic");
    await group.populate("members", "fullName profilePic");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove member from group
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = String(req.user._id || req.user.id);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (String(group.admin) !== userId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // Can't remove admin
    if (String(memberId) === String(group.admin)) {
      return res.status(400).json({ message: "Cannot remove group admin" });
    }

    // Remove member
    group.members = group.members.filter(
      (member) => member.toString() !== memberId
    );
    await group.save();

    // Sync with Stream Chat: Remove member
    try {
      const channel = streamClient.channel("messaging", `group-${group._id}`);
      await channel.removeMembers([memberId]);
      console.log("Removed member from Stream Chat channel");
    } catch (streamError) {
      console.error("Error removing member from Stream Chat:", streamError);
    }

    await group.populate("admin", "fullName profilePic");
    await group.populate("members", "fullName profilePic");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.user._id || req.user.id);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Admin can't leave, must transfer ownership first or delete group
    if (String(group.admin) === userId) {
      return res.status(400).json({
        message: "Admin cannot leave group. Transfer ownership or delete the group."
      });
    }

    // Remove user from members
    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );
    await group.save();

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.user._id || req.user.id);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (String(group.admin) !== userId) {
      return res.status(403).json({ message: "Only admin can delete group" });
    }

    // Delete group from database
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update group picture
export const updateGroupPicture = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { groupImage } = req.body;
    const userId = String(req.user._id || req.user.id);

    if (!groupImage) {
      return res.status(400).json({ message: "Group image is required" });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (String(group.admin) !== userId) {
      return res.status(403).json({ message: "Only admin can update group picture" });
    }

    // Update group picture
    group.groupImage = groupImage;
    await group.save();

    await group.populate("admin", "fullName profilePic");
    await group.populate("members", "fullName profilePic");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error updating group picture:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Toggle admin-only messaging mode
export const toggleAdminOnlyMessaging = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = String(req.user._id || req.user.id);

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is admin
    if (String(group.admin) !== userId) {
      return res.status(403).json({ message: "Only admin can change messaging settings" });
    }

    // Toggle the setting
    group.adminOnlyMessaging = !group.adminOnlyMessaging;
    await group.save();

    await group.populate("admin", "fullName profilePic");
    await group.populate("members", "fullName profilePic");

    res.status(200).json(group);
  } catch (error) {
    console.error("Error toggling admin-only messaging:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

