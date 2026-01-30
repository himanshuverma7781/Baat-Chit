import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleAdminOnlyMessaging } from "../lib/api";
import { X, Shield, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ isOpen, onClose, group }) => {
    const queryClient = useQueryClient();

    const toggleAdminOnlyMutation = useMutation({
        mutationFn: toggleAdminOnlyMessaging,
        onSuccess: (updatedGroup) => {
            const message = updatedGroup.adminOnlyMessaging
                ? "Admin-only messaging enabled"
                : "Admin-only messaging disabled";
            toast.success(message);
            queryClient.invalidateQueries(["groups"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to update settings");
        },
    });

    const handleToggleAdminOnly = () => {
        toggleAdminOnlyMutation.mutate(group._id);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-base-200 rounded-lg w-full max-w-md p-6 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Shield className="size-6" />
                        Group Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Group Info */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                    {group.description && (
                        <p className="text-sm text-base-content/60 mt-1">{group.description}</p>
                    )}
                </div>

                {/* Admin-Only Messaging Setting */}
                <div className="card bg-base-300 p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageCircle className="size-5" />
                                <h4 className="font-semibold">Admin-Only Messaging</h4>
                            </div>
                            <p className="text-sm text-base-content/60">
                                When enabled, only group admins can send messages. Other members can only view messages.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={group.adminOnlyMessaging || false}
                            onChange={handleToggleAdminOnly}
                            disabled={toggleAdminOnlyMutation.isPending}
                        />
                    </div>
                </div>

                {/* Status Badge */}
                {group.adminOnlyMessaging && (
                    <div className="alert alert-info mt-4">
                        <Shield className="size-5" />
                        <span className="text-sm">
                            Only admins can send messages in this group
                        </span>
                    </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="btn btn-primary">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsModal;
