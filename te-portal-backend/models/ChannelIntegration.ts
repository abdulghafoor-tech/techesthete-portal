import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ChannelIntegration extends Model {
  public id!: number;
  public channelId!: number;
  public integrationType!: string;
  public userId!: number;
  public config!: any;
  public isActive!: boolean;
  public lastSyncAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelIntegration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'channel_id',
    },
    integrationType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'integration_type',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      field: 'last_sync_at',
    },
  },
  {
    sequelize,
    tableName: 'channel_integrations',
    underscored: true,
  }
);

export default ChannelIntegration;
