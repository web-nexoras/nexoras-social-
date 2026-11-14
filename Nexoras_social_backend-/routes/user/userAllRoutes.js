const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../../middlewre/authMiddleware");
const { checkActive } = require("../../middlewre/checkActive");
const { adminOnly } = require("../../middlewre/adminOnly");

const { getAllUsers } = require("../../controller/user/getAllUsers");
const { getUserById } = require("../../controller/user/getUserById");
const { getAdmins } = require("../../controller/user/getAdmins");
const { searchUsers } = require("../../controller/user/searchUsers");
const { approveUser } = require("../../controller/user/approveUser");
const { rejectUser } = require("../../controller/user/rejectUser");
const { toggleActive } = require("../../controller/user/toggleActive");
const { deleteUser } = require("../../controller/user/deleteUser");
const { createUser } = require("../../controller/user/createUser");
const { updateUser } = require("../../controller/user/updateUser");

router.use(authMiddleware, checkActive);

// Authenticated: get admins list (for users to chat with admin)
// NOTE: must be declared before "/:id" so "admins" isn't captured as an id
router.get("/admins", getAdmins);

// Authenticated: live user search by name/email
router.get("/search", searchUsers);

// Self or admin can view a user
router.get("/:id", getUserById);

// Admin-only routes
router.get("/", adminOnly, getAllUsers);
// Admin: add a user directly (bypasses OTP + approval — instant account)
router.post("/", adminOnly, createUser);
router.patch("/:id/approve", adminOnly, approveUser);
router.patch("/:id/reject", adminOnly, rejectUser);
router.patch("/:id/toggle-active", adminOnly, toggleActive);
// Admin: edit any user's details (name, email, role, approval, active)
router.patch("/:id", adminOnly, updateUser);
router.delete("/:id", adminOnly, deleteUser);

module.exports = router;
