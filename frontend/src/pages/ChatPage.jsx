import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getStreamToken, getGroupById, blockUser, unblockUser, checkIfBlocked } from "../lib/api";
import { axiosInstance } from "../lib/axios";
import { useStreamChatClient } from "../contexts/StreamChatContext";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import toast from "react-hot-toast";
import { Ban, ShieldOff, Shield } from "lucide-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import AIChatHelper from "../components/AIChatHelper";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const isGroup = targetUserId.startsWith("group-");
  const groupId = isGroup ? targetUserId.replace("group-", "") : null;

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGroupChat, setIsGroupChat] = useState(isGroup);

  const { authUser } = useAuthUser();
  const chatClient = useStreamChatClient(); // Use shared client from context

  // Poll for block status to handle bi-directional blocking in real-time
  const { data: blockStatus, refetch: refetchBlockStatus } = useQuery({
    queryKey: ["blockStatus", targetUserId],
    queryFn: () => checkIfBlocked(targetUserId),
    enabled: !!authUser && !!targetUserId && !isGroup,
    refetchInterval: 3000, // Check every 3 seconds
  });

  // Poll for group data to handle admin-only toggle in real-time
  const { data: groupData } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupById(groupId),
    enabled: !!authUser && isGroup && !!groupId,
    refetchInterval: 3000, // Check every 3 seconds
  });

  const blockUserMutation = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      toast.success("User blocked successfully");
      refetchBlockStatus();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to block user");
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      toast.success("User unblocked successfully");
      refetchBlockStatus();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unblock user");
    },
  });

  // Derived state from queries
  const isBlocked = blockStatus?.isBlocked || false;
  const isBlockedByTarget = blockStatus?.isBlockedByTarget || false;

  const isAdminOnly = groupData?.adminOnlyMessaging || false;
  // Check if current user is admin (handle both populated object and direct ID)
  const groupAdminId = groupData?.admin?._id || groupData?.admin;
  const amIAdmin = !!groupAdminId && String(groupAdminId) === String(authUser?._id);

  console.log("Chat State Debug:", {
    isBlocked,
    isBlockedByTarget,
    isAdminOnly,
    amIAdmin,
    groupAdminId,
    myId: authUser?._id
  });


  useEffect(() => {
    const initChat = async () => {
      if (!chatClient || !authUser) {
        console.log("Waiting for client or auth user...");
        return;
      }

      try {
        console.log("Setting up channel with shared client...");

        // Check if it's a group chat (starts with "group-")
        const isGroup = targetUserId.startsWith("group-");
        setIsGroupChat(isGroup);

        let currChannel;
        if (isGroup) {
          // Group chat - extract group ID and fetch group details
          const groupId = targetUserId.replace("group-", "");

          console.log("Extracted group ID from URL:", groupId);
          console.log("Full target user ID:", targetUserId);

          try {
            // Fetch group details to get all members
            console.log("Fetching group details from:", `/groups/${groupId}`);
            const response = await axiosInstance.get(`/groups/${groupId}`);
            const groupData = response.data;

            console.log("Group data received - name:", groupData.name, "member count:", groupData.members.length);

            // Extract member IDs (convert ObjectIds to strings)
            // Ensure only an array of string IDs is sent
            const memberIds = groupData.members.map(member => {
              if (typeof member === 'string') return member;
              if (member && typeof member._id === 'string') return member._id;
              if (member && member._id && typeof member._id === 'object' && member._id.toString) return member._id.toString();
              return '';
            }).filter(Boolean);

            console.log("Creating/getting channel with members:", memberIds);

            // Determine if current user is admin
            const groupAdminId = groupData.admin?._id || groupData.admin;
            const isUserAdmin = !!groupAdminId && String(groupAdminId) === String(authUser._id);

            // Check if channel already exists
            const existingChannels = await chatClient.queryChannels({
              type: "messaging",
              id: { $eq: targetUserId },
            });

            const channelExists = existingChannels.length > 0;
            console.log(`Channel ${targetUserId} exists: ${channelExists}, User is Admin: ${isUserAdmin}`);

            let channelPayload = {};

            // Only send payload (which triggers update) if:
            // 1. Channel doesn't exist (need to create it)
            // 2. OR User is Admin (has permission to update)
            if (!channelExists || isUserAdmin) {
              channelPayload = {
                name: groupData.name,
                members: memberIds,
              };
            }

            // If channel exists and user is NOT admin, we join without payload 
            // to avoid "permission denied" for updates.
            // Stream automatically fixes members on join if configured, 
            // but we rely on Admin to keep it synced mostly.

            console.log("Using channel payload:", channelPayload);
            currChannel = chatClient.channel("messaging", targetUserId, channelPayload);

            // Watch will create the channel if it doesn't exist and set up members
            await currChannel.watch();
            console.log("Channel setup complete");
          } catch (error) {
            console.error("Error setting up group channel:", error);
            console.error("Error details:", error.message);
            toast.error("Could not access group chat. Please try again.");
            setLoading(false);
            return;
          }
        } else {
          // Direct message
          const channelId = [authUser._id, targetUserId].sort().join("-");
          currChannel = chatClient.channel("messaging", channelId, {
            members: [authUser._id, targetUserId],
          });
        }

        await currChannel.watch();

        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        // Show specific error if possible
        toast.error(error.message || "Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();

    // Cleanup only when component unmounts completely
    // Don't disconnect on dependency changes to avoid token errors
    return () => {
      if (channel) {
        channel.stopWatching();
      }
    };
  }, [chatClient, authUser, targetUserId]);

  // Handle AI message interception using event listener
  useEffect(() => {
    if (!channel) return;

    const handleNewMessage = async (event) => {
      const message = event.message;
      const text = message.text || "";

      // Check if it's from current user and starts with @ai
      if (message.user.id === authUser._id && text.trim().toLowerCase().startsWith("@ai")) {
        // Extract the actual question (remove @ai prefix)
        const question = text.slice(3).trim();

        if (!question) {
          toast.error("Please ask a question after @ai");
          return;
        }

        try {
          // Send to AI endpoint
          const response = await axiosInstance.post("/chat/ai-message", {
            message: question,
            channelId: channel.id,
          });

          // Send AI response to the channel
          await channel.sendMessage({
            text: `🤖 AI Assistant: ${response.data.reply}`,
            ai_response: true,
          });

        } catch (error) {
          console.error("AI message error:", error);
          toast.error("Failed to get AI response");
        }
      }
    };

    channel.on("message.new", handleNewMessage);

    return () => {
      channel.off("message.new", handleNewMessage);
    };
  }, [channel, authUser]);

  const handleBlockToggle = () => {
    if (isBlocked) {
      if (confirm("Are you sure you want to unblock this user?")) {
        unblockUserMutation.mutate(targetUserId);
      }
    } else {
      if (confirm("Are you sure you want to block this user? They won't be able to send you messages.")) {
        blockUserMutation.mutate(targetUserId);
      }
    }
  };

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            {/* Call Button - Only show if messaging is allowed */}
            {(!isBlocked && !isBlockedByTarget) && !(isGroupChat && isAdminOnly && !amIAdmin) && (
              <CallButton handleVideoCall={handleVideoCall} />
            )}

            {/* Block/Unblock button - only for direct messages */}
            {!isGroupChat && (
              <button
                onClick={handleBlockToggle}
                className={`absolute top-4 right-20 z-10 btn btn-sm ${isBlocked ? "btn-warning" : "btn-ghost"
                  } gap-1`}
                title={isBlocked ? "Unblock user" : "Block user"}
              >
                {isBlocked ? (
                  <>
                    <ShieldOff className="size-4" />
                    Unblock
                  </>
                ) : (
                  <>
                    <Ban className="size-4" />
                    Block
                  </>
                )}
              </button>
            )}

            <Window>
              <ChannelHeader />
              <AIChatHelper />

              {/* Show message if user is blocked */}
              {isBlocked && !isGroupChat && (
                <div className="alert alert-warning m-4">
                  <Ban className="size-5" />
                  <span>You have blocked this user. Unblock to send messages.</span>
                </div>
              )}

              {/* Show message if blocked by target */}
              {isBlockedByTarget && !isGroupChat && (
                <div className="alert alert-error m-4">
                  <Ban className="size-5" />
                  <span>You have been blocked by this user. You cannot send messages.</span>
                </div>
              )}

              {/* Show message if admin-only mode and not admin */}
              {isGroupChat && isAdminOnly && !amIAdmin && (
                <div className="alert alert-info m-4">
                  <Shield className="size-5" />
                  <span>Only admins can send messages in this group.</span>
                </div>
              )}

              <MessageList />

              {/* Conditionally render MessageInput to strictly enforce permissions */}
              {((isBlocked || isBlockedByTarget) && !isGroupChat) || (isGroupChat && isAdminOnly && !amIAdmin) ? (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 text-center text-gray-500 text-sm">
                  Messaging is currently disabled
                </div>
              ) : (
                <MessageInput focus />
              )}
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;