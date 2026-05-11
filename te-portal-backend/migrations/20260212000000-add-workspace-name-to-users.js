'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'workspaceName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    
    console.log('✅ Added workspaceName column to Users table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'workspaceName');
  }
};
