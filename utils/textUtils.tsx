
import React from 'react';

export const formatBodyText = (text: string | undefined) => {
    if (!text) return null;

    // Regex para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
            {line.split(' ').map((word, j) => {
                if (word.match(urlRegex)) {
                    return (
                        <a 
                            key={j} 
                            href={word} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sky-600 hover:underline break-all"
                            onClick={(e) => e.stopPropagation()} // Evitar abrir el post al hacer click
                        >
                            {word}{' '}
                        </a>
                    );
                }
                return word + ' ';
            })}
            <br />
        </React.Fragment>
    ));
};
