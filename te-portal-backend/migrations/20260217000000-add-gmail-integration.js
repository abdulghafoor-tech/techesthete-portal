'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'gmailAccessToken', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    await queryInterface.addColumn('Users', 'gmailRefreshToken', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    
    await queryInterface.addColumn('Users', 'gmailTokenExpiry', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    
    await queryInterface.addColumn('Users', 'gmailConnected', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'gmailAccessToken');
    await queryInterface.removeColumn('Users', 'gmailRefreshToken');
    await queryInterface.removeColumn('Users', 'gmailTokenExpiry');
    await queryInterface.removeColumn('Users', 'gmailConnected');
  }
};
