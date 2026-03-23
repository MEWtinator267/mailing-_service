const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log,
  }
);

async function setupDatabase() {
  try {
    console.log('Connecting to Supabase...');
    await sequelize.authenticate();
    console.log('✅ Connected to Supabase successfully');

    // Import models
    require('./src/models/EmailLog');
    require('./src/models/Offer');

    console.log('Setting up database tables...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables created/updated successfully');

    await sequelize.close();
    console.log('✅ Setup complete!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
