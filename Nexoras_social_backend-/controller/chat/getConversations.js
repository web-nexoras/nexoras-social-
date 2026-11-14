const Conversation = require("../../models/Conversation");
const Message = require("../../models/Message");

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "fullname email avatar role")
      .sort({ lastMessageAt: -1 })
      .lean();

    // One aggregation fetches the last message of every conversation (no N+1)
    const lastMessages = await Message.aggregate([
      { $match: { conversation: { $in: conversations.map((c) => c._id) } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$conversation", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      {
        $lookup: {
          from: "users",
          localField: "sender",
          foreignField: "_id",
          as: "sender",
          pipeline: [{ $project: { fullname: 1, avatar: 1 } }],
        },
      },
      { $unwind: { path: "$sender", preserveNullAndEmptyArrays: true } },
    ]);
    const lastByConv = new Map(lastMessages.map((m) => [String(m.conversation), m]));

    // Unread = messages from other people that this user has not read yet.
    // One aggregation for the whole list (no N+1).
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversation: { $in: conversations.map((c) => c._id) },
          sender: { $ne: userId },
          readBy: { $ne: userId },
        },
      },
      { $group: { _id: "$conversation", count: { $sum: 1 } } },
    ]);
    const unreadByConv = new Map(unreadAgg.map((u) => [String(u._id), u.count]));

    const result = conversations.map((conv) => ({
      ...conv,
      lastMessage: lastByConv.get(String(conv._id)) || null,
      unreadCount: unreadByConv.get(String(conv._id)) || 0,
    }));

    return res.status(200).json({ success: true, count: result.length, conversations: result });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getConversations };
