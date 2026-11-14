const cron = require("node-cron");
const Subscription = require("../models/Subscription");
const GroupMembership = require("../models/GroupMembership");

const runExpiryJob = async () => {
  try {
    const expired = await Subscription.find({
      status: "active",
      expiresAt: { $lt: new Date() },
    });

    for (const sub of expired) {
      sub.status = "expired";
      await sub.save();
      await GroupMembership.deleteOne({ user: sub.user, group: sub.group });
    }

    if (expired.length) {
      console.log(`Expiry job: revoked ${expired.length} subscription(s)`);
    }
  } catch (error) {
    console.error("Expiry job error:", error.message);
  }
};

const scheduleExpiryJob = () => {
  // Run once on startup
  runExpiryJob();
  // Run daily at 00:00
  cron.schedule("0 0 * * *", runExpiryJob);
};

module.exports = { runExpiryJob, scheduleExpiryJob };
