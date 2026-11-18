import { test, expect, openPage } from './support/site.mjs';

// app-assistant-quiz: three questions, a suggested assistant and the reasons, all in the browser.

test.beforeEach(async ({ page }) => {
    await openPage(page, '/which-assistant');
});

const quiz = page => page.locator('app-assistant-quiz');
const result = page => quiz(page).locator('.quiz-result');
const pick = (page, question, option) => quiz(page).getByRole('group', { name: question }).getByRole('radio', { name: option, exact: true }).check();
const APPS = 'Which apps do you use most for email and documents?';
const USE = 'What will you use it for most?';
const WORK = 'Does your work or school give you an AI assistant?';

test('asks for answers before suggesting anything', async ({ page }) => {
    await expect(result(page)).toContainText('Answer the questions above');
    await expect(quiz(page).getByRole('radio', { checked: true })).toHaveCount(0);
    await pick(page, APPS, 'Google (Gmail, Docs)');
    await expect(result(page)).toContainText('Answer the questions above');
});

test('suggests Gemini for Google apps, with the reason', async ({ page }) => {
    await pick(page, APPS, 'Google (Gmail, Docs)');
    await pick(page, USE, 'My email and documents');
    await expect(result(page).locator('webui-card')).toHaveAttribute('name', 'Try Gemini first');
    await expect(result(page)).toContainText('It works inside Gmail, Google Docs');
    await expect(result(page).locator('a[href="/instructions-builder"]')).toBeVisible();
});

test('suggests Copilot for Microsoft apps', async ({ page }) => {
    await pick(page, APPS, 'Microsoft (Outlook, Word)');
    await pick(page, USE, 'Everyday questions');
    await expect(result(page).locator('webui-card')).toHaveAttribute('name', 'Try Microsoft Copilot first');
    await expect(result(page)).toContainText('Also worth a try: ChatGPT.');
});

test('suggests Claude for writing', async ({ page }) => {
    await pick(page, APPS, 'Something else');
    await pick(page, USE, 'Writing');
    await expect(result(page).locator('webui-card')).toHaveAttribute('name', 'Try Claude first');
    await expect(result(page)).toContainText('clear, natural writing');
    await pick(page, APPS, 'Google (Gmail, Docs)');
    await expect(result(page).locator('.quiz-next')).toHaveText('Also worth a try: Gemini. It works inside Gmail, Google Docs, and other Google apps you already use.');
});

test('never suggests Claude for pictures', async ({ page }) => {
    for (const apps of ['Google (Gmail, Docs)', 'Microsoft (Outlook, Word)', 'A mix of both', 'Something else']) {
        await pick(page, APPS, apps);
        await pick(page, USE, 'Making pictures');
        await expect(result(page).locator('webui-card')).not.toHaveAttribute('name', 'Try Claude first');
        await expect(result(page)).not.toContainText('Also worth a try: Claude.');
        await expect(result(page)).toContainText('It can make pictures from a description.');
    }
});

test('points work users to the assistant their work provides', async ({ page }) => {
    await pick(page, WORK, 'Yes');
    await pick(page, APPS, 'Something else');
    await pick(page, USE, 'Research');
    await expect(result(page).locator('.quiz-work')).toContainText('use the assistant your work or school gives you');
    await expect(result(page).locator('webui-card')).toHaveAttribute('name', 'Try ChatGPT first');
});
