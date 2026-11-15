/*!
 * Agent Squire Instructions Builder
 * Asks a few plain questions and writes custom instructions to paste into ChatGPT, Claude, Gemini, or Copilot.
 * Everything happens in the browser. Nothing typed here is sent anywhere.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    const USES = [
        ['email', 'writing and replying to email'],
        ['writing', 'drafting and editing documents'],
        ['research', 'researching and summarizing'],
        ['planning', 'planning projects, trips, and events'],
        ['numbers', 'spreadsheets and numbers'],
        ['learning', 'learning new things'],
        ['everyday', 'everyday questions'],
    ];

    const TONES = {
        friendly: 'Be warm and friendly, like a helpful colleague.',
        professional: 'Keep a professional, polished tone.',
        direct: 'Be direct and get straight to the point, without filler or flattery.',
    };

    const LENGTHS = {
        short: 'Keep answers short. Give the answer first, and only add detail if I ask.',
        balanced: 'Give enough detail to be useful, but keep answers focused.',
        thorough: 'Be thorough. Explain your reasoning and include the details.',
    };

    const HABITS = [
        ['plain', 'Use plain language, and explain any technical term the first time you use it.'],
        ['steps', 'When there are steps to follow, give them as a numbered list.'],
        ['ask', 'If my request is unclear, ask me a question before answering.'],
        ['unsure', 'If you are not sure about something, say so rather than guessing.'],
        ['sources', 'When you state facts, tell me where they come from so I can check them.'],
        ['options', 'When there is a choice to make, give me a few options with their pros and cons.'],
    ];

    /** Where each assistant keeps its instructions. Menu names change, so this was checked in November 2026. */
    const WHERE = {
        chatgpt: 'In ChatGPT, open your profile menu, choose Settings, then Personalization, and paste this into Custom instructions. You may need to turn on customization first.',
        claude: 'In Claude, open Settings and find the box that asks what personal preferences Claude should consider in responses. Paste this there and save.',
        gemini: 'In Gemini, open Settings and help, then Personal Intelligence (it may say Personal context), and add this under Instructions for Gemini.',
        copilot: 'In Microsoft Copilot, open Settings, then Personalization, and paste this into Custom instructions. A work account may have this turned off by your organization.',
    };

    const clean = value => `${value || ''}`.trim().replace(/\s+/g, ' ');
    const sentence = text => /[.!?]$/.test(text) ? text : `${text}.`;

    /** Builds the instructions from the answers. */
    function buildInstructions(answers) {
        const about = [];
        const name = clean(answers.name);
        const role = clean(answers.role);
        if (name) about.push(`Please call me ${name}.`);
        if (role) about.push(sentence(`I work as ${role}`));
        const uses = USES.filter(([key]) => answers.uses?.includes(key)).map(([, text]) => text);
        if (uses.length === 1) about.push(`I mostly use you for ${uses[0]}.`);
        if (uses.length > 1) about.push(`I mostly use you for ${uses.slice(0, -1).join(', ')}, and ${uses[uses.length - 1]}.`);
        const context = clean(answers.context);
        if (context) about.push(sentence(context));

        const respond = [];
        if (TONES[answers.tone]) respond.push(TONES[answers.tone]);
        if (LENGTHS[answers.length]) respond.push(LENGTHS[answers.length]);
        HABITS.filter(([key]) => answers.habits?.includes(key)).forEach(([, text]) => respond.push(text));
        const avoid = clean(answers.avoid);
        if (avoid) respond.push(sentence(`Please avoid ${avoid.replace(/^(please )?avoid /i, '')}`));

        const parts = [];
        if (about.length) parts.push(`About me:\n${about.map(line => `- ${line}`).join('\n')}`);
        if (respond.length) parts.push(`How to respond:\n${respond.map(line => `- ${line}`).join('\n')}`);
        return parts.join('\n\n');
    }

    webui.define('app-instructions-builder', {
        preload: 'flex input-text input-message switch code',
        connected() {
            this.render();
        },
        async render() {
            const t = this;
            const wrap = webui.create('webui-flex', { column: true, gap: 'var(--padding)' });

            const name = webui.create('webui-input-text', { label: 'What should it call you?', placeholder: 'Your first name, or leave blank', maxlength: 60 });
            const role = webui.create('webui-input-text', { label: 'What do you do?', placeholder: 'For example: a teacher, a small business owner, retired', maxlength: 120 });

            const usesBox = t.checkboxes('What do you mostly use it for?', 'uses', USES.map(([key, text]) => [key, text.charAt(0).toUpperCase() + text.slice(1)]));
            const context = webui.create('webui-input-message', { label: 'Anything else it should know about you?', placeholder: 'For example: I live in Canada, so use metric units and Canadian spelling' });

            const tone = webui.create('webui-switch', { label: 'Tone' });
            tone.setOptions(JSON.stringify([
                { value: 'friendly', label: 'Friendly' },
                { value: 'professional', label: 'Professional' },
                { value: 'direct', label: 'Direct' },
            ]));
            const length = webui.create('webui-switch', { label: 'Answer length' });
            length.setOptions(JSON.stringify([
                { value: 'short', label: 'Short' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'thorough', label: 'Thorough' },
            ]));
            length.setAttribute('value', 'balanced');

            const habitsBox = t.checkboxes('Good habits to ask for', 'habits', HABITS.map(([key, text]) => [key, text]));
            const avoid = webui.create('webui-input-text', { label: 'Anything it should avoid?', placeholder: 'For example: emojis, long introductions, jargon', maxlength: 200 });

            const assistant = webui.create('webui-switch', { label: 'Your assistant' });
            assistant.setOptions(JSON.stringify([
                { value: 'chatgpt', label: 'ChatGPT' },
                { value: 'claude', label: 'Claude' },
                { value: 'gemini', label: 'Gemini' },
                { value: 'copilot', label: 'Copilot' },
            ]));

            const output = webui.create('webui-code', { language: 'text', label: 'Your custom instructions', class: 'instructions-output' });
            const count = webui.create('p', { class: 'instructions-count', 'aria-live': 'polite' });
            const where = webui.create('p', { class: 'instructions-where' });

            const field = (label, control) => {
                const row = webui.create('webui-flex', { column: true, gap: '0.25rem' });
                row.append(webui.create('strong', { text: label }), control);
                return row;
            };

            wrap.append(
                webui.create('h3', { text: 'About you' }),
                name, role, usesBox, context,
                webui.create('h3', { text: 'How it should answer' }),
                field('Tone', tone), field('Answer length', length), habitsBox, avoid,
                webui.create('h3', { text: 'Your instructions' }),
                field('Your assistant', assistant), where, output, count,
            );
            t.replaceChildren(wrap);

            t._fields = { name, role, context, tone, length, avoid, assistant, usesBox, habitsBox };
            t._output = output;
            t._count = count;
            t._where = where;

            await Promise.all(['webui-input-text', 'webui-input-message', 'webui-switch', 'webui-code'].map(tag => customElements.whenDefined(tag)));
            wrap.addEventListener('input', () => t.update());
            wrap.addEventListener('change', () => t.update());
            t.update();
        },
        /** A labelled group of checkboxes. Labels are fixed text from this file, never typed text. */
        checkboxes(legend, name, items) {
            const set = webui.create('fieldset', { class: 'instructions-choices', 'data-group': name });
            const list = webui.create('webui-flex', { column: true, gap: '0.25rem' });
            items.forEach(([value, text]) => {
                const label = webui.create('label');
                const box = webui.create('input', { type: 'checkbox', name, value });
                label.append(box, document.createTextNode(` ${text}`));
                list.append(label);
            });
            set.append(webui.create('legend', { text: legend }), list);
            return set;
        },
        /** The current answers, read from the form. */
        answers() {
            const f = this._fields;
            const checked = set => [...set.querySelectorAll('input:checked')].map(box => box.value);
            return {
                name: f.name.value,
                role: f.role.value,
                uses: checked(f.usesBox),
                context: f.context.value,
                tone: f.tone.value || 'friendly',
                length: f.length.value || 'balanced',
                habits: checked(f.habitsBox),
                avoid: f.avoid.value,
            };
        },
        update() {
            const t = this;
            if (!t._fields) return;
            const text = buildInstructions(t.answers());
            if (text !== t._last) {
                t._last = text;
                t._output.setValue(text);
                t._count.innerText = text
                    ? `${text.length.toLocaleString()} characters. If your assistant says this is too long, remove the lines that matter least to you.`
                    : 'Answer any of the questions above, and your instructions appear here.';
            }
            const where = WHERE[t._fields.assistant.value] || WHERE.chatgpt;
            if (t._where.innerText !== where) t._where.innerText = where;
        },
    });
}
