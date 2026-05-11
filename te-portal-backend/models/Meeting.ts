import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Meeting extends Model {}

Meeting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_time',
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'end_time',
    },
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'workspace_id',
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'organizer_id',
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'meeting_link',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'cancelled', 'completed'),
      defaultValue: 'scheduled',
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "Meetings",
  }
);

(Meeting as any).associate = (models: any) => {
  Meeting.belongsTo(models.WorkSpace, {
    foreignKey: "workspaceId",
    as: "workspace",
  });
  Meeting.belongsTo(models.User, {
    foreignKey: "organizerId",
    as: "organizer",
  });
  Meeting.hasMany(models.MeetingParticipant, {
    foreignKey: "meetingId",
    as: "participants",
    onDelete: 'CASCADE',
  });
};

export default Meeting;
