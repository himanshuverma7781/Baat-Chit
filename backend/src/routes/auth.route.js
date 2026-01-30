import express from 'express';
import { login, logout, onboard, signup, deactivateAccount, deleteAccount, socialLogin, sendEmailOtp, verifyEmailOtp } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

router.post("/onboarding", protectRoute, onboard);
router.post("/social-login", socialLogin);

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

router.put("/deactivate", protectRoute, deactivateAccount);
router.delete("/delete", protectRoute, deleteAccount);


//check if user is logged in
router.get("/me", protectRoute, (req, res) => {
    res.status(200).json({ success: true, user: req.user });
});

export default router;
