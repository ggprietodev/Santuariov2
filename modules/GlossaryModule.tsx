
import React, { useState } from 'react';
import { GlossaryTerm } from '../types';
import { definePhilosophicalTerm } from '../services/geminiService';

export function GlossaryModule({ onBack, terms, onNavigateToSchool, onNavigateToPhilosopher }: { 
    onBack: () => void, 
    terms: GlossaryTerm[], 
    onNavigateToSchool: (schoolName: string) => void,
    onNavigateToPhilosopher: (authorName: string) => void
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [aiDefinition, setAiDefinition] = useState<GlossaryTerm | null>(null);
    const [isDefining, setIsDefining] = useState(false);

    const filteredTerms = terms.filter(t => 
        t.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRelatedClick = (type: 'school' | 'author', value: string) => {
        if(type === 'school') onNavigateToSchool(value);
        if(type === 'author') onNavigateToPhilosopher(value);
    }

    const handleDefineWithAI = async () => {
        if (!searchTerm.trim()) return;
        setIsDefining(true);
        const result = await definePhilosophicalTerm(searchTerm);
        if (result) setAiDefinition(result);
        setIsDefining(false);
    }

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--bg)] items-center">
             <div className="w-full max-w-2xl flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center shadow-sm active:scale-95 transition-transform"><i className="ph-bold ph-arrow-left"></i></button>
                    <h2 className="serif text-2xl font-bold">Léxico</h2>
                </div>
            </div>

            <div className="w-full max-w-2xl px-6 mb-6">
                <div className="bg-[var(--card)] p-3 rounded-2xl flex items-center gap-3 border border-[var(--border)] shadow-sm">
                    <i className="ph-bold ph-magnifying-glass opacity-40 ml-1"></i>
                    <input 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setAiDefinition(null); }}
                        placeholder="Buscar concepto..." 
                        className="bg-transparent outline-none w-full text-sm font-serif"
                    />
                    {searchTerm && <button onClick={() => { setSearchTerm(""); setAiDefinition(null); }}><i className="ph-bold ph-x opacity-40 hover:opacity-100"></i></button>}
                </div>
            </div>

            <div className="w-full max-w-2xl flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                <div className="grid gap-4">
                    {/* Local Results */}
                    {filteredTerms.map((item, i) => (
                        <div key={i} className="bg-[var(--card)] p-6 rounded-[24px] border border-[var(--border)] shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="serif font-bold text-xl text-[var(--text-main)]">{item.term}</h3>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 bg-[var(--highlight)] px-2 py-1 rounded-full">{item.origin}</span>
                            </div>
                            <p className="serif-text text-sm opacity-80 leading-relaxed mb-3">{item.definition}</p>
                            <div className="pl-3 border-l-2 border-[var(--gold)]/30 mb-3">
                                <p className="text-xs italic opacity-60">"{item.example}"</p>
                            </div>
                            
                            {/* Connections */}
                            {(item.related_school || item.related_author) && (
                                <div className="flex gap-2 mt-4 border-t border-[var(--border)] pt-3">
                                    {item.related_school && (
                                        <button 
                                            onClick={() => handleRelatedClick('school', item.related_school!)}
                                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--highlight)] flex items-center gap-1 transition-colors"
                                        >
                                            <i className="ph-bold ph-columns text-[var(--gold)]"></i> {item.related_school}
                                        </button>
                                    )}
                                    {item.related_author && (
                                        <button 
                                            onClick={() => handleRelatedClick('author', item.related_author!)}
                                            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border border-[var(--border)] hover:bg-[var(--highlight)] flex items-center gap-1 transition-colors"
                                        >
                                            <i className="ph-bold ph-student text-[var(--gold)]"></i> {item.related_author}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* AI Generated Result */}
                    {aiDefinition && (
                        <div className="bg-[#FAF5FF] dark:bg-[#1E1024] p-6 rounded-[24px] border border-purple-200 dark:border-purple-800 shadow-sm animate-fade-in">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="serif font-bold text-xl text-purple-900 dark:text-purple-100">{aiDefinition.term}</h3>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded-full text-purple-700 dark:text-purple-300">{aiDefinition.origin}</span>
                            </div>
                            <p className="serif-text text-sm opacity-90 leading-relaxed mb-3 text-purple-800 dark:text-purple-200">{aiDefinition.definition}</p>
                            <div className="pl-3 border-l-2 border-purple-400/50 mb-3">
                                <p className="text-xs italic opacity-70 text-purple-800 dark:text-purple-300">"{aiDefinition.example}"</p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    <i className="ph-fill ph-sparkle"></i> Oráculo Digital
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {filteredTerms.length === 0 && !aiDefinition && searchTerm && (
                    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                        <i className="ph-duotone ph-book-open-text text-4xl mb-3 opacity-30"></i>
                        <p className="text-sm opacity-50 mb-6 italic font-serif">El término no está en el archivo.</p>
                        <button 
                            onClick={handleDefineWithAI}
                            disabled={isDefining}
                            className="flex items-center gap-2 px-6 py-3 bg-[var(--text-main)] text-[var(--bg)] rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                        >
                            {isDefining ? <><i className="ph-duotone ph-spinner animate-spin"></i> Consultando...</> : <><i className="ph-bold ph-sparkle"></i> Consultar al Oráculo</>}
                        </button>
                    </div>
                )}
                
                {filteredTerms.length === 0 && !searchTerm && (
                    <div className="text-center py-20 opacity-30 italic font-serif">
                        {terms.length === 0 ? "Cargando conocimiento..." : "Explora el léxico."}
                    </div>
                )}
            </div>
        </div>
    );
}
