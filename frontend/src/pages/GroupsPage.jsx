import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserGroups, deleteGroup, updateGroupPicture } from "../lib/api";
import { Users, Plus, MessageCircle, RefreshCw, Settings, Trash2, UserPlus, Camera } from "lucide-react";
import { useNavigate } from "react-router";
import Layout from "../components/Layout";
import CreateGroupModal from "../components/CreateGroupModal";
import AddMembersModal from "../components/AddMembersModal";
import GroupSettingsModal from "../components/GroupSettingsModal";
import PageLoader from "../components/PageLoader";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";

const GroupsPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: groups, isLoading, refetch } = useQuery({
    queryKey: ["groups"],
    queryFn: getUserGroups,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      toast.success("Group deleted successfully!");
      queryClient.invalidateQueries(["groups"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete group");
    },
  });

  const updateGroupPictureMutation = useMutation({
    mutationFn: ({ groupId, groupImage }) => updateGroupPicture(groupId, groupImage),
    onSuccess: () => {
      toast.success("Group picture updated successfully!");
      queryClient.invalidateQueries(["groups"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update group picture");
    },
  });

  const handleGroupClick = (group, e) => {
    // Don't navigate if clicking on action buttons
    if (e.target.closest('.group-actions')) {
      return;
    }
    navigate(`/chat/group-${group._id}`);
  };

  const handleDeleteGroup = (group, e) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      deleteGroupMutation.mutate(group._id);
    }
  };

  const handleAddMembers = (group, e) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsAddMembersModalOpen(true);
  };

  const handleUpdateGroupPicture = (group, e) => {
    e.stopPropagation();
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          updateGroupPictureMutation.mutate({
            groupId: group._id,
            groupImage: reader.result,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleGroupSettings = (group, e) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setIsSettingsModalOpen(true);
  };

  const isAdmin = (group) => {
    if (!authUser || !group || !group.admin) {
      console.log('isAdmin check failed - missing data:', { authUser, group: !!group, admin: !!group?.admin });
      return false;
    }
    const adminId = String(group.admin._id);
    const userId = String(authUser._id);
    const result = adminId === userId;
    console.log('isAdmin check:', { adminId, userId, result, groupName: group.name });
    return result;
  };

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="size-8" />
              My Groups
            </h1>
            <p className="text-base-content/60 mt-1">
              {groups?.length || 0} group{groups?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="btn btn-ghost gap-2"
              title="Refresh groups"
            >
              <RefreshCw className="size-5" />
              Refresh
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary gap-2"
            >
              <Plus className="size-5" />
              Create Group
            </button>
          </div>
        </div>

        {/* Groups List */}
        {groups && groups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={(e) => handleGroupClick(group, e)}
                className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="avatar placeholder">
                        <div className="bg-primary text-primary-content rounded-full w-12">
                          <Users className="size-6" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="card-title text-lg">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-base-content/60 line-clamp-2 mt-1">
                            {group.description}
                          </p>
                        )}

                        {/* Show member avatars */}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="avatar-group -space-x-4">
                            {group.members.slice(0, 3).map((member) => (
                              <div key={member._id} className="avatar placeholder">
                                <div className="w-8 rounded-full">
                                  <img src={member.profilePic} alt={member.fullName} />
                                </div>
                              </div>
                            ))}
                            {group.members.length > 3 && (
                              <div className="avatar placeholder">
                                <div className="w-8 bg-base-300 text-base-content rounded-full">
                                  <span className="text-xs">+{group.members.length - 3}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-base-content/60">
                            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-base-content/60">
                          <span className="flex items-center gap-1">
                            <MessageCircle className="size-4" />
                            Chat
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Only for Admin) */}
                    {isAdmin(group) && (
                      <div className="group-actions flex gap-1">
                        <button
                          onClick={(e) => handleGroupSettings(group, e)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Group settings"
                        >
                          <Settings className="size-4" />
                        </button>
                        <button
                          onClick={(e) => handleAddMembers(group, e)}
                          className="btn btn-ghost btn-sm btn-circle"
                          title="Add members"
                        >
                          <UserPlus className="size-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteGroup(group, e)}
                          className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error hover:text-error-content"
                          title="Delete group"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Admin Badge */}
                  {group.admin._id && (
                    <div className="mt-2">
                      <span className="badge badge-sm badge-outline">
                        Admin: {group.admin.fullName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Users className="size-16 mx-auto text-base-content/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
            <p className="text-base-content/60 mb-2">
              Create a group to start chatting with multiple friends!
            </p>
            <p className="text-sm text-base-content/40 mb-6">
              💡 Tip: Only groups where you are a member will appear here
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary gap-2"
            >
              <Plus className="size-5" />
              Create Your First Group
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {selectedGroup && (
        <AddMembersModal
          isOpen={isAddMembersModalOpen}
          onClose={() => {
            setIsAddMembersModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
        />
      )}

      {selectedGroup && (
        <GroupSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => {
            setIsSettingsModalOpen(false);
            setSelectedGroup(null);
          }}
          group={selectedGroup}
        />
      )}
    </>
  );
};

export default GroupsPage;
