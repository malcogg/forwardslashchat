"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Lock, Globe, Sparkles, Layout, Plus } from "lucide-react";

export type MobileSheetPanel = "design" | "domains" | "preview";

type OrderItem = {
  orderId: string;
  label: string;
  isWebsite?: boolean;
};

type DashboardMobileSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelectPanel: (panel: MobileSheetPanel) => void;
  onSelectOrder: (orderId: string) => void;
  onScanNewSite: () => void;
  orders: OrderItem[];
  activePanel: MobileSheetPanel | "design" | "domains";
  contentCount: number;
  domainDone: boolean;
  domainLocked: boolean;
  currentOrderId: string | null;
};

export function DashboardMobileSheet({
  open,
  onClose,
  onSelectPanel,
  onSelectOrder,
  onScanNewSite,
  orders,
  activePanel,
  contentCount,
  domainDone,
  domainLocked,
  currentOrderId,
}: DashboardMobileSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = (panel: MobileSheetPanel) => {
    onSelectPanel(panel);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-0 right-0 bottom-0 z-50 md:hidden bg-background border-t border-border rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard menu"
          >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Menu</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            type="button"
            onClick={() => handleSelect("design")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-muted/80 active:bg-muted transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {contentCount > 0 ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-muted-foreground" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground block">Training</span>
              <span className="text-xs text-muted-foreground">
                {contentCount > 0 ? "Content ready" : "Build your chatbot"}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => handleSelect("domains")}
            disabled={domainLocked}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
              domainLocked ? "opacity-60" : "hover:bg-muted/80 active:bg-muted"
            }`}
          >
            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              {domainDone ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : domainLocked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground block">Domain</span>
              <span className="text-xs text-muted-foreground">
                {domainLocked ? "Complete Training first" : domainDone ? "Live" : "Add CNAME to go live"}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => handleSelect("preview")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-muted/80 active:bg-muted transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Layout className="w-4 h-4 text-muted-foreground" />
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground block">Chat preview</span>
              <span className="text-xs text-muted-foreground">See your chatbot</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          <div className="pt-4 mt-4 border-t border-border">
            <p className="px-4 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Your sites
            </p>
            {orders.map(({ orderId, label }) => (
              <button
                key={orderId}
                type="button"
                onClick={() => {
                  onSelectOrder(orderId);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-muted/80 active:bg-muted transition-colors ${
                  currentOrderId === orderId ? "bg-muted/50" : ""
                }`}
              >
                <span className="flex-1 min-w-0 truncate text-sm text-foreground">{label}</span>
                {currentOrderId === orderId && (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onScanNewSite();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-muted/80 active:bg-muted transition-colors text-primary"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="font-medium">Scan new site</span>
            </button>
          </div>
        </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
