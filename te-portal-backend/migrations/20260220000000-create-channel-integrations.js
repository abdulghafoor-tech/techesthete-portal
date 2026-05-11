'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('channel_integrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      channelId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Channels',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'channel_id'
      },
      integrationType: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'integration_type'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id'
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      lastSyncAt: {
        type: Sequelize.DATE,
        field: 'last_sync_at'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });

    await queryInterface.addIndex('channel_integrations', ['channel_id']);
    await queryInterface.addIndex('channel_integrations', ['user_id']);
    await queryInterface.addIndex('channel_integrations', ['integration_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('channel_integrations');
  }
};
