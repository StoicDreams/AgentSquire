/*!
 * Agent Squire Which Assistant Fits Me? quiz
 * A few questions about how you work, and a suggested assistant to try first, with the reasons.
 * Everything happens in the browser. Nothing chosen here is sent anywhere.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /** In this order, which also breaks ties. */
    const ASSISTANTS = {
        chatgpt: { name: 'ChatGPT' },
        claude: { name: 'Claude' },
        gemini: { name: 'Gemini' },
        copilot: { name: 'Microsoft Copilot' },
    };

    const QUESTIONS = [
        {
            key: 'work', label: 'Does your work or school give you an AI assistant?', options: [
                ['yes', 'Yes'],
                ['no', 'No'],
                ['unsure', 'Not sure'],
            ]
        },
        {
            key: 'apps', label: 'Which apps do you use most for email and documents?', options: [
                ['google', 'Google (Gmail, Docs)'],
                ['microsoft', 'Microsoft (Outlook, Word)'],
                ['mix', 'A mix of both'],
                ['other', 'Something else'],
            ]
        },
        {
            key: 'use', label: 'What will you use it for most?', options: [
                ['writing', 'Writing'],
                ['documents', 'My email and documents'],
                ['research', 'Research'],
                ['pictures', 'Making pictures'],
                ['everyday', 'Everyday questions'],
            ]
        },
    ];

    const GOOGLE = 'It works inside Gmail, Google Docs, and other Google apps you already use.';
    const MICROSOFT = 'It works inside Word, Outlook, Excel, and other Microsoft apps, if you have Microsoft 365.';
    const PICTURES = 'It can make pictures from a description.';
    const UPLOADS = 'You can give it documents to read, summarize, and answer questions about.';

    /**
     * Each rule adds points when its answers match, and gives a reason to the assistants it favors.
     * Facts here were checked in November 2026. Recheck them when the assistants change.
     */
    const RULES = [
        { when: a => true, points: { chatgpt: 1 }, reasons: { chatgpt: 'It is the most widely used assistant, so help and how-to guides are easy to find.' } },
        { when: a => a.apps === 'google', points: { gemini: 3 }, reasons: { gemini: GOOGLE } },
        { when: a => a.apps === 'microsoft', points: { copilot: 3 }, reasons: { copilot: MICROSOFT } },
        { when: a => a.apps === 'mix', points: { gemini: 1, copilot: 1 }, reasons: { gemini: GOOGLE, copilot: MICROSOFT } },
        { when: a => a.use === 'writing', points: { claude: 3, chatgpt: 1 }, reasons: { claude: 'It is known for clear, natural writing, and for working through long documents.' } },
        { when: a => a.use === 'documents' && a.apps === 'google', points: { gemini: 2 }, reasons: { gemini: 'It can help right inside your email and documents.' } },
        { when: a => a.use === 'documents' && a.apps === 'microsoft', points: { copilot: 2 }, reasons: { copilot: 'It can help right inside your email and documents.' } },
        { when: a => a.use === 'documents' && a.apps === 'mix', points: { gemini: 1, copilot: 1 }, reasons: {} },
        { when: a => a.use === 'documents' && (a.apps === 'other' || !a.apps), points: { claude: 1, chatgpt: 1 }, reasons: { claude: UPLOADS, chatgpt: UPLOADS } },
        { when: a => a.use === 'research', points: { chatgpt: 1, claude: 1, gemini: 1, copilot: 1 }, reasons: { chatgpt: 'It can search the web and show where its answers come from.', claude: 'It can search the web and show where its answers come from.', gemini: 'It can search the web and show where its answers come from.', copilot: 'It can search the web and show where its answers come from.' } },
        { when: a => a.use === 'pictures', points: { chatgpt: 3, gemini: 2, copilot: 1, claude: -4 }, reasons: { chatgpt: PICTURES, gemini: PICTURES, copilot: PICTURES } },
        { when: a => a.use === 'everyday', points: { chatgpt: 1 }, reasons: {} },
    ];

    /** Scores the answers, and returns the assistants from best to worst fit with their reasons. */
    function rankAssistants(answers) {
        const scores = Object.fromEntries(Object.keys(ASSISTANTS).map(key => [key, { key, points: 0, reasons: [] }]));
        RULES.filter(rule => rule.when(answers)).forEach(rule => {
            Object.entries(rule.points).forEach(([key, points]) => scores[key].points += points);
            Object.entries(rule.reasons).forEach(([key, reason]) => {
                if (!scores[key].reasons.includes(reason)) scores[key].reasons.push(reason);
            });
        });
        const order = Object.keys(ASSISTANTS);
        return Object.values(scores).sort((a, b) => b.points - a.points || order.indexOf(a.key) - order.indexOf(b.key));
    }

    webui.define('app-assistant-quiz', {
        preload: 'flex card',
        connected() {
            this.render();
        },
        async render() {
            const t = this;
            const wrap = webui.create('webui-flex', { column: true, gap: 'var(--padding)' });
            // Radio buttons rather than webui-switch, which always selects its first option, so questions start unanswered.
            t._groups = {};
            QUESTIONS.forEach(question => {
                const set = webui.create('fieldset', { class: 'quiz-question', 'data-question': question.key });
                const list = webui.create('webui-flex', { column: true, gap: '0.25rem' });
                question.options.forEach(([value, text]) => {
                    const label = webui.create('label');
                    label.append(webui.create('input', { type: 'radio', name: `quiz-${question.key}`, value }), document.createTextNode(` ${text}`));
                    list.append(label);
                });
                set.append(webui.create('legend', { text: question.label }), list);
                t._groups[question.key] = set;
                wrap.append(set);
            });
            t._result = webui.create('div', { class: 'quiz-result', 'aria-live': 'polite' });
            wrap.append(t._result);
            t.replaceChildren(wrap);

            wrap.addEventListener('change', () => t.update());
            wrap.addEventListener('input', () => t.update());
            t._ready = true;
            t.update();
        },
        answers() {
            const answers = {};
            Object.entries(this._groups).forEach(([key, set]) => answers[key] = set.querySelector('input:checked')?.value || '');
            return answers;
        },
        update() {
            const t = this;
            if (!t._ready) return;
            const answers = t.answers();
            const state = JSON.stringify(answers);
            if (state === t._last) return;
            t._last = state;
            if (!answers.apps || !answers.use) {
                t._result.replaceChildren(webui.create('p', { text: 'Answer the questions above, and I\'ll suggest the assistant to try first.' }));
                return;
            }
            const [best, next] = rankAssistants(answers);
            const top = ASSISTANTS[best.key];
            const parts = [];
            if (answers.work === 'yes') {
                parts.push(webui.create('p', { class: 'quiz-work', text: 'For work, use the assistant your work or school gives you. It is the one they have approved for work information. The suggestion below is for your own use.' }));
            } else if (answers.work === 'unsure') {
                parts.push(webui.create('p', { class: 'quiz-work', text: 'It\'s worth asking your work or school whether they give you an assistant. If they do, use that one for work.' }));
            }
            const card = webui.create('webui-card', { name: `Try ${top.name} first`, avatar: 'compass', theme: 'primary', class: 'quiz-best' });
            const reasons = webui.create('ul');
            best.reasons.forEach(reason => reasons.append(webui.create('li', { text: reason })));
            card.append(reasons, webui.create('p', { class: 'quiz-next', text: [`Also worth a try: ${ASSISTANTS[next.key].name}.`, next.reasons[0] || ''].join(' ').trim() }));
            parts.push(card);
            const setUp = webui.create('p');
            setUp.append(
                document.createTextNode(`All four have a free plan. Give ${top.name} and ${ASSISTANTS[next.key].name} the same real task for a week, and keep the one you like working with. Then use the `),
                webui.create('a', { href: '/instructions-builder', text: 'Instructions Builder' }),
                document.createTextNode(' to set it up.'),
            );
            parts.push(setUp);
            const compare = webui.create('p', { class: 'quiz-compare' });
            compare.append(
                document.createTextNode('Want to see all four side by side? Read '),
                webui.create('a', { href: '/getting-started/choosing-an-assistant', text: 'Choosing an assistant' }),
                document.createTextNode('.'),
            );
            parts.push(compare);
            t._result.replaceChildren(...parts);
        },
    });
}
