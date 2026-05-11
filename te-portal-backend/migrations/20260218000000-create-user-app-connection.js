'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_app_connections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
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
      appType: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Type of app connection (e.g., gmail, outlook, etc.)',
        field: 'app_type'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Connected email account'
      },
      accessToken: {
        type: Sequelize.TEXT,
        allowNull: false,
        field: 'access_token'
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'refresh_token'
      },
      tokenExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'token_expiry'
      },
      scopes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of granted scopes'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      metadata: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional connection metadata as JSON'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    });

    // Add unique constraint for user + app type + email
    await queryInterface.addIndex('user_app_connections', ['user_id', 'app_type', 'email'], {
      unique: true,
      name: 'unique_user_app_email'
    });

    // Add index for faster lookups
    await queryInterface.addIndex('user_app_connections', ['user_id', 'app_type', 'is_active'], {
      name: 'idx_user_app_active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_app_connections');
  }
};
