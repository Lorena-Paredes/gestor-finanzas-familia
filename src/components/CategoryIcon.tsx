import React from 'react';
import {
  Tractor,
  HeartHandshake,
  CreditCard,
  Footprints,
  Home,
  Car,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { CostCenterType } from '../types/finance';

export function CategoryIcon({
  category,
  size = 'md',
}: {
  category: CostCenterType | 'inversiones' | string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4.5 h-4.5';

  switch (category) {
    case 'campo':
      return (
        <div className={`${sizeClass} rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/25`}>
          <Tractor className={iconSize} />
        </div>
      );
    case 'mama':
      return (
        <div className={`${sizeClass} rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/25`}>
          <HeartHandshake className={iconSize} />
        </div>
      );
    case 'tarjetas':
      return (
        <div className={`${sizeClass} rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/25`}>
          <CreditCard className={iconSize} />
        </div>
      );
    case 'inversiones':
      return (
        <div className={`${sizeClass} rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25`}>
          <TrendingUp className={iconSize} />
        </div>
      );
    case 'renato':
      return (
        <div className={`${sizeClass} rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/25`}>
          <Footprints className={iconSize} />
        </div>
      );
    case 'movilidad':
    case 'vehiculo':
      return (
        <div className={`${sizeClass} rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-600/25`}>
          <Car className={iconSize} />
        </div>
      );
    case 'lorena':
      return (
        <div className={`${sizeClass} rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/25`}>
          <Sparkles className={iconSize} />
        </div>
      );
    case 'almacen':
      return (
        <div className={`${sizeClass} rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/25`}>
          <ShoppingBag className={iconSize} />
        </div>
      );
    case 'hogar':
      return (
        <div className={`${sizeClass} rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/25`}>
          <Home className={iconSize} />
        </div>
      );
    default:
      return (
        <div className={`${sizeClass} rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0`}>
          <Layers className={iconSize} />
        </div>
      );
  }
}
