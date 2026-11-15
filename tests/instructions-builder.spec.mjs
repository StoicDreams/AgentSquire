import { test, expect, openPage } from './support/site.mjs';

// app-instructions-builder: answers in, custom instructions out, all in the browser.

test.beforeEach(async ({ page }) => {
    await openPage(page, '/instructions-builder');
});

const tool = page => page.locator('app-instructions-builder');
const output = page => tool(page).locator('webui-code.instructions-output');
const outputText = page => output(page).evaluate(el => el.value);
const typeText = (page, label, text) => tool(page).locator(`webui-input-text[label="${label}"] input`).fill(text);
const typeMessage = (page, label, text) => tool(page).locator(`webui-input-message[label="${label}"] textarea`).fill(text);
const pick = (page, label, option) => tool(page).locator(`webui-switch[label="${label}"]`).getByRole('radio', { name: option, exact: true }).click();
const check = (page, text) => tool(page).getByLabel(text, { exact: false }).check();

test('starts with the default tone and length, and says where to paste', async ({ page }) => {
    await expect.poll(() => outputText(page)).toBe('How to respond:\n- Be warm and friendly, like a helpful colleague.\n- Give enough detail to be useful, but keep answers focused.');
    await expect(tool(page).locator('.instructions-where')).toContainText('In ChatGPT');
});

test('writes instructions from the answers', async ({ page }) => {
    await typeText(page, 'What should it call you?', 'Sam');
    await typeText(page, 'What do you do?', 'the owner of a small bakery');
    await check(page, 'Writing and replying to email');
    await check(page, 'Planning projects, trips, and events');
    await typeMessage(page, 'Anything else it should know about you?', 'I live in Canada');
    await pick(page, 'Tone', 'Direct');
    await pick(page, 'Answer length', 'Short');
    await check(page, 'If my request is unclear');
    await typeText(page, 'Anything it should avoid?', 'emojis');
    await expect.poll(() => outputText(page)).toBe([
        'About me:',
        '- Please call me Sam.',
        '- I work as the owner of a small bakery.',
        '- I mostly use you for writing and replying to email, and planning projects, trips, and events.',
        '- I live in Canada.',
        '',
        'How to respond:',
        '- Be direct and get straight to the point, without filler or flattery.',
        '- Keep answers short. Give the answer first, and only add detail if I ask.',
        '- If my request is unclear, ask me a question before answering.',
        '- Please avoid emojis.',
    ].join('\n'));
    await expect(tool(page).locator('.instructions-count')).toContainText('characters');
});

test('lists three or more uses with commas', async ({ page }) => {
    await check(page, 'Drafting and editing documents');
    await check(page, 'Researching and summarizing');
    await check(page, 'Everyday questions');
    await expect.poll(() => outputText(page)).toContain('- I mostly use you for drafting and editing documents, researching and summarizing, and everyday questions.');
});

test('shows where to paste for each assistant', async ({ page }) => {
    for (const [name, text] of [['Claude', 'In Claude'], ['Gemini', 'In Gemini'], ['Copilot', 'In Microsoft Copilot'], ['ChatGPT', 'In ChatGPT']]) {
        await pick(page, 'Your assistant', name);
        await expect(tool(page).locator('.instructions-where')).toContainText(text);
    }
});

test('shows typed HTML as text', async ({ page }) => {
    await typeText(page, 'What do you do?', '<img src=x onerror="window.__attacked=1">');
    await expect.poll(() => outputText(page)).toContain('I work as');
    await expect(output(page).locator('img')).toHaveCount(0);
    await expect(tool(page).locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.__attacked)).toBeUndefined();
});
