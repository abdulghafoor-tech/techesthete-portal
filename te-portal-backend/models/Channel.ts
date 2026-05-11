import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Workspace from "./Workspace";

class Channel extends Model { }

Channel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("public", "private"),
      defaultValue: "public",
    },
  },
  {
    sequelize,
    tableName: "Channels",
  }
);


(Channel as any).associate = (models: any) => {
  Channel.belongsTo(models.WorkSpace, {
    foreignKey: "workspaceId",
  });
  models.WorkSpace.hasMany(Channel, {
    foreignKey: "workspaceId",
  });
};

export default Channel;
