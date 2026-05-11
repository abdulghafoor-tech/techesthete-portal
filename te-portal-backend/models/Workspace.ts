import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import Role from "./Role";
import User from "./User";


class WorkSpace extends Model { }

WorkSpace.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "Workspaces",
  }
);


(WorkSpace as any).associate = (models: any) => {
  WorkSpace.belongsTo(models.User, { foreignKey: "ownerId" });
  models.User.hasMany(WorkSpace, { foreignKey: "ownerId" });
  
  
  if (models.Attachment) {
    WorkSpace.hasMany(models.Attachment, { 
      foreignKey: "workspaceId",
      as: "files"
    });
  }
};

export default WorkSpace;
