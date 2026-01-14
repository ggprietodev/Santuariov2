
import JSZip from 'jszip';

const MAX_CHARS = 100000; // Limit for AI context

export const extractTextFromFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'txt') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                resolve(text.substring(0, MAX_CHARS));
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    if (extension === 'epub') {
        return processEpub(file);
    }

    throw new Error("Formato no soportado. Usa .txt o .epub");
};

const processEpub = async (file: File): Promise<string> => {
    try {
        const zip = await JSZip.loadAsync(file);
        let fullText = "";
        
        // Find text files inside epub (usually xhtml or html)
        // We prioritize the main content, but for simplicity, we'll iterate readable files
        const fileNames = Object.keys(zip.files).filter(name => 
            name.endsWith('.xhtml') || name.endsWith('.html') || name.endsWith('.xml')
        );

        // Sort implies reading order usually (OPS/chapter1, OPS/chapter2...)
        fileNames.sort();

        for (const fileName of fileNames) {
            if (fullText.length >= MAX_CHARS) break;
            
            const content = await zip.files[fileName].async("string");
            const cleanText = stripHtml(content);
            
            // Basic heuristic to avoid garbage files (toc.ncx, etc)
            if(cleanText.length > 50) {
                fullText += cleanText + "\n\n";
            }
        }

        return fullText.substring(0, MAX_CHARS);
    } catch (e) {
        console.error("EPUB Error", e);
        throw new Error("Error al leer EPUB. Puede estar dañado o encriptado.");
    }
};

const stripHtml = (html: string) => {
    // 1. Remove scripts and styles
    let text = html.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
    text = text.replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, "");
    // 2. Remove tags
    text = text.replace(/<\/?[^>]+(>|$)/g, " ");
    // 3. Decode entities (basic)
    text = text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    // 4. Collapse whitespace
    return text.replace(/\s+/g, " ").trim();
};
