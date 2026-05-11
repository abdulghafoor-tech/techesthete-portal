'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add thread-related columns to ChannelMessages
    await queryInterface.addColumn('ChannelMessages', 'parent_message_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ChannelMessages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('ChannelMessages', 'thread_reply_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('ChannelMessages', 'last_thread_reply_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add thread-related columns to DirectMessages
    await queryInterface.addColumn('DirectMessages', 'parent_message_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'DirectMessages',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    await queryInterface.addColumn('DirectMessages', 'thread_reply_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await queryInterface.addColumn('DirectMessages', 'last_thread_reply_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add indexes for better performance
    await queryInterface.addIndex('ChannelMessages', ['parent_message_id'], {
      name: 'idx_channel_messages_parent'
    });

    await queryInterface.addIndex('DirectMessages', ['parent_message_id'], {
      name: 'idx_direct_messages_parent'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('ChannelMessages', 'idx_channel_messages_parent');
    await queryInterface.removeIndex('DirectMessages', 'idx_direct_messages_parent');

    // Remove columns from ChannelMessages
    await queryInterface.removeColumn('ChannelMessages', 'parent_message_id');
    await queryInterface.removeColumn('ChannelMessages', 'thread_reply_count');
    await queryInterface.removeColumn('ChannelMessages', 'last_thread_reply_at');

    // Remove columns from DirectMessages
    await queryInterface.removeColumn('DirectMessages', 'parent_message_id');
    await queryInterface.removeColumn('DirectMessages', 'thread_reply_count');
    await queryInterface.removeColumn('DirectMessages', 'last_thread_reply_at');
  }
};
