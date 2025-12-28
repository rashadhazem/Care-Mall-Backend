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
      schemas: {
        Store: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: {
              type: "string",
              description: "Store name",
            },
            description: {
              type: "string",
              description: "Store description",
            },
            image: {
              type: "string",
              description: "Image URL"
            }
          },
        },
        Chat: {
          type: "object",
          properties: {
            participants: {
              type: "array",
              items: { type: "string" }
            },
          }
        }
      },
    },
  },
  apis: ["./routes/*.js"], // مكان ملفات الـ routes
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
