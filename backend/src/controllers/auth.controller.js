import { upsertStreamUser, streamClient } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { verifyFirebaseToken } from "../lib/firebaseAuth.js";
import OTP from "../models/OTP.js";
import { sendOtpEmail } from "../lib/email.js";


export async function signup(req, res) {
  const { email, password, fullName } = req.body;


  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const idx = Math.floor(Math.random() * 100) + 1; //random number between 1 and 100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`; //random avatar from 1 to 100

    const newUser = await User.create({
      email,
      password,
      fullName,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.error("Error in creating stream user", error);
    }



    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    })
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error in signup controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is deactivated
    if (user.isDeactivated) {
      user.isDeactivated = false;
      user.deactivatedAt = undefined;
      await user.save();
      console.log(`User ${user.email} reactivated`);

      // Ensure Stream user is active/upserted again ensuring sync
      try {
        await upsertStreamUser({
          id: user._id.toString(),
          name: user.fullName,
          image: user.profilePic || "",
        });
      } catch (error) {
        console.error("Error reactivating stream user", error);
      }
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    })
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.status(200).json({ success: true, message: "User logged in successfully", user });

  } catch (error) {
    console.error("Error in login controller", error);
    res.status(500).json({ message: "Internal server error" });

  }
}

export function logout(req, res) {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ success: true, message: "User logged out successfully" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, nativeLanguage, learningLanguage, bio, location, profilePic } = req.body;

    if (!fullName || !nativeLanguage || !learningLanguage || !bio || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: {
          fullName: !fullName,
          nativeLanguage: !nativeLanguage,
          learningLanguage: !learningLanguage,
          bio: !bio,
          location: !location,
        },
      });
    }

    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        nativeLanguage,
        learningLanguage,
        bio,
        location,
        profilePic,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updateUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updateUser._id.toString(),
        name: updateUser.fullName,
        image: updateUser.profilePic || "",
      });
      console.log(`Stream user updated successfully for ${updateUser.fullName}`);
    } catch (error) {
      console.error("Error updating Stream user:", error);
      return res.status(500).json({ message: "Failed to update Stream user" });
    }

    res.status(200).json({ success: true, user: updateUser });
  } catch (error) {
    console.error("Error during onboarding:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deactivateAccount = async (req, res) => {
  try {
    console.log("Deactivate request received for user:", req.user?._id);
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found for deactivation");
      return res.status(404).json({ message: "User not found" });
    }

    user.isDeactivated = true;
    user.deactivatedAt = new Date();
    await user.save();
    console.log("User deactivated successfully in DB");

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    console.log("Delete request received for user:", req.user?._id);
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      console.log("User not found for deletion");
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(userId);
    console.log("User deleted from MongoDB");

    // Delete from Stream Chat
    try {
      await streamClient.deleteUser(userId.toString(), {
        mark_messages_deleted: true,
        hard_delete: true,
      });
      console.log("User deleted from Stream Chat");
    } catch (streamError) {
      console.error("Error deleting user from Stream:", streamError);
      // Don't fail the request if stream deletion fails, but log it
    }

    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ message: "Account deleted permanently" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Social Login (Google)
export const socialLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // 1. Verify Firebase Token using manual JWT verification (bypasses API key restrictions)
    let decodedClaims;
    try {
      decodedClaims = await verifyFirebaseToken(idToken, process.env.FIREBASE_PROJECT_ID || "baat-chitauth");
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError.message);
      return res.status(401).json({ message: "Invalid Social Token" });
    }

    const { email, name, picture } = decodedClaims;

    // 2. Find or Create User
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user (Generate random password)
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      user = new User({
        fullName: name,
        email,
        password: randomPassword, // Pre-save hook will hash this
        profilePic: picture,
      });
      await user.save();

      // Sync with Stream
      try {
        await upsertStreamUser({
          id: user._id.toString(),
          name: user.fullName,
          image: user.profilePic,
        });
      } catch (streamError) {
        console.error("Stream sync error during social login:", streamError);
      }
    }

    // 3. Generate JWT (Same logic as login/signup)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, message: "Logged in successfully", user });

  } catch (error) {
    console.error("Social login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Send Email OTP
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("EMAIL_USER or EMAIL_PASSWORD not configured");
      return res.status(500).json({ message: "Email service not configured" });
    }

    console.log("Generating OTP for:", email);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Store new OTP
    await OTP.create({
      email,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    console.log("OTP stored in DB, attempting to send email...");

    // Send OTP email
    try {
      await sendOtpEmail(email, otp);
      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Email sending error details:", {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });
      throw emailError;
    }

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      message: "Failed to send OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Verify Email OTP and Login/Signup
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < Date.now()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({ message: "OTP has expired" });
    }

    // OTP is valid, delete it
    await OTP.deleteOne({ _id: otpRecord._id });

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const idx = Math.floor(Math.random() * 100) + 1;
      const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

      user = await User.create({
        email,
        password: randomPassword,
        fullName: email.split("@")[0], // Use email prefix as name
        profilePic: randomAvatar,
      });

      // Sync with Stream
      try {
        await upsertStreamUser({
          id: user._id.toString(),
          name: user.fullName,
          image: user.profilePic,
        });
      } catch (streamError) {
        console.error("Stream sync error:", streamError);
      }
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, message: "Logged in successfully", user });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
