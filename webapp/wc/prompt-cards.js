/*!
 * Agent Squire Prompt Cards
 * Fill-in-the-blank prompts for real work, ready to copy into any AI assistant.
 * Use <app-prompt-cards> for every recipe with a picker, or <app-prompt-cards recipe="plan-a-trip"> for one.
 * Everything happens in the browser. Nothing typed here is sent anywhere.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /**
     * Each recipe has blanks and a prompt. {key} in the prompt is replaced with the blank's answer,
     * or with [its label] when left empty, so it can be filled in after pasting.
     * `guide` is the recipe's guide page, when it has one.
     */
    const RECIPES = [
        {
            id: 'reply-to-an-email',
            short: 'Email reply',
            title: 'Reply to an email',
            guide: '/recipes/reply-to-an-email',
            blanks: [
                { key: 'goal', label: 'What you want to say', hint: 'For example: yes to Thursday, but I can\'t do Friday' },
                { key: 'tone', label: 'How it should sound', hint: 'For example: friendly but firm' },
                { key: 'email', label: 'The email you received', hint: 'Paste the email here', long: true },
            ],
            prompt: `Help me reply to the email below.

What I want to say: {goal}
How it should sound: {tone}

Keep the reply short and clear. Write only the reply, ready to send. Don't state anything as a fact that I haven't told you, and if something important is missing, ask me before you write it.

The email:
"""
{email}
"""`,
        },
        {
            id: 'summarize-meeting-notes',
            short: 'Meeting notes',
            title: 'Summarize meeting notes',
            guide: '/recipes/summarize-meeting-notes',
            blanks: [
                { key: 'meeting', label: 'What the meeting was about', hint: 'For example: planning the spring fundraiser' },
                { key: 'audience', label: 'Who the summary is for', hint: 'For example: the whole team, my manager' },
                { key: 'notes', label: 'Your notes or transcript', hint: 'Paste your notes here', long: true },
            ],
            prompt: `Summarize my notes from a meeting about {meeting}. The summary is for {audience}.

Give me:
1. A two or three sentence overview.
2. The decisions that were made.
3. Action items, with who owns each one and any due date.
4. Open questions that still need an answer.

Only use what is in the notes. If an owner or date isn't mentioned, write "not stated" rather than guessing.

My notes:
"""
{notes}
"""`,
        },
        {
            id: 'get-up-to-speed',
            short: 'Research',
            title: 'Get up to speed on a topic',
            blanks: [
                { key: 'topic', label: 'The topic', hint: 'For example: heat pumps for an older house' },
                { key: 'why', label: 'Why you need to know', hint: 'For example: I\'m deciding whether to replace my furnace' },
                { key: 'known', label: 'What you already know', hint: 'For example: almost nothing' },
            ],
            prompt: `I want to understand {topic}, because {why}. What I already know: {known}.

Explain the basics in plain language, then the three to five things that matter most for my situation. Point out where experts disagree, or where the answer depends on details I haven't given you. Tell me what to search for or who to ask to check the important points, and say clearly if anything you tell me might be out of date.`,
        },
        {
            id: 'spreadsheet-help',
            short: 'Spreadsheet',
            title: 'Get help with a spreadsheet',
            blanks: [
                { key: 'app', label: 'Your spreadsheet app', hint: 'For example: Excel, Google Sheets, or Numbers' },
                { key: 'layout', label: 'How your sheet is set up', hint: 'For example: column A is the date, column B the customer, and column C the amount', long: true },
                { key: 'goal', label: 'What you want to work out', hint: 'For example: the total for each customer this month' },
            ],
            prompt: `I'm using {app}. My sheet is set up like this:
{layout}

I want to work out {goal}.

Give me the formula or the steps, and tell me which cell to put it in. Explain what each part does in plain words, and tell me how to check that the result is right.`,
        },
        {
            id: 'plan-a-trip',
            short: 'Trip',
            title: 'Plan a trip',
            guide: '/recipes/plan-a-trip',
            blanks: [
                { key: 'place', label: 'Where you are going', hint: 'For example: Lisbon' },
                { key: 'when', label: 'When and how long', hint: 'For example: four days in early May' },
                { key: 'who', label: 'Who is going', hint: 'For example: two adults and a ten-year-old' },
                { key: 'likes', label: 'What you enjoy', hint: 'For example: food markets, history, and short walks' },
                { key: 'budget', label: 'Your budget', hint: 'For example: moderate, about $2,000 not counting flights' },
            ],
            prompt: `Help me plan a trip to {place}, {when}. Who is going: {who}. We enjoy {likes}. Budget: {budget}.

Suggest a day-by-day plan at a relaxed pace, grouping places that are close together. For each day, include an option for bad weather. Point out anything that usually needs booking ahead. Opening hours, prices, and rules change, so tell me which details to confirm on official websites before I go.`,
        },
    ];

    const clean = value => `${value || ''}`.trim();
    const lower = text => text.charAt(0).toLowerCase() + text.slice(1);

    /** Fills a recipe's prompt from the answers, leaving [label] for each empty blank. */
    function buildPrompt(recipe, answers) {
        const blanks = Object.fromEntries(recipe.blanks.map(blank => [blank.key, blank]));
        return recipe.prompt.replace(/\{(\w+)\}/g, (match, key) => {
            if (!blanks[key]) return match;
            const value = blanks[key].long ? clean(answers[key]) : clean(answers[key]).replace(/\s+/g, ' ');
            return value || `[${lower(blanks[key].label)}]`;
        });
    }

    webui.define('app-prompt-cards', {
        preload: 'flex input-text input-message switch code',
        connected() {
            this.render();
        },
        async render() {
            const t = this;
            const only = RECIPES.find(recipe => recipe.id === t.getAttribute('recipe'));
            const wrap = webui.create('webui-flex', { column: true, gap: 'var(--padding)' });
            const blanks = webui.create('webui-flex', { column: true, gap: 'var(--padding)', class: 'prompt-blanks' });
            const output = webui.create('webui-code', { language: 'text', class: 'prompt-output' });
            const note = webui.create('p', { class: 'prompt-note', 'aria-live': 'polite' });
            const guide = webui.create('p', { class: 'prompt-guide' });

            let picker = null;
            if (!only) {
                picker = webui.create('webui-switch', { label: 'Pick a recipe' });
                picker.setOptions(JSON.stringify(RECIPES.map(recipe => ({ value: recipe.id, label: recipe.short }))));
                const row = webui.create('webui-flex', { column: true, gap: '0.25rem' });
                row.append(webui.create('strong', { text: 'Pick a recipe' }), picker);
                wrap.append(row);
            }
            wrap.append(blanks, output, note);
            if (!only) wrap.append(guide);
            t.replaceChildren(wrap);

            t._only = only;
            t._picker = picker;
            t._blanks = blanks;
            t._output = output;
            t._note = note;
            t._guide = guide;
            t.showRecipe(only || RECIPES[0]);

            await Promise.all(['webui-input-text', 'webui-input-message', 'webui-switch', 'webui-code'].map(tag => customElements.whenDefined(tag)));
            wrap.addEventListener('input', () => t.update());
            wrap.addEventListener('change', () => t.update());
            t._ready = true;
            t.update();
        },
        /** Shows the blanks for a recipe. Labels and hints are fixed text from this file. */
        showRecipe(recipe) {
            const t = this;
            t._recipe = recipe;
            t._fields = {};
            const fields = recipe.blanks.map(blank => {
                const tag = blank.long ? 'webui-input-message' : 'webui-input-text';
                const options = { label: blank.label, placeholder: blank.hint };
                if (!blank.long) options.maxlength = 200;
                const field = webui.create(tag, options);
                t._fields[blank.key] = field;
                return field;
            });
            t._blanks.replaceChildren(...fields);
            t._output.setAttribute('label', `Your prompt: ${recipe.title}`);
            t._last = undefined;
            if (recipe.guide) {
                t._guide.replaceChildren(
                    document.createTextNode('Want tips for this one? Read the '),
                    webui.create('a', { href: recipe.guide, text: `${recipe.title} recipe` }),
                    document.createTextNode('.'),
                );
            } else {
                t._guide.replaceChildren();
            }
        },
        update() {
            const t = this;
            if (!t._ready) return;
            if (t._picker) {
                const picked = RECIPES.find(recipe => recipe.id === t._picker.value);
                if (picked && picked !== t._recipe) t.showRecipe(picked);
            }
            const answers = {};
            Object.entries(t._fields).forEach(([key, field]) => answers[key] = field.value);
            const text = buildPrompt(t._recipe, answers);
            if (text === t._last) return;
            t._last = text;
            t._output.setValue(text);
            const empty = t._recipe.blanks.filter(blank => !clean(answers[blank.key])).length;
            t._note.innerText = empty
                ? `Copy it into a new chat. Fill in the blanks above first, or replace the ${empty === 1 ? 'part' : 'parts'} in [square brackets] after you paste.`
                : 'Ready to copy into a new chat with your assistant.';
        },
    });
}
