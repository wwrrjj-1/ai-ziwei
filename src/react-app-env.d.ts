// Global type declarations for third‑party modules used in the project

declare module 'react-markdown' {
    import * as React from 'react';
    interface ReactMarkdownProps {
        children?: string;
        remarkPlugins?: any[];
        // Allow any additional props that ReactMarkdown may accept
        [key: string]: any;
    }
    const ReactMarkdown: React.FC<ReactMarkdownProps>;
    export default ReactMarkdown;
}

declare module 'remark-gfm';
