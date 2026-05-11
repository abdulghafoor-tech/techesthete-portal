import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class MeetingParticipant extends Model {}

MeetingParticipant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    meetingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'meeting_id',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    responseStatus: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      defaultValue: 'pending',
      allowNull: false,
      field: 'response_status',
    },
  },
  {
    sequelize,
    tableName: "MeetingParticipants",
  }
);

(MeetingParticipant as any).associate = (models: any) => {
  MeetingParticipant.belongsTo(models.Meeting, {
    foreignKey: "meetingId",
    as: "meeting",
  });
  MeetingParticipant.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });
};

export default MeetingParticipant;
