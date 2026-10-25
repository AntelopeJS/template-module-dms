import { resolve } from "node:path";
import { defineConfig } from "@antelopejs/interface-core/config";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: resolve(__dirname, ".env"), quiet: true });

const CLIENT_URL = process.env.DMS_CLIENT_BASE_URL ?? "http://localhost:3001";

export default defineConfig({
  name: "dms-module-playground",
  modules: {
    example: {
      source: {
        type: "local",
        path: "..",
        watchDir: ["src"],
        installCommand: ["pnpm build"],
        reloadCommand: ["pnpm exec tsc"],
      },
    },
    dms: {
      source: {
        type: "package",
        package: "@antelopejs/dms",
        version: ">=0.9.2 <0.10.0",
      },
      config: {
        apiBaseUrl: "${@api.API_PUBLIC_BASE_URL}",
        clientBaseUrl: CLIENT_URL,
        homepage: "/modules/example/welcome",
        meta: {
          title: "DMS module playground",
          description: "Develop a reusable AntelopeJS DMS module",
        },
        auth: {
          jwtSecret: process.env.DMS_JWT_SECRET ?? "dev",
          signInCountry: { database: false },
        },
      },
    },
    mongodb: {
      source: {
        type: "package",
        package: "@antelopejs/mongodb",
        version: "^1.4.2",
      },
      config: {
        url: process.env.MONGODB_URL ?? "mongodb://127.0.0.1:27017",
        database: process.env.MONGODB_DATABASE ?? "dms_module_playground",
      },
    },
    "auth-jwt": {
      source: {
        type: "package",
        package: "@antelopejs/auth-jwt",
        version: "^1.0.3",
      },
      config: { secret: process.env.AUTH_JWT_SECRET ?? "dev" },
    },
    api: {
      source: {
        type: "package",
        package: "@antelopejs/api",
        version: "^1.3.4",
      },
      config: {
        servers: [{ protocol: "http", port: 5010 }],
        cors: { allowedOrigins: [CLIENT_URL, "http://127.0.0.1:3001"] },
      },
    },
    "file-storage-local": {
      source: {
        type: "package",
        package: "@antelopejs/file-storage-local",
        version: "^0.1.8",
      },
      config: {
        storagePath: resolve(__dirname, ".antelope/file-storage"),
        baseUrl: "${@api.API_PUBLIC_BASE_URL}",
        defaultVisibility: "private",
      },
    },
    nodemailer: {
      source: {
        type: "package",
        package: "@antelopejs/nodemailer",
        version: "^0.0.5",
      },
      config: {
        host: process.env.SMTP_HOST ?? "127.0.0.1",
        port: Number(process.env.SMTP_PORT ?? 1025),
        secure: false,
        defaults: { from: "DMS playground <dev@example.test>" },
      },
    },
  },
});
