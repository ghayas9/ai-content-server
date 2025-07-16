import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ROGUE FRAMES API",
      version: "1.0.0",
      description: "API documentation for authentication endpoints",
    },
    servers: [
      {
        url: "http://localhost:4000/api/v1",
        description: "Development server",
      },
      // {
      //   url: "https://api.ROGUE FRAMES API.com",
      //   description: "Production server",
      // },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./app/**/*.ts", "./app/routes/auth.routes.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export const swagger = (app: Express) => {
  app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
