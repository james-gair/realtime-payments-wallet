import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title:
      "Mock ID Check API Documentation for Fintech Group Project (Group W09ACHERRY)",
    version: "1.0.0",
    description:
      "This is the API documentation for mocking an id check service.",
  },
  servers: [
    {
      url: "http://localhost:4001",
    },
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
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
