import { useState } from "react";
import { ShipWheelIcon, Mail } from "lucide-react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { socialLogin, sendEmailOtp, verifyEmailOtp } from "../lib/api";
import toast from "react-hot-toast";

const AuthPage = () => {
    const [emailOtpData, setEmailOtpData] = useState({
        email: "",
        otp: "",
    });
    const [showOtpInput, setShowOtpInput] = useState(false);

    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Social Login Mutation
    const { mutate: socialAuthMutation, isPending: isSocialPending } = useMutation({
        mutationFn: socialLogin,
        onSuccess: (data) => {
            queryClient.setQueryData(["authUser"], data);
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            navigate("/");
            toast.success("Logged in successfully!");
        },
        onError: (error) => {
            console.error("Social login failed:", error);
            toast.error(error.response?.data?.message || "Social login failed");
        }
    });

    // Send Email OTP Mutation
    const { mutate: sendOtpMutation, isPending: isSendingOtp } = useMutation({
        mutationFn: sendEmailOtp,
        onSuccess: () => {
            setShowOtpInput(true);
            toast.success("OTP sent to your email!");
        },
        onError: (error) => {
            console.error("Send OTP failed:", error);
            toast.error(error.response?.data?.message || "Failed to send OTP");
        }
    });

    // Verify Email OTP Mutation
    const { mutate: verifyOtpMutation, isPending: isVerifyingOtp } = useMutation({
        mutationFn: verifyEmailOtp,
        onSuccess: (data) => {
            queryClient.setQueryData(["authUser"], data);
            queryClient.invalidateQueries({ queryKey: ["authUser"] });
            navigate("/");
            toast.success("Logged in successfully!");
        },
        onError: (error) => {
            console.error("Verify OTP failed:", error);
            toast.error(error.response?.data?.message || "Invalid OTP");
        }
    });

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();
            socialAuthMutation({ idToken, provider: "google" });
        } catch (error) {
            console.error("Firebase Login Error:", error);
            toast.error("Google Sign-In failed or was cancelled.");
        }
    };

    const handleSendOtp = () => {
        if (!emailOtpData.email) {
            toast.error("Please enter your email");
            return;
        }
        sendOtpMutation({ email: emailOtpData.email });
    };

    const handleVerifyOtp = () => {
        if (!emailOtpData.otp || emailOtpData.otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        verifyOtpMutation(emailOtpData);
    };

    const isAnyPending = isSocialPending || isSendingOtp || isVerifyingOtp;

    return (
        <div
            className="h-screen flex items-center justify-center p-4 sm:p-6 md:p-8"
            data-theme="forest"
        >
            <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden">
                {/* AUTH FORM SECTION */}
                <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col justify-center">
                    {/* LOGO */}
                    <div className="mb-6 flex items-center justify-center lg:justify-start gap-2">
                        <ShipWheelIcon className="size-10 text-primary" />
                        <span className="text-4xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                            Baat-Chit
                        </span>
                    </div>

                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="space-y-4">
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold">Welcome!</h2>
                                <p className="text-sm opacity-70 mt-2">
                                    Sign in to connect with language partners worldwide
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 mt-8">
                                {/* Google Login Button */}
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg w-full"
                                    onClick={handleGoogleLogin}
                                    disabled={isAnyPending}
                                >
                                    {isSocialPending ? (
                                        <span className="loading loading-spinner loading-md"></span>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" className="w-6 h-6 mr-2">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </button>

                                <div className="divider">OR</div>

                                {/* Email OTP Section */}
                                {!showOtpInput ? (
                                    <div className="form-control w-full space-y-3">
                                        <label className="label">
                                            <span className="label-text font-medium">Sign in with Email</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="email"
                                                placeholder="your@email.com"
                                                className="input input-bordered flex-1"
                                                value={emailOtpData.email}
                                                onChange={(e) => setEmailOtpData({ ...emailOtpData, email: e.target.value })}
                                                disabled={isAnyPending}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                onClick={handleSendOtp}
                                                disabled={isAnyPending}
                                            >
                                                {isSendingOtp ? (
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                ) : (
                                                    <>
                                                        <Mail className="w-5 h-5" />
                                                        Send Code
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs opacity-60">We'll send you a 6-digit verification code</p>
                                    </div>
                                ) : (
                                    <div className="form-control w-full space-y-3">
                                        <label className="label">
                                            <span className="label-text font-medium">Enter verification code</span>
                                            <span className="label-text-alt text-xs opacity-60">{emailOtpData.email}</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="000000"
                                                maxLength="6"
                                                className="input input-bordered flex-1 text-center text-2xl tracking-widest font-mono"
                                                value={emailOtpData.otp}
                                                onChange={(e) => setEmailOtpData({ ...emailOtpData, otp: e.target.value.replace(/\D/g, "") })}
                                                disabled={isAnyPending}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleVerifyOtp}
                                                disabled={isAnyPending}
                                            >
                                                {isVerifyingOtp ? (
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                ) : (
                                                    "Verify"
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <button
                                                type="button"
                                                className="link link-primary"
                                                onClick={() => {
                                                    setShowOtpInput(false);
                                                    setEmailOtpData({ email: "", otp: "" });
                                                }}
                                                disabled={isAnyPending}
                                            >
                                                ← Use different email
                                            </button>
                                            <button
                                                type="button"
                                                className="link link-secondary"
                                                onClick={handleSendOtp}
                                                disabled={isAnyPending}
                                            >
                                                Resend code
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 text-center text-xs opacity-60">
                                    <p>
                                        By continuing, you agree to our{" "}
                                        <span className="link link-primary">Terms of Service</span> and{" "}
                                        <span className="link link-primary">Privacy Policy</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* IMAGE SECTION */}
                <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
                    <div className="max-w-md p-8">
                        <div className="relative aspect-square max-w-sm mx-auto">
                            <img src="/i.png" alt="Language connection illustration" className="w-full h-full" />
                        </div>

                        <div className="text-center space-y-3 mt-6">
                            <h2 className="text-xl font-semibold">Connect with language partners worldwide</h2>
                            <p className="opacity-70">
                                Practice conversations, make friends, and improve your language skills together
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
