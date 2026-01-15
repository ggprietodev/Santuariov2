
import React from 'react';

export const MoodIcon: React.FC<{ m: number, active: boolean, onClick?: () => void }> = ({ m, active, onClick }) => {
    const icons = ["", "ph-cloud-lightning", "ph-waves", "ph-minus", "ph-sun", "ph-star-four"];
    const labels = ["", "Caos", "Duda", "Paz", "Claridad", "Areté"];
    const isInteractive = !!onClick;
    
    return (
        <div onClick={onClick} className={`flex flex-col items-center gap-2 transition-all duration-300 group ${isInteractive ? 'cursor-pointer' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${active ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-offset-[var(--card)]' : 'opacity-40 grayscale bg-[var(--highlight)]'} ${isInteractive && !active ? 'hover:opacity-100' : ''}`}
                style={{ backgroundColor: active ? `var(--mood-${m})` : 'var(--highlight)', color: 'var(--text-main)', '--tw-ring-color': `var(--mood-${m})` } as React.CSSProperties}>
                <i className={`ph-fill ${icons[m]} text-2xl`}></i>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity mt-1 ${active ? 'opacity-100' : 'opacity-0'}`}>{labels[m]}</span>
        </div>
    );
};

export const NavBtn = ({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? 'bg-[var(--text-main)] text-[var(--bg)] shadow-md translate-y-[-4px]' : 'text-[var(--text-sub)] hover:bg-[var(--highlight)]'}`}>
        <i className={`ph-${active ? 'fill' : 'bold'} ph-${icon} text-xl mb-0.5`}></i>
    </button>
);

// NEW: Standardized Avatar Component
export const UserAvatar = ({ name, avatarUrl, size = 'md', className = '' }: { name: string, avatarUrl?: string, size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl', className?: string }) => {
    const s = {
        sm: 'w-6 h-6 text-[10px]',
        md: 'w-9 h-9 text-xs',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-20 h-20 text-3xl',
        xxl: 'w-32 h-32 text-5xl'
    }[size];

    const safeName = name || 'Estudiante';
    
    // Logic to handle different avatar types
    let content;
    
    if (avatarUrl && avatarUrl.startsWith('http')) {
        // Image URL
        content = <img src={avatarUrl} alt={safeName} className="w-full h-full object-cover" />;
    } else if (avatarUrl && avatarUrl.includes('|')) {
        // Icon with Color (format: "ph-icon|text-color")
        const [icon, colorClass] = avatarUrl.split('|');
        // Extract just the color part if it has bg/text prefix, or assume it's a full tailwind class
        // We render the icon centered
        content = (
            <div className={`w-full h-full flex items-center justify-center bg-[var(--card)] ${colorClass.includes('bg-') ? '' : 'text-[var(--text-main)]'}`}>
                <i className={`ph-fill ${icon} ${colorClass.replace('bg-', 'text-').replace('text-', 'text-')}`}></i>
            </div>
        );
    } else {
        // Fallback: Initial
        const charCode = safeName.charCodeAt(0);
        const colors = ['bg-stone-100 text-stone-600', 'bg-orange-100 text-orange-600', 'bg-amber-100 text-amber-600', 'bg-emerald-100 text-emerald-600', 'bg-sky-100 text-sky-600', 'bg-purple-100 text-purple-600'];
        const colorClass = colors[charCode % colors.length];
        
        content = (
            <div className={`w-full h-full flex items-center justify-center font-bold ${colorClass}`}>
                {safeName[0].toUpperCase()}
            </div>
        );
    }

    return (
        <div className={`${s} rounded-full overflow-hidden border border-[var(--border)] shadow-sm flex-shrink-0 relative ${className}`}>
            {content}
        </div>
    );
};
