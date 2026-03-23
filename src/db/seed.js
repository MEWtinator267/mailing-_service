const sequelize = require('../config/database');
const Offer = require('../models/Offer');
const logger = require('../utils/logger');

const offers = [
  {
    title: 'Summer Sale - 30% Off Everything',
    description: 'Enjoy a massive 30% discount on all products in our store. Use code SUMMER30 at checkout.',
    discount_percentage: 30.00,
    expiry_date: '2026-06-30',
    cta_url: 'https://app.company.com/offers/summer-sale',
    is_active: true,
  },
  {
    title: 'Premium Plan Upgrade',
    description: 'Upgrade to our Premium plan and unlock advanced features including unlimited storage, priority support, and exclusive integrations.',
    discount_percentage: 20.00,
    expiry_date: '2026-04-30',
    cta_url: 'https://app.company.com/offers/premium-upgrade',
    is_active: true,
  },
  {
    title: 'Refer a Friend - Get $25 Credit',
    description: 'Invite your friends to join and earn $25 credit for every successful referral. No limit on how much you can earn!',
    discount_percentage: 0.00,
    expiry_date: '2026-12-31',
    cta_url: 'https://app.company.com/referral',
    is_active: true,
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    const count = await Offer.count();
    if (count > 0) {
      logger.info('Offers already seeded, skipping');
      process.exit(0);
    }

    await Offer.bulkCreate(offers);
    logger.info(`Seeded ${offers.length} offers`);

    process.exit(0);
  } catch (err) {
    logger.error('Seed failed', { error: err.message });
    process.exit(1);
  }
}

seed();
