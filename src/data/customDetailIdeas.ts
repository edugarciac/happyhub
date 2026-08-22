import {
  GraduationCap,
  Award,
  Coffee,
  ShoppingBag,
  CupSoda,
  Shirt,
  Backpack,
  PawPrint,
  Droplet,
  type LucideIcon,
} from 'lucide-react';

export interface CustomDetailIdea {
  id: string;
  label: string;
  icon: LucideIcon;
  photoUrl?: string;
}

export const CUSTOM_DETAIL_IDEAS: CustomDetailIdea[] = [
  { id: 'gorras', label: 'Gorras', icon: GraduationCap },
  { id: 'chapas', label: 'Chapas', icon: Award },
  { id: 'tazas', label: 'Tazas', icon: Coffee },
  { id: 'bolsos', label: 'Bolsos', icon: ShoppingBag },
  { id: 'vasos', label: 'Vasos', icon: CupSoda },
  { id: 'camisetas', label: 'Camisetas', icon: Shirt },
  { id: 'bolsitas-neceser', label: 'Bolsitas neceser', icon: Backpack },
  { id: 'peluches', label: 'Peluches', icon: PawPrint },
  { id: 'botellas-agua', label: 'Botellas de agua', icon: Droplet },
];
