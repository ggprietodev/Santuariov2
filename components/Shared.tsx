
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
