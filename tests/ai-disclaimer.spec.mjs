import { test, expect, openPage } from './support/site.mjs';

// app-ai-disclaimer: the AI risks summary in every page's footer, above the footer links.
// webui-page-footer moves its content into footer[slot="content-footer"] and removes itself.

test('the footer summarizes the risks of AI and links to the full page', async ({ page }) => {
    await openPage(page, '/');
    const note = page.locator('footer[slot="content-footer"] app-ai-disclaimer');
    await expect(note).toHaveAttribute('role', 'note');
    await expect(note).toContainText('AI assistants can be wrong while sounding certain');
    await expect(note).toContainText('not professional advice');
    await expect(note.locator('webui-quote[theme="tertiary"]')).toContainText('AI assistants can be wrong');
    const position = await page.evaluate(() => {
        const disclaimer = document.querySelector('footer[slot="content-footer"] app-ai-disclaimer');
        const about = document.querySelector('footer[slot="content-footer"] webui-link[href="/about"]');
        return disclaimer.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(position).toBeTruthy();
    await expect(note.locator('webui-quote')).toHaveAttribute('cite', /href="\/ai-risks"/);
    await note.getByRole('link', { name: 'More information about AI risks' }).click();
    await expect(page).toHaveURL(/\/ai-risks$/);
    await expect(page.locator('h2', { hasText: 'Wrong answers and made-up facts' })).toBeVisible();
});

test('the footer disclaimer is on other pages too', async ({ page }) => {
    await openPage(page, '/prompt-cards');
    await expect(page.locator('footer[slot="content-footer"] app-ai-disclaimer a[href="/ai-risks"]')).toHaveCount(1);
});
