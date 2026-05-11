import {Sequelize} from 'sequelize';
import config from './config.json';

const env = "development";
const dbConfig = (config as any)[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    
    logging: false
  }
);
export default sequelize;