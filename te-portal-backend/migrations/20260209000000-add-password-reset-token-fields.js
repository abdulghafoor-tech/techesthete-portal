'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    
    await queryInterface.changeColumn('Tokens', 'workspaceId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('Tokens', 'roleId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.changeColumn('Tokens', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('Tokens', 'action', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    
    await queryInterface.addColumn('Tokens', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });

    await queryInterface.addColumn('Tokens', 'type', {
      type: Sequelize.ENUM('workspace_invite', 'password_reset'),
      allowNull: true,
      defaultValue: 'workspace_invite',
    });

    await queryInterface.addColumn('Tokens', 'expiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Tokens', 'userId');
    await queryInterface.removeColumn('Tokens', 'type');
    await queryInterface.removeColumn('Tokens', 'expiresAt');

    await queryInterface.changeColumn('Tokens', 'workspaceId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn('Tokens', 'roleId', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.changeColumn('Tokens', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('Tokens', 'action', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
