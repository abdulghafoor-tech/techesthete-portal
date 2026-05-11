module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to ChannelMessages table
    await queryInterface.addColumn('ChannelMessages', 'parentMessageId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ChannelMessages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('ChannelMessages', 'isEdited', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('ChannelMessages', 'isPinned', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    
    await queryInterface.addColumn('DirectMessages', 'parentMessageId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'DirectMessages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('DirectMessages', 'isEdited', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('DirectMessages', 'isPinned', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
  
    await queryInterface.removeColumn('ChannelMessages', 'parentMessageId');
    await queryInterface.removeColumn('ChannelMessages', 'isEdited');
    await queryInterface.removeColumn('ChannelMessages', 'isPinned');

    
    await queryInterface.removeColumn('DirectMessages', 'parentMessageId');
    await queryInterface.removeColumn('DirectMessages', 'isEdited');
    await queryInterface.removeColumn('DirectMessages', 'isPinned');
  }
};
