import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Role from "./Role";


class User extends Model { }

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
    isInvited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    workspaceName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gmailAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gmailRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gmailTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gmailConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "Users",
  }
);


(User as any).associate = (models: any) => {
  User.belongsTo(models.Role, { foreignKey: "roleId" });
  models.Role.hasMany(User, { foreignKey: "roleId" });
  
  
  if (models.Attachment) {
    User.hasMany(models.Attachment, { 
      foreignKey: "uploadedBy",
      as: "uploadedFiles"
    });
  }
};

export default User;