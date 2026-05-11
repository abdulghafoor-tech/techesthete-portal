import fs from "fs";
import path from "path";
import sequelize from "../config/database";

const db: any = {};

fs.readdirSync(__dirname)
  .filter((file) => file.endsWith(".ts") && file !== "index.ts")
  .forEach((file) => {
    const model = require(path.join(__dirname, file)).default;
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;

export default db;
