import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAppConnectionAttributes {
  id: number;
  userId: number;
  appType: string;
  email: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  scopes?: string;
  isActive: boolean;
  metadata?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserAppConnectionCreationAttributes extends Optional<UserAppConnectionAttributes, 'id' | 'refreshToken' | 'tokenExpiry' | 'scopes' | 'isActive' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class UserAppConnection extends Model<UserAppConnectionAttributes, UserAppConnectionCreationAttributes> implements UserAppConnectionAttributes {
  public id!: number;
  public userId!: number;
  public appType!: string;
  public email!: string;
  public accessToken!: string;
  public refreshToken?: string;
  public tokenExpiry?: Date;
  public scopes?: string;
  public isActive!: boolean;
  public metadata?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserAppConnection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,   
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    appType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'app_type'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'access_token'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token'
    },
    tokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'token_expiry'
    },
    scopes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'user_app_connections',
    timestamps: true,
    underscored: true
  }
);

export default UserAppConnection;
