'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Mark all existing users as verified
    // This is for users that existed before email verification was implemented
    await queryInterface.sequelize.query(`
      UPDATE "Users" 
      SET "isEmailVerified" = true 
      WHERE "isEmailVerified" = false OR "isEmailVerified" IS NULL
    `);
    
    console.log('✅ All existing users marked as verified');
  },

  down: async (queryInterface, Sequelize) => {
    // Optionally revert - but usually we don't want to unverify users
    // await queryInterface.sequelize.query(`
    //   UPDATE "Users" SET "isEmailVerified" = false
    // `);
  }
};
