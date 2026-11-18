/*!
 * Agent Squire AI disclaimer
 * A short summary of the risks of using AI in a webui-quote, shown in the footer of every page, with a link to the full page as its cite.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const SUMMARY = 'AI assistants can be wrong while sounding certain, and can make up facts, sources, and quotes. '
        + 'What you type may be stored, read by people, or used to train them, so keep passwords and private, financial, health, and work information out. '
        + 'AI can repeat biases, be tricked by hidden instructions in web pages, emails, and files, and take actions you didn\'t intend when it\'s connected to your accounts. '
        + 'Check important answers with a trusted source, and don\'t rely on AI alone for medical, legal, financial, or safety decisions. '
        + 'The guides and tools on this site are general information, not professional advice.';
    const CITE = '<a href="/ai-risks" style="color:var(--color-link);text-underline-offset:0.18em">More information about AI risks</a>';

    webui.define('app-ai-disclaimer', {
        preload: 'quote',
        connected() {
            const t = this;
            t.setAttribute('role', 'note');
            t.setAttribute('aria-label', 'About the risks of AI');
            Object.assign(t.style, {
                display: 'block',
                margin: 'calc(2 * var(--padding)) 0 0',
                fontSize: '0.875em',
            });
            // The cite is rendered in the quote's shadow DOM, where page link styles don't reach, so the link sets its own color.
            const quote = webui.create('webui-quote', { theme: 'tertiary', cite: CITE });
            quote.append(webui.create('p', { text: SUMMARY }));
            t.replaceChildren(quote);
        },
    });
}
