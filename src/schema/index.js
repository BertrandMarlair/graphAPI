import Sequelize from "sequelize";
import log from "../utils/logger";

import {generateTypeDefs, generateResolvers} from "./utils";

import * as user from "./models/user/index";
import * as commons from "./commons/index";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default async () => {
    let maxReconnect = 20,
        connected = false;
    const sequelize = new Sequelize(
        process.env.POSTGRES_DB,
        process.env.POSTGRES_USER,
        process.env.POSTGRES_PASSWORD,
        {
            dialect: "postgres",
            host: process.env.DB_HOST || "localhost",
            define: {
                underscored: true,
            },
        },
    );

    while (!connected && maxReconnect) {
        try {
            await sequelize.authenticate();
            connected = true;
        } catch (err) {
            log.error("reconnecting in 5 seconds");
            maxReconnect--;
            await sleep(5000);
        }
    }

    if (!connected) {
        return null;
    }

    const models = {
        User: sequelize.import("./models/user/sequelize/index"),
    };

    Object.keys(models).forEach(modelName => {
        if ("associate" in models[modelName]) {
            models[modelName].associate(models);
        }
    });

    models.sequelize = sequelize;
    models.Sequelize = Sequelize;

    return models;
};

const structures = [user, commons];

export const typeDefs = generateTypeDefs(structures);
export const resolvers = generateResolvers(structures);
