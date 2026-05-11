'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update admin email from admin1@gmail.com to abdulghafoor.dev@gmail.com
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET "email" = 'abdulghafoor.dev@gmail.com'
      WHERE "email" = 'admin1@gmail.com'
    `);
    
    console.log('✅ Admin email updated to abdulghafoor.dev@gmail.com');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original email
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET "email" = 'admin1@gmail.com'
      WHERE "email" = 'abdulghafoor.dev@gmail.com'
    `);
  }
};
