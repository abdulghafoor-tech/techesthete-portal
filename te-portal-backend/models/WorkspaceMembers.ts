
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import WorkSpace from "./Workspace";
import Role from "./Role";

class WorkspaceMembers extends Model {
  Role: any;
  WorkSpace: any;
}

WorkspaceMembers.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: "WorkspaceMembers",
  }
);

(WorkspaceMembers as any).associate = (models: any) => {
  WorkspaceMembers.belongsTo(models.User, { foreignKey: "userId", as: "User" });
  models.User.hasMany(WorkspaceMembers, { foreignKey: "userId" });

  WorkspaceMembers.belongsTo(models.WorkSpace, { foreignKey: "workspaceId", as: "WorkSpace" });
  models.WorkSpace.hasMany(WorkspaceMembers, { foreignKey: "workspaceId" });

  WorkspaceMembers.belongsTo(models.Role, { foreignKey: "roleId", as: "Role" });
  models.Role.hasMany(WorkspaceMembers, { foreignKey: "roleId" });
};

export default WorkspaceMembers;