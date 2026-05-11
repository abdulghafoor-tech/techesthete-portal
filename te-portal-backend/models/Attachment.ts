import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Attachment extends Model { }

Attachment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'File path/URL on server'
        },
        filename: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Original filename'
        },
        mimetype: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'File MIME type (e.g., image/png, application/pdf)'
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: 'File size in bytes'
        },
        messageId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Channel message ID (if attached to channel message)'
        },
        directMessageId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Direct message ID (if attached to DM)'
        },
        uploadedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'User ID who uploaded the file'
        },
        uploadedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
            comment: 'When the file was uploaded'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Optional file description'
        },
        workspaceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Workspace ID the file belongs to'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: 'Soft delete flag'
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When the file was deleted'
        },
    },
    {
        sequelize,
        tableName: "Attachments",
        timestamps: true,
        indexes: [
            { fields: ['uploadedBy'] },
            { fields: ['workspaceId'] },
            { fields: ['messageId'] },
            { fields: ['directMessageId'] },
            { fields: ['isDeleted'] },
        ]
    }
);

(Attachment as any).associate = (models: any) => {
    
    Attachment.belongsTo(models.ChannelMessage, { 
        foreignKey: "messageId",
        as: "channelMessage"
    });
    Attachment.belongsTo(models.DirectMessage, { 
        foreignKey: "directMessageId",
        as: "directMessage"
    });
    
    
    Attachment.belongsTo(models.User, { 
        foreignKey: "uploadedBy",
        as: "uploader"
    });
    
    
    if (models.WorkSpace) {
        Attachment.belongsTo(models.WorkSpace, { 
            foreignKey: "workspaceId",
            as: "workspace"
        });
    }
};

export default Attachment;
