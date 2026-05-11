module.exports = {
  up: async (queryInterface, Sequelize) => {
    
    const tableDescription = await queryInterface.describeTable('Workspaces');
    
    if (!tableDescription.logo) {
      await queryInterface.addColumn('Workspaces', 'logo', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.ownerId) {
      await queryInterface.addColumn('Workspaces', 'ownerId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Workspaces', 'logo');
    await queryInterface.removeColumn('Workspaces', 'ownerId');
  }
};
