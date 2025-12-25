const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "API documentation using Swagger for the E-commerce project",
    },
    servers: [
      {
        url: "http://localhost:8000/api/v1",
      },
    ],
   components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ["./routes/*.js"], // مكان ملفات الـ routes
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
