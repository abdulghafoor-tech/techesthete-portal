'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Meetings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      startTime: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'start_time'
      },
      endTime: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'end_time'
      },
      workspaceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'workspace_id',
        references: {
          model: 'Workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      organizerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'organizer_id',
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meetingLink: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'meeting_link'
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'cancelled', 'completed'),
        defaultValue: 'scheduled',
        allowNull: false
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

    // Create MeetingParticipants table
    await queryInterface.createTable('MeetingParticipants', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      meetingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'meeting_id',
        references: {
          model: 'Meetings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      responseStatus: {
        type: Sequelize.ENUM('pending', 'accepted', 'declined'),
        defaultValue: 'pending',
        allowNull: false,
        field: 'response_status'
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

    // Add indexes
    await queryInterface.addIndex('Meetings', ['workspace_id']);
    await queryInterface.addIndex('Meetings', ['organizer_id']);
    await queryInterface.addIndex('Meetings', ['start_time']);
    await queryInterface.addIndex('MeetingParticipants', ['meeting_id']);
    await queryInterface.addIndex('MeetingParticipants', ['user_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('MeetingParticipants');
    await queryInterface.dropTable('Meetings');
  }
};
