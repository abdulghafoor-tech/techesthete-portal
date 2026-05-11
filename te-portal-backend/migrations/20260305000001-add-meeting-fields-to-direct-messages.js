"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add meetingId field to DirectMessages
    await queryInterface.addColumn("DirectMessages", "meetingId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Meetings",
        key: "id",
      },
      onDelete: "SET NULL",
      comment: "Reference to meeting if this is a meeting-related message",
    });

    // Add messageType field to DirectMessages
    await queryInterface.addColumn("DirectMessages", "messageType", {
      type: Sequelize.ENUM("regular", "meeting_invitation", "meeting_response"),
      defaultValue: "regular",
      allowNull: false,
      comment: "Type of message: regular, meeting_invitation, or meeting_response",
    });

    // Add index for faster meeting-related message queries
    await queryInterface.addIndex("DirectMessages", ["meetingId"], {
      name: "direct_messages_meeting_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex("DirectMessages", "direct_messages_meeting_id_idx");
    
    // Remove columns
    await queryInterface.removeColumn("DirectMessages", "messageType");
    await queryInterface.removeColumn("DirectMessages", "meetingId");
  },
};
