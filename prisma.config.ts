import 'dotenv/config';
import { defineConfig, env } from "prisma/config";

console.log(env("DB_POSTGRES_PRISMA_URL"));

export default defineConfig({
    // The Rust-compiled schema engine 
    engine: "classic",
    schema: "./prisma/schema.prisma",
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: env("DB_POSTGRES_PRISMA_URL"),
    }
});