import { useEffect, useState } from "react";
import { useStreamChatClient } from "../contexts/StreamChatContext";

// Hook to get unread message count for a specific friend
export const useUnreadMessages = (friendId) => {
    const client = useStreamChatClient();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!client || !friendId || !client.userID) {
            console.log("Unread hook - waiting for client:", { hasClient: !!client, hasFriendId: !!friendId, clientUserID: client?.userID });
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                console.log(`Fetching unread count for friend: ${friendId}`);

                // Query for the specific channel with this friend
                const channelId = [client.userID, friendId].sort().join("-");

                const channels = await client.queryChannels({
                    type: "messaging",
                    id: channelId,
                });

                console.log(`Found ${channels.length} channels for ${friendId}`);

                if (channels.length > 0) {
                    const channel = channels[0];
                    const count = channel.countUnread();
                    console.log(`Unread count for ${friendId}: ${count}`);
                    setUnreadCount(count);
                } else {
                    setUnreadCount(0);
                }
            } catch (error) {
                console.error(`Error fetching unread count for ${friendId}:`, error);
                setUnreadCount(0);
            }
        };

        fetchUnreadCount();

        // Listen for new messages and mark as read events
        const handleEvent = (event) => {
            // Refetch when any message event occurs
            fetchUnreadCount();
        };

        client.on("message.new", handleEvent);
        client.on("message.read", handleEvent);

        return () => {
            client.off("message.new", handleEvent);
            client.off("message.read", handleEvent);
        };
    }, [client, friendId]);

    return unreadCount;
};
