import { test, expect, openPage } from './support/site.mjs';

// app-prompt-cards: fill-in-the-blank prompts, all in the browser.

const tool = page => page.locator('app-prompt-cards');
const outputText = page => tool(page).locator('webui-code.prompt-output').evaluate(el => el.value);
const typeText = (page, label, text) => tool(page).locator(`webui-input-text[label="${label}"] input`).fill(text);
const typeMessage = (page, label, text) => tool(page).locator(`webui-input-message[label="${label}"] textarea`).fill(text);
const pick = (page, option) => tool(page).locator('webui-switch[label="Pick a recipe"]').getByRole('radio', { name: option, exact: true }).click();

test.describe('on the Prompt Cards page', () => {
    test.beforeEach(async ({ page }) => {
        await openPage(page, '/prompt-cards');
    });

    test('starts on the first recipe, with empty blanks in brackets', async ({ page }) => {
        await expect.poll(() => outputText(page)).toContain('What I want to say: [what you want to say]');
        await expect.poll(() => outputText(page)).toContain('"""\n[the email you received]\n"""');
        await expect(tool(page).locator('.prompt-note')).toContainText('replace the parts in [square brackets]');
        await expect(tool(page).locator('.prompt-guide a')).toHaveAttribute('href', '/recipes/reply-to-an-email');
    });

    test('fills the prompt from the blanks', async ({ page }) => {
        await typeText(page, 'What you want to say', 'yes to Thursday');
        await typeText(page, 'How it should sound', 'friendly');
        await typeMessage(page, 'The email you received', 'Can we meet?\nThanks, Pat');
        await expect.poll(() => outputText(page)).toBe([
            'Help me reply to the email below.',
            '',
            'What I want to say: yes to Thursday',
            'How it should sound: friendly',
            '',
            'Keep the reply short and clear. Write only the reply, ready to send. Don\'t state anything as a fact that I haven\'t told you, and if something important is missing, ask me before you write it.',
            '',
            'The email:',
            '"""',
            'Can we meet?\nThanks, Pat',
            '"""',
        ].join('\n'));
        await expect(tool(page).locator('.prompt-note')).toContainText('Ready to copy');
    });

    test('switches recipes', async ({ page }) => {
        await pick(page, 'Spreadsheet');
        await expect(tool(page).locator('webui-input-text[label="Your spreadsheet app"]')).toBeVisible();
        await typeText(page, 'Your spreadsheet app', 'Google Sheets');
        await expect.poll(() => outputText(page)).toContain("I'm using Google Sheets.");
        await expect(tool(page).locator('webui-code.prompt-output')).toHaveAttribute('label', 'Your prompt: Get help with a spreadsheet');
        await expect(tool(page).locator('.prompt-guide a')).toHaveCount(0);
        await pick(page, 'Meeting notes');
        await expect.poll(() => outputText(page)).toContain('Summarize my notes from a meeting about [what the meeting was about].');
    });

    test('shows typed HTML as text', async ({ page }) => {
        await typeText(page, 'What you want to say', '<img src=x onerror="window.__attacked=1">');
        await expect.poll(() => outputText(page)).toContain('What I want to say: ');
        await expect(tool(page).locator('img')).toHaveCount(0);
        expect(await page.evaluate(() => window.__attacked)).toBeUndefined();
    });
});

test('shows one recipe without a picker on its recipe page', async ({ page }) => {
    await openPage(page, '/recipes/plan-a-trip');
    await expect(tool(page).locator('webui-switch')).toHaveCount(0);
    await typeText(page, 'Where you are going', 'Lisbon');
    await expect.poll(() => outputText(page)).toContain('Help me plan a trip to Lisbon, [when and how long].');
});
