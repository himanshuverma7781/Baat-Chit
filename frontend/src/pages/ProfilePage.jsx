import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, deactivateAccount, deleteAccount } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";
import { Camera, MapPin, Globe, Languages, Loader } from "lucide-react";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  const { mutate: updateProfileMutation, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["authUser"], data);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const { mutate: deactivateMutation, isPending: isDeactivating } = useMutation({
    mutationFn: deactivateAccount,
    onSuccess: () => {
      toast.success("Account deactivated successfully");
      window.location.reload(); // Force reload to trigger auth check logout
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to deactivate account");
    },
  });

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success("Account deleted successfully");
      window.location.reload(); // Force reload to trigger auth check logout
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete account");
    },
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting profile update with data:", formData);
    updateProfileMutation(formData);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to compress image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set max dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          console.log("Image compressed, new size:", compressedImage.length, "bytes");
          setFormData({ ...formData, profilePic: compressedImage });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const languages = [
    "English", "Spanish", "French", "German", "Italian", "Portuguese",
    "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Russian",
    "Turkish", "Dutch", "Swedish", "Polish", "Vietnamese", "Thai"
  ];

  return (
    <div className="min-h-screen bg-base-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl font-bold mb-6">Edit Profile</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="avatar">
                    <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      <img
                        src={formData.profilePic || "/avatar.png"}
                        alt="Profile"
                      />
                    </div>
                  </div>
                  <label
                    htmlFor="profilePic"
                    className="absolute bottom-0 right-0 btn btn-circle btn-primary btn-sm cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      id="profilePic"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <p className="text-sm text-base-content/60">Click camera icon to change photo</p>
              </div>

              {/* Full Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Full Name</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  placeholder="Your full name"
                />
              </div>

              {/* Bio */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Bio</span>
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="textarea textarea-bordered h-24"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Native Language */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Native Language
                  </span>
                </label>
                <select
                  name="nativeLanguage"
                  value={formData.nativeLanguage}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="">Select your native language</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Language */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Learning Language
                  </span>
                </label>
                <select
                  name="learningLanguage"
                  value={formData.learningLanguage}
                  onChange={handleInputChange}
                  className="select select-bordered"
                >
                  <option value="">Select language you're learning</option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input input-bordered"
                  placeholder="City, Country"
                />
              </div>

              {/* Submit Button */}
              <div className="card-actions justify-end pt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-wide"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Profile Preview */}
        <div className="card bg-base-200 shadow-xl mt-6">
          <div className="card-body">
            <h3 className="card-title text-xl mb-4">Profile Preview</h3>
            <div className="flex items-start gap-4">
              <div className="avatar">
                <div className="w-20 rounded-full">
                  <img src={formData.profilePic || "/avatar.png"} alt="Profile" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg">{formData.fullName || "Your Name"}</h4>
                <p className="text-sm text-base-content/70 mt-1">
                  {formData.bio || "Your bio will appear here..."}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.nativeLanguage && (
                    <div className="badge badge-primary gap-1">
                      <Globe className="w-3 h-3" />
                      {formData.nativeLanguage}
                    </div>
                  )}
                  {formData.learningLanguage && (
                    <div className="badge badge-secondary gap-1">
                      <Languages className="w-3 h-3" />
                      Learning {formData.learningLanguage}
                    </div>
                  )}
                  {formData.location && (
                    <div className="badge badge-accent gap-1">
                      <MapPin className="w-3 h-3" />
                      {formData.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Management - Danger Zone */}
        <div className="card bg-base-200 shadow-xl mt-6 border-2 border-error/20">
          <div className="card-body">
            <h3 className="card-title text-xl text-error mb-4">Danger Zone</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg">
                <div>
                  <h4 className="font-bold">Deactivate Account</h4>
                  <p className="text-sm text-base-content/70">
                    Temporarily hide your profile. You can reactive it by logging in again.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to deactivate your account? You can reactivate it by logging in anytime.")) {
                      deactivateMutation();
                    }
                  }}
                  className="btn btn-outline btn-warning"
                  disabled={isDeactivating}
                >
                  {isDeactivating ? "Deactivating..." : "Deactivate"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg">
                <div>
                  <h4 className="font-bold text-error">Delete Account</h4>
                  <p className="text-sm text-base-content/70">
                    Permanently remove your account and all data. This cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("WARNING: This action is permanent! Are you sure you want to DELETE your account?")) {
                      deleteMutation();
                    }
                  }}
                  className="btn btn-error text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
