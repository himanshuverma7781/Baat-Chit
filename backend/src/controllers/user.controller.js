import  User  from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import { upsertStreamUser } from '../lib/stream.js';


export async function getRecommendedUsers(req, res) {
    try {
        const currentUserId = req.user.id;
        const currentUser = req.user;
      
        const recommendedUsers = await User.find({
         $and:[  { _id: { $ne: currentUserId }}, // Exclude the current user
                 { _id: { $nin: currentUser.friends }}, // Exclude friends of the current user
                 {isOnboarded: true}, // Only include users who are onboarded
         ],
    });
    res.status(200).json(recommendedUsers)
    }
    catch (error) {
        console.error('Error in getRecommendedUsers controller', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export async function getMyFriends(req, res) {
    try {

        const user = await User.findById(req.user.id)
        .select("friends")
        .populate("friends", "fullName profilePic nativeLanguage learningLanguage ");
        res.status(200).json(user.friends);
        
    } catch (error) {
        console.error('Error in getMyFriends controller', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
}


export async function sendFriendRequest(req,res) {
try {
    const myId= req.user.id;
    const { id: recipientId } = req.params;


    if (myId === recipientId) {
        return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }


    const recipient = await User.findById(recipientId);
    if (!recipient) {
        return res.status(404).json({ message: "Recipient not found." });
    }

    // Check if the recipient is already a friend
    if (recipient.friends.includes(myId)) {
        return res.status(400).json({ message: "You are already friends with this user." });
    }
    // Check if a friend request already exists
    const existingRequest = await FriendRequest.findOne({
        $or: [
            { sender: myId, recipient: recipientId },
            { sender: recipientId, recipient: myId }
        ],
    });
    if (existingRequest) {
        return res.status(400).json({ message: "Friend request already exists." });
    }
    
    // Create a new friend request
    const friendRequest = await FriendRequest.create({
        sender: myId,
        recipient: recipientId,
    });
    res.status(201).json({ message: "Friend request sent successfully.", friendRequest });


} catch (error) {
    console.error('Error in sendFriendRequest controller', error.message);
    res.status(500).json({ message: 'Internal server error' });
}
}

export async function acceptFriendRequest(req, res) {
    try {
        const myId = req.user.id;
        const { id: requestId } = req.params;

        // Check if the sender is a valid user
        const friendRequest = await FriendRequest.findById(requestId);
        
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found." });
        }

        if (friendRequest.recipient.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only accept friend requests sent to you." });
        }
        friendRequest.status = 'accepted';
        await friendRequest.save();
       
        // add each user to each other's friends list
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.recipient }
        });
        await User.findByIdAndUpdate(friendRequest.recipient, {
            $addToSet: { friends: friendRequest.sender }
        });
        res.status(200).json({ message: "Friend request accepted successfully." });
    } catch (error) {        
        console.error('Error in acceptFriendRequest controller', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }   
}


export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { fullName, bio, nativeLanguage, learningLanguage, location, profilePic } = req.body;
    const userId = req.user.id;

    console.log("Updating profile for user:", userId);
    console.log("Update data:", { fullName, bio, nativeLanguage, learningLanguage, location, profilePic: profilePic ? "Has image" : "No image" });

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (nativeLanguage !== undefined) updateData.nativeLanguage = nativeLanguage;
    if (learningLanguage !== undefined) updateData.learningLanguage = learningLanguage;
    if (location !== undefined) updateData.location = location;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update Stream user if profile pic or name changed
    if (fullName || profilePic) {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic,
      });
    }

    console.log("Profile updated successfully");
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updateProfile controller:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}