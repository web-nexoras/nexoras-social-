import React, { useEffect, useState } from "react";
import { notificationsApi } from "@features/notifications";
import { useToast } from "@shared";
import { useSocket } from "@features/chat/context/SocketContext";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheck, FiArrowRight } from "react-icons/fi";
import { Skeleton } from "@shared";
import { getNotificationTarget } from "@features/notifications";

export default function Notifications() {
  const { showToast } = useToast();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unread, setUnread] = useState(0);

  const load = async (pageNum = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await notificationsApi.list(pageNum);
      const list = res.data?.notifications || [];
      setNotifications((prev) => (pageNum === 1 ? list : [...prev, ...list]));
      if (pageNum === 1) setUnread(res.data?.unreadCount || 0);
      setHasMore(list.length >= 10);
      setPage(pageNum);
    } catch {
      showToast("Failed to load notifications", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      setNotifications((prev) => [n, ...prev]);
      setUnread((c) => c + 1);
      showToast(n?.title || "New notification", "info");
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket]);

  const markRead = async (n) => {
    try {
      await notificationsApi.markRead(n._id);
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      setUnread(0);
      showToast("All marked as read", "success");
    } catch {}
  };

  // A notification is an entry point, not just a status badge: mark it read
  // and open the screen it belongs to (post, chat, friend requests, ...).
  const openNotification = (n) => {
    if (!n.read) markRead(n);
    const target = getNotificationTarget(n);
    if (target) navigate(target);
  };

  const handleKeyDown = (e, n) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openNotification(n);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand flex items-center gap-2">
          <FiBell /> Notifications{" "}
          {unread > 0 && (
            <span className="text-sm bg-red-500 text-white rounded-full px-2">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="text-sm text-brand hover:underline flex items-center gap-1 font-semibold"
          >
            <FiCheck /> Mark all read
          </button>
        )}
      </div>

      {loading && notifications.length === 0 && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" count={5} />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <p className="text-slate-500 text-sm">No notifications yet</p>
      )}

      <div className="space-y-2">
        {notifications.map((n) => {
          const target = getNotificationTarget(n);
          return (
            <div
              key={n._id}
              role="button"
              tabIndex={0}
              onClick={() => openNotification(n)}
              onKeyDown={(e) => handleKeyDown(e, n)}
              className={`bg-white rounded-xl shadow p-4 cursor-pointer transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                n.read ? "opacity-75" : "ring-2 ring-brand/30 font-medium"
              }`}
            >
              <p className="font-semibold text-slate-800">{n.title}</p>
              <p className="text-sm text-slate-600 mt-0.5">{n.body}</p>
              <div className="flex items-center justify-between gap-3 mt-2">
                <p className="text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
                {target && (
                  <span className="text-xs text-brand font-semibold flex items-center gap-1 shrink-0">
                    Open <FiArrowRight />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite load pagination */}
      {hasMore && notifications.length > 0 && (
        <div className="pt-6 pb-2 text-center">
          <button
            onClick={() => load(page + 1)}
            disabled={loadingMore}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
          >
            {loadingMore ? "Loading more..." : "Load Older Notifications"}
          </button>
        </div>
      )}
    </div>
  );
}
