import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import StarRating from "./StarRating";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReviewCardProps {
  review: {
    id: number;
    usuario: {
      id: number;
      username: string;
      nombre_completo: string;
    };
    comentario: string | null;
    puntuacion: number | null;
    fecha: string;
  };
  currentUserId?: number;
  onEdit?: (reviewId: number) => void;
  onDelete?: (reviewId: number) => void;
}

const ReviewCard = ({ review, currentUserId, onEdit, onDelete }: ReviewCardProps) => {
  const isOwner = currentUserId === review.usuario.id;
  const formattedDate = format(new Date(review.fecha), "d 'de' MMMM, yyyy", { locale: es });

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                {review.usuario.nombre_completo?.charAt(0).toUpperCase() || 
                 review.usuario.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {review.usuario.nombre_completo || review.usuario.username}
                </p>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              </div>
            </div>
            
            {review.puntuacion && (
              <div className="mb-2">
                <StarRating rating={review.puntuacion} readonly size="sm" />
              </div>
            )}
            
            {review.comentario && (
              <p className="text-sm text-foreground leading-relaxed">
                {review.comentario}
              </p>
            )}
          </div>
          
          {isOwner && (onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(review.id)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(review.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReviewCard;