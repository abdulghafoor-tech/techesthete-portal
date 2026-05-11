import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Workspace from "./Workspace";
import Role from "./Role";
import User from "./User";

class Token extends Model {}

Token.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    roleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    type: {
      type: DataTypes.ENUM("workspace_invite", "password_reset"),
      defaultValue: "workspace_invite",
    },

    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },

    action: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    isExpired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Tokens",
    timestamps: true,
  }
);

Token.belongsTo(Workspace, {
  foreignKey: "workspaceId",
});

Token.belongsTo(Role, {
  foreignKey: "roleId",
});

Token.belongsTo(User, {
  foreignKey: "userId",
});

Workspace.hasMany(Token, {
  foreignKey: "workspaceId",  
});

Role.hasMany(Token, {
  foreignKey: "roleId",
});

User.hasMany(Token, {
  foreignKey: "userId",
});

export default Token;
