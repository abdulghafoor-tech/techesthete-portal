"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "DirectConversations",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        workspaceId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "Workspaces",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        userOneId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Users",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        userTwoId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Users",
            key: "id",
          },
          onDelete: "SET NULL",
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        uniqueKeys: {
          unique_workspace_user_pair: {
            fields: ["workspaceId", "userOneId", "userTwoId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("DirectConversations");
  },
};
