import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import Sequelize from "sequelize";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

// Path to config.json in api/config folder
const configPath = path.resolve(__dirname, "../config/config.json");
const configFile = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const env = process.env.NODE_ENV || "development";
const config = configFile[env];

const db = {};

// Initialize Sequelize
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

// Dynamically import all models (Windows-safe)
const files = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 &&
      file !== basename &&
      file.slice(-3) === ".js" &&
      !file.endsWith(".test.js")
  );

for (const file of files) {
  const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
  const { default: modelFunc } = await import(fileUrl);
  const model = modelFunc(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Setup associations
for (const modelName of Object.keys(db)) {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
