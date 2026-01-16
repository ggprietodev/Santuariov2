
import React from 'react';

export const MoodIcon: React.FC<{ m: number, active: boolean, onClick?: () => void }> = ({ m, active, onClick }) => {
    const icons = ["", "ph-cloud-lightning", "ph-waves", "ph-minus", "ph-sun", "ph-star-four"];
    const labels = ["", "Caos", "Duda", "Paz", "Claridad", "Areté"];
    const isInteractive = !!onClick;
    
    // Mood Styles Configuration - Muted & Elegant Palette (Soft rings, no hard borders)
    const getMoodStyle = (mood: number, isActive: boolean) => {
        if (mood === 1) { // Fatal - Rose (Suave)
            return isActive 
                ? 'bg-rose-500 text-white ring-4 ring-rose-500/20' 
                : 'bg-rose-500/20 text-rose-600 border border-rose-200/50 dark:border-rose-900/30';
        }
        if (mood === 2) { // Mal - Amber (Cálido)
            return isActive 
                ? 'bg-amber-500 text-white ring-4 ring-amber-500/20' 
                : 'bg-amber-500/20 text-amber-600 border border-amber-200/50 dark:border-amber-900/30';
        }
        if (mood === 3) { // Normal - Stone (Neutro)
            return isActive 
                ? 'bg-stone-500 text-white ring-4 ring-stone-500/20' 
                : 'bg-stone-400/20 text-stone-600 border border-stone-200/50 dark:border-stone-800';
        }
        if (mood === 4) { // Bien - Sky (Sereno)
            return isActive 
                ? 'bg-sky-500 text-white ring-4 ring-sky-500/20' 
                : 'bg-sky-500/20 text-sky-600 border border-sky-200/50 dark:border-sky-800';
        }
        if (mood === 5) { // Radical - Teal (Elegante)
            return isActive 
                ? 'bg-teal-500 text-white ring-4 ring-teal-500/20' 
                : 'bg-teal-500/20 text-teal-600 border border-teal-200/50 dark:border-teal-800';
        }
        return 'bg-[var(--highlight)] text-[var(--text-sub)]';
    };

    const styleClass = getMoodStyle(m, active);

    return (
        <div onClick={onClick} className={`flex flex-col items-center gap-2 transition-all duration-300 group ${isInteractive ? 'cursor-pointer' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${active ? 'scale-110 shadow-md' : 'opacity-90 hover:opacity-100 hover:scale-105'} ${styleClass}`}>
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
    let content;
    
    if (avatarUrl && avatarUrl.startsWith('http')) {
        // Image URL
        content = <img src={avatarUrl} alt={safeName} className="w-full h-full object-cover" />;
    } else if (avatarUrl && (avatarUrl.includes('|') || avatarUrl.startsWith('ph-'))) {
        // Icon with Color (format: "ph-icon|text-color bg-color..." or "ph-icon")
        const parts = avatarUrl.split('|');
        const icon = parts[0].trim();
        const colorClass = parts[1] ? parts[1].trim() : 'text-[var(--text-sub)] bg-[var(--highlight)]';
        
        // Ensure background class is present if relying on Tailwind classes
        const containerClass = colorClass.includes('bg-') ? colorClass : `bg-[var(--card)] ${colorClass}`;
        
        content = (
            <div className={`w-full h-full flex items-center justify-center ${containerClass}`}>
                <i className={`ph-fill ${icon}`}></i>
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
