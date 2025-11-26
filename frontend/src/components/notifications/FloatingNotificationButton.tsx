import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "./NotificationDropdown";

const FloatingNotificationButton = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <NotificationDropdown>
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary text-primary-foreground hover:bg-primary/90 relative"
          aria-label="Notificaciones"
        >
          <Bell className="h-6 w-6" />
        </Button>
      </NotificationDropdown>
    </div>
  );
};

export default FloatingNotificationButton;

