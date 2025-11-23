import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const ratingLabels: { [key: number]: string } = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente"
};

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = "md",
  showLabel = true
}: StarRatingProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={readonly}
            className={cn(
              "focus:outline-none transition-base",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                rating >= star
                  ? "fill-amber-500 text-amber-500"
                  : "text-muted-foreground"
              )}
            />
          </button>
        ))}
      </div>
      
      {showLabel && rating > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {rating}/5
          </span>
          <span className="text-sm text-muted-foreground">
            {ratingLabels[rating]}
          </span>
        </div>
      )}
    </div>
  );
};

export default StarRating;