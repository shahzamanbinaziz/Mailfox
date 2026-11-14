/**
 * Starter template bodies (MJML content sections that go inside `brandLayout`).
 * Phase 0 ships three; Phase 4 adds announcement, digest and plain-text style.
 */
export interface StarterTemplate {
  key: string;
  name: string;
  category: string;
  subject: string;
  preheader: string;
  body: string;
}

const heading = (text: string) =>
  `<mj-text font-size="26px" font-weight="800" line-height="1.25" padding="24px 32px 8px">${text}</mj-text>`;
const para = (text: string) => `<mj-text padding="8px 32px">${text}</mj-text>`;
const button = (label: string, href: string) =>
  `<mj-button href="${href}" align="left" padding="16px 32px 24px">${label}</mj-button>`;

export const starterTemplates: StarterTemplate[] = [
  {
    key: "welcome",
    name: "Welcome",
    category: "Onboarding",
    subject: 'Welcome aboard, {{first_name|"friend"}} 🦊',
    preheader: "Here's what to expect from us — and a little gift to start.",
    body: `<mj-section><mj-column>
      ${heading('Welcome, {{first_name|"friend"}}!')}
      ${para("Thanks for joining us. You'll hear from us about once a week — only the good stuff, never spam.")}
      ${para("{{#if company}}We're excited to work with the team at <strong>{{company}}</strong>.{{else}}We're excited to have you here.{{/if}}")}
      ${button("Get started", "https://example.com/start")}
    </mj-column></mj-section>`,
  },
  {
    key: "newsletter",
    name: "Monthly newsletter",
    category: "Newsletter",
    subject: 'This month at {{company_name|"Mailfox"}}: 3 things worth your time',
    preheader: "Product updates, a customer story and one quick tip.",
    body: `<mj-section><mj-column>
      ${heading("What's new this month")}
      ${para('Hi {{first_name|"there"}}, here is your short monthly round-up.')}
    </mj-column></mj-section>
    <mj-section padding="0 16px"><mj-column>
      <mj-text font-size="18px" font-weight="700" padding="16px 16px 4px">1. Faster dashboards</mj-text>
      <mj-text padding="0 16px 8px">Reports now load twice as fast, even with big lists.</mj-text>
      <mj-text font-size="18px" font-weight="700" padding="16px 16px 4px">2. A customer story</mj-text>
      <mj-text padding="0 16px 8px">How a small bakery grew its list from 200 to 5,000 subscribers.</mj-text>
      <mj-text font-size="18px" font-weight="700" padding="16px 16px 4px">3. Quick tip</mj-text>
      <mj-text padding="0 16px 8px">Send at the recipient's local time to lift open rates.</mj-text>
    </mj-column></mj-section>
    <mj-section><mj-column>${button("Read the full issue", "https://example.com/newsletter")}</mj-column></mj-section>`,
  },
  {
    key: "promo",
    name: "Promotion",
    category: "Promotional",
    subject: '{{first_name|"Hey"}}, 20% off ends Friday',
    preheader: "Your member discount is waiting — no code needed.",
    body: `<mj-section background-color="#FFF4F0" border-radius="12px"><mj-column>
      <mj-text align="center" font-size="14px" font-weight="700" color="#A94000" padding="28px 32px 0" text-transform="uppercase" letter-spacing="1px">Members only</mj-text>
      <mj-text align="center" font-size="44px" font-weight="800" padding="8px 32px">20% off</mj-text>
      <mj-text align="center" padding="0 32px 8px">Everything in the store, until Friday at midnight.</mj-text>
      <mj-button href="https://example.com/shop" padding="16px 32px 28px">Shop the sale</mj-button>
    </mj-column></mj-section>
    <mj-section><mj-column>
      ${para("The discount is applied automatically at checkout. Questions? Just reply to this email.")}
    </mj-column></mj-section>`,
  },
];
