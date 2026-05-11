"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add unique constraint to prevent duplicate channel memberships
    await queryInterface.addConstraint("ChannelMembers", {
      fields: ["channelId", "userId"],
      type: "unique",
      name: "unique_channel_user"
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("ChannelMembers", "unique_channel_user");
  },
};
