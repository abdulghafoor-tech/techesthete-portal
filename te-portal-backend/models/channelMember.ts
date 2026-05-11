import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Channel from "./Channel";
import User from "./User";

class ChannelMember extends Model { }

ChannelMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "ChannelMembers",
  }
);


(ChannelMember as any).associate = (models: any) => {
  ChannelMember.belongsTo(models.Channel, {
    foreignKey: "channelId",
  });
  models.Channel.hasMany(ChannelMember, {
    foreignKey: "channelId",
  });
  ChannelMember.belongsTo(models.User, {
    foreignKey: "userId",
  });
  models.User.hasMany(ChannelMember, {
    foreignKey: "userId",
  });
};

export default ChannelMember;
