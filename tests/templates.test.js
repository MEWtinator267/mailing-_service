const ejs = require('ejs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../src/templates');

async function render(name, data) {
  return ejs.renderFile(path.join(TEMPLATES_DIR, `${name}.ejs`), data);
}

describe('Welcome email template', () => {
  it('renders without error', async () => {
    const html = await render('welcome', {
      appName: 'TestApp',
      dashboardUrl: 'https://app.test.com/dashboard',
      logoUrl: '',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      registeredAt: 'March 14, 2026 at 10:30 AM',
    });

    expect(html).toContain('TestApp');
    expect(html).toContain('John');
    expect(html).toContain('https://app.test.com/dashboard');
  });

  it('renders personalized greeting', async () => {
    const html = await render('welcome', {
      appName: 'Acme',
      dashboardUrl: 'https://acme.com',
      logoUrl: '',
      firstName: 'Alice',
      lastName: '',
      email: 'alice@example.com',
      registeredAt: 'March 14, 2026',
    });

    expect(html).toContain('Hi Alice');
  });
});

describe('Offers email template', () => {
  const sampleOffers = [
    {
      title: 'Summer Sale',
      description: '30% off everything',
      discount_percentage: 30,
      expiry_date: '2026-06-30',
      cta_url: 'https://app.test.com/offers/summer',
    },
  ];

  it('renders without error', async () => {
    const html = await render('offers', {
      appName: 'TestApp',
      logoUrl: '',
      name: 'John',
      offers: sampleOffers,
    });

    expect(html).toContain('Summer Sale');
    expect(html).toContain('30% OFF');
    expect(html).toContain('View Offer');
  });

  it('renders empty offers state', async () => {
    const html = await render('offers', {
      appName: 'TestApp',
      logoUrl: '',
      name: 'John',
      offers: [],
    });

    expect(html).toContain('No active offers');
  });

  it('renders personalized greeting', async () => {
    const html = await render('offers', {
      appName: 'Acme',
      logoUrl: '',
      name: 'Alice',
      offers: sampleOffers,
    });

    expect(html).toContain('Alice');
  });
});
