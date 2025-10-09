import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import Sequelize from "sequelize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

const db = {};

// Determine environment
const env = process.env.NODE_ENV || "development";

// Read config.json
const configPath = path.resolve(__dirname, "../config/config.json");
const configFile = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const config = configFile[env];

// Initialize Sequelize
let sequelize;

if (process.env.DATABASE_URL) {
  // ✅ Render / Production
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  // ✅ Local development
  sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: "postgres",
    logging: console.log,
  });
}

// Load all models dynamically
const files = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
  );

for (const file of files) {
  const fileUrl = pathToFileURL(path.join(__dirname, file)).href;
  const { default: modelFunc } = await import(fileUrl);
  const model = modelFunc(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

// Run associations if defined
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
