import { config as loadEnv } from "dotenv";
import { defineConfig } from "cypress";

loadEnv({ path: ".env.local" });
import { registerDbTasks } from "./cypress/support/tasks";

export default defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "mochawesome-report",
    overwrite: false,
    html: false,
    json: true,
  },
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      registerDbTasks(on);
      return config;
    },
  },
});
