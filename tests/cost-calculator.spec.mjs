import { test, expect, openPage } from './support/site.mjs';

// app-cost-calculator: plan costs for each assistant from usage, people, and billing, all in the browser.

test.beforeEach(async ({ page }) => {
    await openPage(page, '/cost-calculator');
});

const calc = page => page.locator('app-cost-calculator');
const card = (page, key) => calc(page).locator(`webui-card[data-assistant="${key}"]`);
const pick = (page, question, option) => calc(page).locator(`webui-switch[label="${question}"]`).getByRole('radio', { name: option, exact: true }).click();
const USAGE = 'How much will you use it?';
const PEOPLE = 'How many people?';
const BILLING = 'How will you pay?';

test('starts with the main paid plan for one person, billed monthly', async ({ page }) => {
    await expect(card(page, 'chatgpt')).toContainText('ChatGPT Plus');
    await expect(card(page, 'chatgpt').locator('.cost-year')).toHaveText('$240.00 a year');
    await expect(card(page, 'claude').locator('.cost-month')).toHaveText('$20.00 a month');
    await expect(card(page, 'gemini').locator('.cost-month')).toHaveText('$19.99 a month');
    await expect(card(page, 'copilot')).toContainText('Microsoft 365 Personal');
    await expect(calc(page).locator('.cost-summary')).toContainText('Lowest cost: Microsoft 365 Personal, $119.88 a year.');
});

test('uses yearly prices where they are offered', async ({ page }) => {
    await pick(page, BILLING, 'Yearly, where offered');
    await expect(card(page, 'claude').locator('.cost-year')).toHaveText('$200.00 a year, paid yearly');
    await expect(card(page, 'claude').locator('.cost-month')).toHaveText('$16.67 a month');
    await expect(card(page, 'gemini').locator('.cost-year')).toHaveText('$199.99 a year, paid yearly');
    await expect(card(page, 'chatgpt')).toContainText('Only sold monthly.');
});

test('shares one Google plan across a household, and counts a plan per person for the others', async ({ page }) => {
    await pick(page, PEOPLE, '4');
    await expect(card(page, 'gemini').locator('.cost-plan')).toHaveText('Google AI Pro');
    await expect(card(page, 'gemini').locator('.cost-year')).toHaveText('$239.88 a year');
    await expect(card(page, 'chatgpt').locator('.cost-plan')).toHaveText('4 × ChatGPT Plus');
    await expect(card(page, 'chatgpt').locator('.cost-year')).toHaveText('$960.00 a year');
    await expect(calc(page).locator('.cost-summary')).toContainText('Lowest cost: Google AI Pro, $239.88 a year.');
});

test('shows free plans for light use', async ({ page }) => {
    await pick(page, USAGE, 'A few times a week');
    await expect(card(page, 'claude').locator('.cost-plan')).toHaveText('Free plan');
    await expect(card(page, 'claude').locator('.cost-year')).toHaveText('$0.00 a year');
    await expect(calc(page).locator('.cost-summary')).toContainText('free plan should be enough');
});

test('shows starting prices for heavy use', async ({ page }) => {
    await pick(page, USAGE, 'All day, for big jobs');
    await expect(card(page, 'chatgpt').locator('.cost-month')).toHaveText('from $100.00 a month');
    await expect(card(page, 'claude')).toContainText('Claude Max');
    await expect(card(page, 'copilot')).toContainText('Microsoft 365 Premium');
});
