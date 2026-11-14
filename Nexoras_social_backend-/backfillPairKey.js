// One-off migration: backfill pairKey on existing direct conversations.
// Run once: node backfillPairKey.js
require("dotenv").config();
const mongoose = require("mongoose");
const Conversation = require("./models/Conversation");

(async () => {
  await mongoose.connect(process.env.DB_URL);
  const convs = await Conversation.find({ type: "direct", $or: [{ pairKey: null }, { pairKey: { $exists: false } }] });
  let updated = 0;
  for (const c of convs) {
    if (!Array.isArray(c.participants) || c.participants.length !== 2) continue;
    c.pairKey = c.participants.map((p) => p.toString()).sort().join(":");
    try {
      await c.save();
      updated++;
    } catch (e) {
      // skip duplicates
    }
  }
  console.log(`Backfilled ${updated}/${convs.length} conversations`);
  process.exit(0);
})();