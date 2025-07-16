// config/database.ts
import { Sequelize } from "sequelize";
import config from "./index";
import pg from "pg";

// console.log(config, "config");

const sequelize = new Sequelize(
  config.db.name,
  config.db.username,
  config.db.password,

  {
    host: config.db.host,
    port: config.db.port,
    dialect: "postgres",
    logging: config.environment === "development" ? console.log : false,
    dialectModule: pg,
    define: {
      timestamps: true,
      underscored: true,
      // paranoid: true,
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl:
        config.environment === "production"
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
    },
  },
);

export default sequelize;
