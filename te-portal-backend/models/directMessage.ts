import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import DirectConversation from "./directConversation";
import User from "./User";

class DirectMessage extends Model { }

DirectMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    conversationId: {
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
        model: 'DirectMessages',
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

    meetingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    messageType: {
      type: DataTypes.ENUM("regular", "meeting_invitation", "meeting_response"),
      defaultValue: "regular",
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "DirectMessages",
    timestamps: true,
  }
);


(DirectMessage as any).associate = (models: any) => {
  DirectMessage.belongsTo(models.DirectConversation, {
    foreignKey: "conversationId",
  });
  models.DirectConversation.hasMany(DirectMessage, {
    foreignKey: "conversationId",
  });
  DirectMessage.belongsTo(models.User, {
    foreignKey: "senderId",
  });
  models.User.hasMany(DirectMessage, {
    foreignKey: "senderId",
  });
  
  DirectMessage.hasMany(models.Attachment, {
    foreignKey: "directMessageId",
    as: "attachments",
  });
  DirectMessage.hasMany(models.Reaction, {
    foreignKey: "directMessageId",
    as: "reactions",
  });
  // Thread support
  DirectMessage.belongsTo(DirectMessage, {
    foreignKey: "parentMessageId",
    as: "parentMessage",
  });
  DirectMessage.hasMany(DirectMessage, {
    foreignKey: "parentMessageId",
    as: "replies",
  });
  
  // Meeting association
  DirectMessage.belongsTo(models.Meeting, {
    foreignKey: "meetingId",
    as: "meeting",
  });
};

export default DirectMessage;
