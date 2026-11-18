/*!
 * Agent Squire AI Plan Cost Calculator
 * Compares what ChatGPT, Claude, Gemini, and Microsoft Copilot cost for how much you use them and how many people share them.
 * Everything happens in the browser. Nothing chosen here is sent anywhere.
 * Authored by Erik Gassler - Stoic Dreams
 * Copyright © 2026 Stoic Dreams - https://www.stoicdreams.com
 * Licensed under the MIT license - https://github.com/StoicDreams/MyFiCDN/blob/main/LICENSE
 */
"use strict"
{
    /**
     * US prices checked on 2026-11-17: Claude, Google, and Microsoft from their own pricing pages,
     * ChatGPT from pricing guides because its page shows no figures. Update CHECKED with the prices.
     * month: price billed monthly. year: price billed yearly, when offered. from: a starting price.
     * shared: how many people one subscription covers, for plans with family sharing of the AI.
     */
    const CHECKED = 'November 2026';
    const PLANS = {
        chatgpt: {
            name: 'ChatGPT',
            regular: { plan: 'ChatGPT Plus', month: 20 },
            heavy: { plan: 'ChatGPT Pro', month: 100, from: true },
            note: 'Each person needs their own plan.',
        },
        claude: {
            name: 'Claude',
            regular: { plan: 'Claude Pro', month: 20, year: 200 },
            heavy: { plan: 'Claude Max', month: 100 },
            note: 'Each person needs their own plan.',
        },
        gemini: {
            name: 'Gemini',
            regular: { plan: 'Google AI Pro', month: 19.99, year: 199.99, shared: 6 },
            heavy: { plan: 'Google AI Ultra', month: 99.99, from: true, shared: 6 },
            note: 'One plan can be shared with up to five others in your Google family group.',
        },
        copilot: {
            name: 'Microsoft Copilot',
            regular: { plan: 'Microsoft 365 Personal', month: 9.99, year: 99.99 },
            heavy: { plan: 'Microsoft 365 Premium', month: 19.99, year: 199.99 },
            note: 'Includes Word, Excel, Outlook, and storage. On a Family plan only the owner gets Copilot, so each person needs their own plan.',
        },
    };

    const money = value => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

    /** The plan, number of subscriptions, and cost for one assistant. */
    function planCost(key, usage, people, yearly) {
        const info = PLANS[key];
        if (usage === 'light') return { key, name: info.name, plan: 'Free plan', count: people, perMonth: 0, perYear: 0, yearly: false, from: false, note: 'The free plan has daily limits, but is enough for a few questions a week.' };
        const plan = info[usage];
        const count = Math.ceil(people / (plan.shared || 1));
        const useYear = yearly && !!plan.year;
        const perYear = count * (useYear ? plan.year : plan.month * 12);
        return { key, name: info.name, plan: plan.plan, count, perMonth: perYear / 12, perYear, yearly: useYear, from: !!plan.from, note: info.note, monthlyOnly: yearly && !plan.year };
    }

    function compareCosts(usage, people, yearly) {
        return Object.keys(PLANS).map(key => planCost(key, usage, people, yearly));
    }

    webui.define('app-cost-calculator', {
        preload: 'flex switch cards card',
        connected() {
            this.render();
        },
        async render() {
            const t = this;
            const wrap = webui.create('webui-flex', { column: true, gap: 'var(--padding)' });
            const choice = (label, options, value) => {
                const pick = webui.create('webui-switch', { label });
                pick.setOptions(JSON.stringify(options.map(([v, l]) => ({ value: v, label: l }))));
                if (value) pick.setAttribute('value', value);
                const row = webui.create('webui-flex', { column: true, gap: '0.25rem' });
                row.append(webui.create('strong', { text: label }), pick);
                wrap.append(row);
                return pick;
            };
            t._usage = choice('How much will you use it?', [
                ['light', 'A few times a week'],
                ['regular', 'Most days'],
                ['heavy', 'All day, for big jobs'],
            ], 'regular');
            t._people = choice('How many people?', [['1', 'Just me'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5'], ['6', '6']]);
            t._billing = choice('How will you pay?', [['month', 'Monthly'], ['year', 'Yearly, where offered']]);
            t._summary = webui.create('p', { class: 'cost-summary', 'aria-live': 'polite' });
            t._cards = webui.create('webui-cards', { 'card-width': '240', class: 'cost-cards' });
            wrap.append(t._summary, t._cards, webui.create('p', { class: 'cost-checked', text: `US prices before tax, checked in ${CHECKED}. Prices change, so confirm them on each company's own pricing page before you buy.` }));
            t.replaceChildren(wrap);

            await customElements.whenDefined('webui-switch');
            wrap.addEventListener('change', () => t.update());
            wrap.addEventListener('input', () => t.update());
            t._ready = true;
            t.update();
        },
        update() {
            const t = this;
            if (!t._ready) return;
            const usage = t._usage.value || 'regular';
            const people = parseInt(t._people.value, 10) || 1;
            const yearly = t._billing.value === 'year';
            const state = `${usage}|${people}|${yearly}`;
            if (state === t._last) return;
            t._last = state;
            const costs = compareCosts(usage, people, yearly);
            const cards = costs.map(cost => {
                const card = webui.create('webui-card', { name: cost.name, theme: 'primary', 'data-assistant': cost.key, class: 'cost-card' });
                const plan = cost.count > 1 && cost.perYear ? `${cost.count} × ${cost.plan}` : cost.plan;
                const from = cost.from ? 'from ' : '';
                card.append(
                    webui.create('strong', { text: plan, class: 'cost-plan' }),
                    webui.create('p', { class: 'cost-month', text: `${from}${money(cost.perMonth)} a month` }),
                    webui.create('p', { class: 'cost-year', text: `${from}${money(cost.perYear)} a year${cost.yearly ? ', paid yearly' : ''}` }),
                );
                if (cost.monthlyOnly) card.append(webui.create('p', { text: 'Only sold monthly.' }));
                card.append(webui.create('p', { class: 'cost-note', text: cost.note }));
                return card;
            });
            t._cards.replaceChildren(...cards);
            if (usage === 'light') {
                t._summary.innerText = 'For a few questions a week, every assistant\'s free plan should be enough. Start there, and pay only when you keep hitting its limits.';
                return;
            }
            const cheapest = costs.reduce((best, cost) => cost.perYear < best.perYear ? cost : best);
            t._summary.innerText = `Lowest cost: ${cheapest.plan}${cheapest.count > 1 ? ` (${cheapest.count} plans)` : ''}, ${cheapest.from ? 'from ' : ''}${money(cheapest.perYear)} a year. Plans differ in their limits and extras, so the lowest cost isn't always the best fit.`;
        },
    });
}
