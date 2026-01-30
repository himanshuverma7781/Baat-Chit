import { useState } from "react";
import { X, Users, Image as ImageIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGroup, getUserFriends } from "../lib/api";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupImage, setGroupImage] = useState("");
  const queryClient = useQueryClient();

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      toast.success("Group created successfully!");
      queryClient.invalidateQueries(["groups"]);
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create group");
    },
  });

  const resetForm = () => {
    setGroupName("");
    setDescription("");
    setSelectedMembers([]);
    setGroupImage("");
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    createGroupMutation.mutate({
      name: groupName,
      description,
      memberIds: selectedMembers,
      groupImage,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-base-100 border-b border-base-300 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="size-6" />
            Create Group
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Group Image */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Group Picture (Optional)</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className={`${groupImage ? '' : 'bg-primary text-primary-content'} rounded-full w-20`}>
                  {groupImage ? (
                    <img src={groupImage} alt="Group" />
                  ) : (
                    <Users className="size-10" />
                  )}
                </div>
              </div>
              <label className="btn btn-outline btn-sm gap-2 cursor-pointer">
                <ImageIcon className="size-4" />
                Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {groupImage && (
                <button
                  type="button"
                  onClick={() => setGroupImage("")}
                  className="btn btn-ghost btn-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Group Name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Group Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="input input-bordered w-full"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Description (Optional)</span>
            </label>
            <textarea
              placeholder="What's this group about?"
              className="textarea textarea-bordered w-full"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Select Members */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                Select Members * ({selectedMembers.length} selected)
              </span>
            </label>
            <div className="border border-base-300 rounded-lg max-h-64 overflow-y-auto">
              {friends && friends.length > 0 ? (
                friends.map((friend) => (
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
                  No friends available. Add friends first!
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
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
