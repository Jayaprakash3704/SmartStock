import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Eye } from 'lucide-react';
import { useNotifications } from '../../hooks/useDashboard';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAllAsRead, markAsRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    notifications.forEach((n) => {
      const key = n.category;
      groups[key] = groups[key] || [];
      groups[key].push(n);
    });
    return groups;
  }, [notifications]);

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-accent/30 transition-all duration-200"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-[10px] rounded-full bg-destructive text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 mt-2 w-96 max-w-[90vw] z-50"
       >
          {/* Solid (non-transparent) panel */}
          <div className="rounded-xl border border-border/60 shadow-xl bg-card overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border/60">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground px-2 py-1 rounded-md hover:bg-accent/20"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
                <button
                  className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground px-2 py-1 rounded-md hover:bg-destructive/10"
                  onClick={clearAll}
                >
                  <Trash2 size={14} /> Clear
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-auto">
              {notifications.length === 0 && (
                <div className="p-6 text-sm text-muted text-center">No notifications</div>
              )}

              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-3 py-1 text-[11px] uppercase tracking-wider text-muted border-b border-border/40 bg-card">
                    {category}
                  </div>

                  {items.map((n) => (
                    <motion.button
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      initial={false}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-3 py-3 flex items-start gap-3 border-b border-border/40 transition-colors ${n.read ? 'opacity-70' : 'bg-accent/5 hover:bg-accent/15'} relative overflow-hidden`}
                    >
                      {/* vibrant click flash */}
                      <motion.span
                        className="absolute inset-0 bg-primary/15"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0 }}
                        whileTap={{ opacity: 0.3 }}
                        transition={{ duration: 0.18 }}
                      />

                      <div className={`relative z-10 w-2 h-2 mt-2 rounded-full ${n.read ? 'bg-border' : 'bg-primary'}`} />
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{n.title}</div>
                        <div className="text-xs text-muted truncate">{n.message}</div>
                        <div className="text-[10px] text-muted mt-1">
                          {new Date(n.timestamp).toLocaleString('en-IN')}
                        </div>
                      </div>
                      {!n.read && (
                        <span className="relative z-10 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                          <Eye size={12} /> View
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NotificationBell;
