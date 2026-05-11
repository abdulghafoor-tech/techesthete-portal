'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ChannelMessages', 'message_type', {
      type: Sequelize.STRING,
      defaultValue: 'text',
      allowNull: false
    });

    await queryInterface.addColumn('ChannelMessages', 'email_metadata', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addIndex('ChannelMessages', ['message_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ChannelMessages', 'message_type');
    await queryInterface.removeColumn('ChannelMessages', 'email_metadata');
  }
};
