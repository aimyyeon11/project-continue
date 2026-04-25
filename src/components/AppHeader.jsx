import { Bell, Settings } from "lucide-react";
import AppLogo from "@/components/AppLogo.jsx";
import { useTranslation } from "@/hooks/useTranslation.js";

/**
 * @param {{ businessName: string; onOpenSettings: () => void; showNotificationDot?: boolean }} props
 */
export default function AppHeader({ businessName, onOpenSettings, showNotificationDot }) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-2 min-w-0">
        <AppLogo size="sm" />
        <span className="font-bold text-sm truncate text-foreground">{businessName || t("businessPlaceholder")}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" className="tap relative w-10 h-10 rounded-full grid place-items-center text-muted-foreground hover:bg-muted" aria-label={t("notifications")}>
          <Bell className="w-5 h-5" />
          {showNotificationDot ? <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cost" /> : null}
        </button>
        <button type="button" onClick={onOpenSettings} className="tap w-10 h-10 rounded-full grid place-items-center text-muted-foreground hover:bg-muted" aria-label={t("settings")}>
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
