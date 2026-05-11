import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import WorkSpace from "./Workspace";

class DirectConversation extends Model { }

DirectConversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userOneId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userTwoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "DirectConversations",
    timestamps: true,
  }
);


(DirectConversation as any).associate = (models: any) => {
  DirectConversation.belongsTo(models.WorkSpace, {
    foreignKey: "workspaceId",
  });
  models.WorkSpace.hasMany(DirectConversation, {
    foreignKey: "workspaceId",
  });
  DirectConversation.belongsTo(models.User, {
    foreignKey: "userOneId",
    as: "userOne",
  });
  DirectConversation.belongsTo(models.User, {
    foreignKey: "userTwoId",
    as: "userTwo",
  });
  models.User.hasMany(DirectConversation, {
    foreignKey: "userOneId",
    as: "userOneConversations",
  });
  models.User.hasMany(DirectConversation, {
    foreignKey: "userTwoId",
    as: "userTwoConversations",
  });
};

export default DirectConversation;
