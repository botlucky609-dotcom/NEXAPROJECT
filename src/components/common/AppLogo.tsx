import React from 'react';
import { 
  Ship, 
  Anchor, 
  Shield, 
  Cog, 
  Building2, 
  Layers 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 'md', 
  showWordmark = false,
  className = '' 
}) => {
  const { appSettings } = useTheme();
  const { appName, appSubtitle, appLogo, colorTheme } = appSettings;

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-2xl',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  const shapeClass = 
    appLogo.shape === 'circle' ? 'rounded-full' :
    appLogo.shape === 'square' ? 'rounded-md' : 'rounded-xl';

  const renderIcon = () => {
    switch (appLogo.presetIcon) {
      case 'anchor': return <Anchor className={iconSizes[size]} />;
      case 'crane': return <Layers className={iconSizes[size]} />;
      case 'shield': return <Shield className={iconSizes[size]} />;
      case 'gear': return <Cog className={iconSizes[size]} />;
      case 'building': return <Building2 className={iconSizes[size]} />;
      case 'ship':
      default:
        return <Ship className={iconSizes[size]} />;
    }
  };

  const initial = (appName && appName.trim().length > 0) ? appName.trim().charAt(0).toUpperCase() : 'N';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${shapeClass} flex items-center justify-center font-black tracking-wider text-white shadow-xs shrink-0 overflow-hidden transition-all`}
        style={{ backgroundColor: colorTheme.primaryHex }}
      >
        {appLogo.type === 'custom' && appLogo.customUrl ? (
          <img 
            src={appLogo.customUrl} 
            alt={appName} 
            className="w-full h-full object-cover" 
          />
        ) : appLogo.type === 'initial' ? (
          <span>{initial}</span>
        ) : (
          renderIcon()
        )}
      </div>

      {showWordmark && (
        <div className="flex flex-col overflow-hidden text-left">
          <span className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
            {appName}
          </span>
          {appSubtitle && (
            <span 
              className="text-[10px] font-bold uppercase tracking-wider mt-1 truncate"
              style={{ color: colorTheme.primaryHex }}
            >
              {appSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
