import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Channel from "./Channel";
import User from "./User";

class ChannelMessage extends Model { }

ChannelMessage.init(
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

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    parentMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'parent_message_id',
      references: {
        model: 'ChannelMessages',
        key: 'id'
      }
    },

    threadReplyCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'thread_reply_count',
    },

    lastThreadReplyAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_thread_reply_at',
    },

    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    messageType: {
      type: DataTypes.ENUM('text', 'email'),
      defaultValue: 'text',
      allowNull: false,
      field: 'message_type',
    },

    emailMetadata: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'email_metadata',
    },
  },
  {
    sequelize,
    tableName: "ChannelMessages",
  }
);


(ChannelMessage as any).associate = (models: any) => {
  ChannelMessage.belongsTo(models.Channel, {
    foreignKey: "channelId",
    as: "Channel",
  });
  models.Channel.hasMany(ChannelMessage, {
    foreignKey: "channelId",
  });
  ChannelMessage.belongsTo(models.User, {
    foreignKey: "senderId",
    as: "User",
  });
  models.User.hasMany(ChannelMessage, {
    foreignKey: "senderId",
  });
  // ✅ Add new associations
  ChannelMessage.hasMany(models.Attachment, {
    foreignKey: "messageId",
    as: "attachments",
  });
  ChannelMessage.hasMany(models.Reaction, {
    foreignKey: "messageId",
    as: "reactions",
  });
  // Thread support
  ChannelMessage.belongsTo(ChannelMessage, {
    foreignKey: "parentMessageId",
    as: "parentMessage",
  });
  ChannelMessage.hasMany(ChannelMessage, {
    foreignKey: "parentMessageId",
    as: "replies",
  });
};

export default ChannelMessage;
