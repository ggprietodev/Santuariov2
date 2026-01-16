
import React from 'react';

export const formatBodyText = (text: string | undefined, onMentionClick?: (username: string) => void) => {
    if (!text) return null;

    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    // Regex para detectar menciones (@username) - asume caracteres alfanuméricos
    const mentionRegex = /@(\w+)/g;

    return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {line.split(' ').map((word, j) => {
                // 1. Check for URL
                if (word.match(urlRegex)) {
                    return (
                        <React.Fragment key={j}>
                            <a 
                                href={word} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sky-600 hover:underline break-all relative z-20"
                                onClick={(e) => e.stopPropagation()} 
                            >
                                {word}
                            </a>{' '}
                        </React.Fragment>
                    );
                }
                
                // 2. Check for Mention
                // Limpiamos signos de puntuación pegados al final para el match (ej: "@usuario.")
                const cleanWord = word.replace(/[.,!?;:]$/, '');
                const punctuation = word.slice(cleanWord.length);

                if (cleanWord.match(mentionRegex) && cleanWord.startsWith('@')) {
                    const username = cleanWord.substring(1); // Remove @
                    return (
                        <React.Fragment key={j}>
                            <button
                                className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer relative z-20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onMentionClick) onMentionClick(username);
                                }}
                            >
                                {cleanWord}
                            </button>
                            {punctuation}{' '}
                        </React.Fragment>
                    );
                }

                // 3. Plain Text
                return word + ' ';
            })}
            <br />
        </React.Fragment>
    ));
};
