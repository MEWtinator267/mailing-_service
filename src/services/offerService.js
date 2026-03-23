const Offer = require('../models/Offer');
const config = require('../config');
const logger = require('../utils/logger');

const FALLBACK_OFFERS = [
  {
    title: 'Welcome Discount - 15% Off Your First Order',
    description: 'As a valued member, enjoy 15% off your next purchase. Use code WELCOME15 at checkout.',
    discount_percentage: 15,
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cta_url: null,
  },
];

async function getActiveOffers() {
  const source = config.offers.dataSource;

  if (source === 'database') {
    try {
      const today = new Date().toISOString().split('T')[0];
      const offers = await Offer.findAll({
        where: {
          is_active: true,
        },
        order: [['created_at', 'DESC']],
        limit: 5,
      });
      const filtered = offers.filter((o) => o.expiry_date >= today);
      return filtered.length > 0 ? filtered.map((o) => o.toJSON()) : FALLBACK_OFFERS;
    } catch (err) {
      logger.warn('Failed to fetch offers from database, using fallback', { error: err.message });
      return FALLBACK_OFFERS;
    }
  }

  // config_file fallback
  return FALLBACK_OFFERS;
}

module.exports = { getActiveOffers };
