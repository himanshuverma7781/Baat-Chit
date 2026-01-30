import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

// Global storage key for shown notifications
const SHOWN_NOTIFICATIONS_KEY = "baat_chit_shown_notifications";
const SEEN_NOTIFICATIONS_KEY = "baat_chit_seen_notifications";

// Helper to get shown notifications from localStorage
const getShownNotifications = () => {
    try {
        const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
};

// Helper to save shown notifications to localStorage
const saveShownNotifications = (ids) => {
    try {
        localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
    } catch (e) {
        console.error("Failed to save shown notifications", e);
    }
};

// Helper to get seen notifications from localStorage
const getSeenNotifications = () => {
    try {
        const stored = localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
};

// Helper to save seen notifications to localStorage
const saveSeenNotifications = (ids) => {
    try {
        localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
    } catch (e) {
        console.error("Failed to save seen notifications", e);
    }
};

export const useNotifications = () => {
    const navigate = useNavigate();
    const [notificationCount, setNotificationCount] = useState(0);
    const [hasNewNotifications, setHasNewNotifications] = useState(false);
    const isInitialRenderRef = useRef(true);

    // Poll for friend requests every 10 seconds
    const { data: friendRequests } = useQuery({
        queryKey: ["friendRequests"],
        queryFn: getFriendRequests,
        refetchInterval: 10000, // 10 seconds
        refetchIntervalInBackground: false, // Pause when tab is not visible
    });

    useEffect(() => {
        if (!friendRequests) return;

        const incomingRequests = friendRequests.incomingReqs || [];
        const acceptedRequests = friendRequests.acceptedReqs || [];

        // Get shown and seen notifications from localStorage
        const shownNotificationIds = getShownNotifications();
        const seenNotificationIds = getSeenNotifications();

        // Calculate unseen notification count
        const unseenIncoming = incomingRequests.filter(req => !seenNotificationIds.has(req._id));
        const unseenAccepted = acceptedRequests.filter(req => !seenNotificationIds.has(req._id));
        const unseenCount = unseenIncoming.length + unseenAccepted.length;

        // Skip showing toasts on initial render
        if (isInitialRenderRef.current) {
            isInitialRenderRef.current = false;
            setNotificationCount(unseenCount);
            setHasNewNotifications(unseenCount > 0);
            return;
        }

        // Check for NEW incoming friend requests (not yet shown)
        incomingRequests.forEach(request => {
            if (!shownNotificationIds.has(request._id)) {
                // New friend request - show toast
                toast.success(
                    (t) => (
                        <div
                            className="cursor-pointer"
                            onClick={() => {
                                navigate("/notifications");
                                toast.dismiss(t.id);
                            }}
                        >
                            <div className="font-semibold">New Friend Request</div>
                            <div className="text-sm opacity-80">
                                {request.sender.fullName} wants to connect
                            </div>
                        </div>
                    ),
                    {
                        duration: 5000,
                        icon: "👋",
                    }
                );

                // Mark as shown
                shownNotificationIds.add(request._id);
            }
        });

        // Check for NEW accepted requests (not yet shown)
        acceptedRequests.forEach(notification => {
            if (!shownNotificationIds.has(notification._id)) {
                // Friend request accepted - show toast
                toast.success(
                    (t) => (
                        <div
                            className="cursor-pointer"
                            onClick={() => {
                                navigate("/notifications");
                                toast.dismiss(t.id);
                            }}
                        >
                            <div className="font-semibold">Friend Request Accepted</div>
                            <div className="text-sm opacity-80">
                                {notification.recipient.fullName} accepted your request
                            </div>
                        </div>
                    ),
                    {
                        duration: 5000,
                        icon: "🎉",
                    }
                );

                // Mark as shown
                shownNotificationIds.add(notification._id);
            }
        });

        // Save updated shown notifications
        saveShownNotifications(shownNotificationIds);

        // Update state with UNSEEN count
        setNotificationCount(unseenCount);
        setHasNewNotifications(unseenCount > 0);

    }, [friendRequests, navigate]);

    const markAllAsSeen = () => {
        if (!friendRequests) return;

        const incomingRequests = friendRequests.incomingReqs || [];
        const acceptedRequests = friendRequests.acceptedReqs || [];

        const seenNotificationIds = getSeenNotifications();

        // Mark all current notifications as seen
        incomingRequests.forEach(req => seenNotificationIds.add(req._id));
        acceptedRequests.forEach(req => seenNotificationIds.add(req._id));

        // Save to localStorage
        saveSeenNotifications(seenNotificationIds);

        // Clear the count and new status
        setNotificationCount(0);
        setHasNewNotifications(false);
    };

    return {
        notificationCount,
        hasNewNotifications,
        markAllAsSeen,
    };
};
