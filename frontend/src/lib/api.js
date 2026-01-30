import { axiosInstance } from "./axios";


export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};
export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
// Auth API
export const socialLogin = (data) => {
  return axiosInstance.post("/auth/social-login", data).then(res => res.data);
};

export const sendEmailOtp = (data) => {
  return axiosInstance.post("/auth/send-email-otp", data).then(res => res.data);
};

export const verifyEmailOtp = (data) => {
  return axiosInstance.post("/auth/verify-email-otp", data).then(res => res.data);
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.error("Error fetching authenticated user:", error);
    return null;
  }
};


export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};
export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
};

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
};
export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export async function updateProfile(profileData) {
  console.log("API: Sending profile update request with:", profileData);
  try {
    const response = await axiosInstance.put("/users/profile", profileData);
    console.log("API: Profile update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API: Profile update failed:", error);
    console.error("API: Error response:", error.response?.data);
    throw error;
  }
}

// Group APIs
export async function createGroup(groupData) {
  const response = await axiosInstance.post("/groups/create", groupData);
  return response.data;
}

export async function getUserGroups() {
  const response = await axiosInstance.get("/groups");
  return response.data;
}

export async function getGroupById(groupId) {
  const response = await axiosInstance.get(`/groups/${groupId}`);
  return response.data;
}

export async function addMembersToGroup(groupId, memberIds) {
  const response = await axiosInstance.post(`/groups/${groupId}/add-members`, { memberIds });
  return response.data;
}

export async function removeMemberFromGroup(groupId, memberId) {
  const response = await axiosInstance.delete(`/groups/${groupId}/remove/${memberId}`);
  return response.data;
}

export async function leaveGroup(groupId) {
  const response = await axiosInstance.post(`/groups/${groupId}/leave`);
  return response.data;
}

export async function deleteGroup(groupId) {
  const response = await axiosInstance.delete(`/groups/${groupId}`);
  return response.data;
}

export async function updateGroupPicture(groupId, groupImage) {
  const response = await axiosInstance.put(`/groups/${groupId}/picture`, { groupImage });
  return response.data;
}

// Blocking APIs
export async function blockUser(userId) {
  const response = await axiosInstance.post(`/block/${userId}`);
  return response.data;
}

export async function unblockUser(userId) {
  const response = await axiosInstance.delete(`/block/${userId}`);
  return response.data;
}

export async function getBlockedUsers() {
  const response = await axiosInstance.get("/block");
  return response.data;
}

export async function checkIfBlocked(userId) {
  const response = await axiosInstance.get(`/block/check/${userId}`);
  return response.data;
}

// Admin-only messaging
export async function toggleAdminOnlyMessaging(groupId) {
  const response = await axiosInstance.put(`/groups/${groupId}/admin-only-messaging`);
  return response.data;
}

export const deactivateAccount = async () => {
  const response = await axiosInstance.put("/auth/deactivate");
  return response.data;
};

export const deleteAccount = async () => {
  const response = await axiosInstance.delete("/auth/delete");
  return response.data;
};

