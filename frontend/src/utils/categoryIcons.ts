
import { 
    Music, 
    Target, 
    GraduationCap, 
    Palette, 
    Gamepad2, 
    Plane, 
    UtensilsCrossed, 
    Drama, 
    Heart 
  } from "lucide-react";
  import { LucideIcon } from "lucide-react";
  
  export interface CategoryIcon {
    icon: LucideIcon;
    color: "primary" | "secondary" | "accent";
  }
  
  export const categoryIconMap: Record<string, CategoryIcon> = {
    "Música": { icon: Music, color: "primary" },
    "Deporte": { icon: Target, color: "secondary" },
    "Educación": { icon: GraduationCap, color: "accent" },
    "Cultural": { icon: Palette, color: "primary" },
    "Aficiones": { icon: Gamepad2, color: "accent" },
    "Vacaciones": { icon: Plane, color: "primary" },
    "Gastronomía": { icon: UtensilsCrossed, color: "secondary" },
    "Artes Escénicas": { icon: Drama, color: "accent" },
    "Citas": { icon: Heart, color: "secondary" },
  };
  
  export const getCategoryIcon = (categoryName: string): CategoryIcon => {
    return categoryIconMap[categoryName] || { icon: Music, color: "primary" };
  };