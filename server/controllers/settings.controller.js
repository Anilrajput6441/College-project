import User from "../models/User.js";
import bcrypt from "bcryptjs";

// GET /api/settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      id:         user._id,
      username:   user.username,
      email:      user.email,
      role:       user.role,
      createdAt:  user.createdAt,
      totalApplied: user.appliedJobs.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/settings/profile
// Editable: username, email
export const updateProfile = async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email)
    return res.status(400).json({ message: "Nothing to update" });

  try {
    // Check email uniqueness if changing
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (exists)
        return res.status(409).json({ message: "Email already in use by another account" });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { ...(username && { username }), ...(email && { email }) },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: { id: updated._id, username: updated.username, email: updated.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/settings/password
// Requires: currentPassword, newPassword
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Both current and new password are required" });

  if (newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters" });

  if (currentPassword === newPassword)
    return res.status(400).json({ message: "New password must be different from current password" });

  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/settings/account
// Requires: password confirmation
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ message: "Password is required to delete account" });

  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    await User.findByIdAndDelete(req.user.id);
    res.clearCookie("token");
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
