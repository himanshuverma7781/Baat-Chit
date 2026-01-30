import { useState } from "react";
import { X, UserPlus, UserMinus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addMembersToGroup, removeMemberFromGroup, getUserFriends } from "../lib/api";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

const AddMembersModal = ({ isOpen, onClose, group }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("add"); // "add" or "remove"
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    enabled: isOpen,
  });

  const addMembersMutation = useMutation({
    mutationFn: ({ groupId, memberIds }) => addMembersToGroup(groupId, memberIds),
    onSuccess: () => {
      toast.success("Members added successfully!");
      queryClient.invalidateQueries(["groups"]);
      onClose();
      setSelectedMembers([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add members");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }) => removeMemberFromGroup(groupId, memberId),
    onSuccess: () => {
      toast.success("Member removed successfully!");
      queryClient.invalidateQueries(["groups"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to remove member");
    },
  });

  const toggleMemberSelection = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    addMembersMutation.mutate({
      groupId: group._id,
      memberIds: selectedMembers,
    });
  };

  const handleRemoveMember = (memberId) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate({
        groupId: group._id,
        memberId,
      });
    }
  };

  // Filter out users who are already members
  const availableFriends = friends?.filter(
    (friend) => !group?.members?.some((member) => member._id === friend._id)
  );

  // Current members excluding admin
  const removableMembers = group?.members?.filter(
    (member) => member._id !== group.admin._id && member._id !== authUser?._id
  );

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="size-6" />
            Manage Members - {group?.name}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed p-4">
          <a
            className={`tab ${activeTab === "add" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("add")}
          >
            Add Members
          </a>
          <a
            className={`tab ${activeTab === "remove" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("remove")}
          >
            Remove Members
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {activeTab === "add" ? (
            /* Add Members Tab */
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Select Members * ({selectedMembers.length} selected)
                  </span>
                </label>
                <div className="border border-base-300 rounded-lg max-h-64 overflow-y-auto">
                  {availableFriends && availableFriends.length > 0 ? (
                    availableFriends.map((friend) => (
                      <label
                        key={friend._id}
                        className="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={selectedMembers.includes(friend._id)}
                          onChange={() => toggleMemberSelection(friend._id)}
                        />
                        <img
                          src={friend.profilePic}
                          alt={friend.fullName}
                          className="size-10 rounded-full object-cover"
                        />
                        <span className="font-medium">{friend.fullName}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-base-content/60 py-8">
                      All your friends are already in this group!
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-ghost flex-1"
                  disabled={addMembersMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={addMembersMutation.isPending || selectedMembers.length === 0}
                >
                  {addMembersMutation.isPending ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    "Add Members"
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Remove Members Tab */
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Current Members ({removableMembers?.length || 0})
                </span>
              </label>
              <div className="border border-base-300 rounded-lg max-h-64 overflow-y-auto">
                {removableMembers && removableMembers.length > 0 ? (
                  removableMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-3 border-b border-base-300 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.profilePic}
                          alt={member.fullName}
                          className="size-10 rounded-full object-cover"
                        />
                        <span className="font-medium">{member.fullName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member._id)}
                        className="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
                        disabled={removeMemberMutation.isPending}
                      >
                        <UserMinus className="size-4" />
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base-content/60 py-8">
                    No members to remove
                  </p>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddMembersModal;
