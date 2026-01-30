import { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";

const StreamChatContext = createContext(null);

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY || "nk8t8zxtr6qf";

export const StreamChatProvider = ({ children }) => {
    const [client, setClient] = useState(null);
    const { authUser } = useAuthUser();

    const { data: tokenData } = useQuery({
        queryKey: ["streamToken"],
        queryFn: getStreamToken,
        enabled: !!authUser,
    });

    useEffect(() => {
        if (!tokenData?.token || !authUser) return;

        const initClient = async () => {
            try {
                const chatClient = StreamChat.getInstance(STREAM_API_KEY);

                // Only connect if not already connected to this user
                if (chatClient.userID !== authUser._id) {
                    if (chatClient.userID) {
                        await chatClient.disconnectUser();
                    }

                    await chatClient.connectUser(
                        {
                            id: authUser._id,
                            name: authUser.fullName,
                            image: authUser.profilePic,
                        },
                        tokenData.token
                    );
                }

                setClient(chatClient);
            } catch (error) {
                console.error("Error initializing Stream Chat:", error);
            }
        };

        initClient();

        // Cleanup on unmount
        return () => {
            // Don't disconnect here - let it persist across navigation
        };
    }, [tokenData, authUser]);

    return (
        <StreamChatContext.Provider value={client}>
            {children}
        </StreamChatContext.Provider>
    );
};

export const useStreamChatClient = () => {
    return useContext(StreamChatContext);
};
