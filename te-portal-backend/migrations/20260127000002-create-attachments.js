'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attachments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'File path/URL on server'
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Original filename'
      },
      mimetype: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'File MIME type (e.g., image/png, application/pdf)'
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'File size in bytes'
      },
      messageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'ChannelMessages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Channel message ID (if attached to channel message)'
      },
      directMessageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'DirectMessages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Direct message ID (if attached to DM)'
      },
      uploadedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User ID who uploaded the file'
      },
      uploadedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the file was uploaded'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional file description'
      },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Workspace ID the file belongs to'
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Soft delete flag'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the file was deleted'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    
    await queryInterface.addIndex('Attachments', ['uploadedBy'], {
      name: 'attachments_uploaded_by_index'
    });

    await queryInterface.addIndex('Attachments', ['workspaceId'], {
      name: 'attachments_workspace_id_index'
    });

    await queryInterface.addIndex('Attachments', ['messageId'], {
      name: 'attachments_message_id_index'
    });

    await queryInterface.addIndex('Attachments', ['directMessageId'], {
      name: 'attachments_direct_message_id_index'
    });

    await queryInterface.addIndex('Attachments', ['isDeleted'], {
      name: 'attachments_is_deleted_index'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Attachments');
  }
};
