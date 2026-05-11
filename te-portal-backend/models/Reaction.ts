import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

class Reaction extends Model { }

Reaction.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        emoji: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        messageId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        directMessageId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        }, 
    },
    {
        sequelize,
        tableName: "Reactions",
    }
);

(Reaction as any).associate = (models: any) => {
    Reaction.belongsTo(models.User, { 
        foreignKey: "userId",
        as: "user"
    });
    Reaction.belongsTo(models.ChannelMessage, { 
        foreignKey: "messageId" 
    });
    Reaction.belongsTo(models.DirectMessage, { 
        foreignKey: "directMessageId" 
    });
};

export default Reaction;
