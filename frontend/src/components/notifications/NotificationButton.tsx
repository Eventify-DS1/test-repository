import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationDropdown from "./NotificationDropdown";

interface NotificationButtonProps {
  variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const NotificationButton = ({
  variant = "ghost",
  size = "icon",
  className,
}: NotificationButtonProps) => {
  return (
    <NotificationDropdown>
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
      </Button>
    </NotificationDropdown>
  );
};

export default NotificationButton;

