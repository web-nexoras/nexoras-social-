const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Jakariya Unode API",
    version: "1.0.0",
    description: "Auth, Friends, Chat, Groups, and Premium Subscription APIs.",
  },
  servers: [{ url: process.env.BASE_URL || "/api/v1" }],
  tags: [
    { name: "Health", description: "Health checks" },
    { name: "Auth", description: "Authentication and profile" },
    { name: "Friends", description: "Friend discovery and requests" },
    { name: "Chat", description: "Direct/group messaging" },
    { name: "Groups", description: "Group management" },
    { name: "Payments", description: "Premium subscriptions (SSL)" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "accTkn" },
    },
    schemas: {
      SignupRequest: {
        type: "object",
        required: ["fullname", "email", "password"],
        properties: {
          fullname: { type: "string", example: "John Doe" },
          email: {
            type: "string",
            format: "email",
            example: "john@example.com",
          },
          password: { type: "string", example: "StrongPass123" },
        },
      },
      SigninRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string", example: "123456" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", example: "NewStrongPass123" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          fullname: { type: "string" },
          address: { type: "string" },
        },
      },
      CreateGroupRequest: {
        type: "object",
        required: ["name", "price"],
        properties: {
          name: { type: "string", example: "Premium Group 1" },
          description: { type: "string" },
          image: { type: "string" },
          price: { type: "number", example: 500 },
          currency: { type: "string", example: "BDT" },
        },
      },
      InitSubscriptionRequest: {
        type: "object",
        required: ["groupId"],
        properties: { groupId: { type: "string" } },
      },
      SendMessageRequest: {
        type: "object",
        properties: {
          text: { type: "string", example: "Hello" },
          attachments: { type: "array", items: { type: "string" } },
        },
      },
      AddMembersRequest: {
        type: "object",
        required: ["userIds"],
        properties: { userIds: { type: "array", items: { type: "string" } } },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: { 200: { description: "OK" } },
      },
    },
    "/health/redis": {
      get: {
        tags: ["Health"],
        summary: "Redis health",
        responses: { 200: { description: "OK" } },
      },
    },

    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: { 201: { description: "Signup successful" } },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: { 200: { description: "OTP verified" } },
      },
    },
    "/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
            },
          },
        },
        responses: { 200: { description: "OTP sent" } },
      },
    },
    "/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "Sign in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SigninRequest" },
            },
          },
        },
        responses: { 200: { description: "Signin successful" } },
      },
    },
    "/auth/signout": {
      post: {
        tags: ["Auth"],
        summary: "Sign out",
        responses: { 200: { description: "Logout successful" } },
      },
    },
    "/auth/refresh-token": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        responses: { 200: { description: "Token refreshed" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Forgot password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ForgotPasswordRequest" },
            },
          },
        },
        responses: { 200: { description: "Reset link sent" } },
      },
    },
    "/auth/reset-password/{token}": {
      post: {
        tags: ["Auth"],
        summary: "Reset password",
        parameters: [
          {
            name: "token",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: { 200: { description: "Password reset" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get profile",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Profile" } },
      },
      put: {
        tags: ["Auth"],
        summary: "Update profile",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
            },
          },
        },
        responses: { 200: { description: "Profile updated" } },
      },
    },

    "/friends/suggestions": {
      get: {
        tags: ["Friends"],
        summary: "Friend suggestions",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
    },
    "/friends/request/{userId}": {
      post: {
        tags: ["Friends"],
        summary: "Send friend request",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 201: { description: "Created" } },
      },
    },
    "/friends/requests/incoming": {
      get: {
        tags: ["Friends"],
        summary: "Incoming requests",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
    },
    "/friends/requests/sent": {
      get: {
        tags: ["Friends"],
        summary: "Sent requests",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
    },
    "/friends/requests/{id}/accept": {
      patch: {
        tags: ["Friends"],
        summary: "Accept request",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Accepted" } },
      },
    },
    "/friends/requests/{id}/reject": {
      patch: {
        tags: ["Friends"],
        summary: "Reject request",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Rejected" } },
      },
    },
    "/friends/requests/{id}/cancel": {
      patch: {
        tags: ["Friends"],
        summary: "Cancel request",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Cancelled" } },
      },
    },
    "/friends": {
      get: {
        tags: ["Friends"],
        summary: "Friends list",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
    },
    "/friends/profile/{userId}": {
      get: {
        tags: ["Friends"],
        summary: "Friend profile",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Profile" } },
      },
    },

    "/chat/conversations": {
      get: {
        tags: ["Chat"],
        summary: "List conversations",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
    },
    "/chat/conversations/direct/{userId}": {
      post: {
        tags: ["Chat"],
        summary: "Create/get direct conversation",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Conversation" } },
      },
    },
    "/chat/conversations/{id}/messages": {
      get: {
        tags: ["Chat"],
        summary: "Get messages",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Messages" } },
      },
      post: {
        tags: ["Chat"],
        summary: "Send message",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendMessageRequest" },
            },
          },
        },
        responses: { 201: { description: "Sent" } },
      },
    },
    "/chat/messages/{id}": {
      delete: {
        tags: ["Chat"],
        summary: "Delete message (sender only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Deleted" } },
      },
    },

    "/groups": {
      get: {
        tags: ["Groups"],
        summary: "List groups",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
      post: {
        tags: ["Groups"],
        summary: "Create group (admin)",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateGroupRequest" },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/groups/{id}": {
      get: {
        tags: ["Groups"],
        summary: "Get group",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Group" } },
      },
      patch: {
        tags: ["Groups"],
        summary: "Update group (admin)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Groups"],
        summary: "Delete group (admin)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Deleted" } },
      },
    },
    "/groups/{id}/members": {
      get: {
        tags: ["Groups"],
        summary: "Get group members",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: { 200: { description: "Members" } },
      },
      post: {
        tags: ["Groups"],
        summary: "Add members (admin, subscribed users only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AddMembersRequest" },
            },
          },
        },
        responses: { 200: { description: "Processed" } },
      },
    },

    "/payments/subscription/init": {
      post: {
        tags: ["Payments"],
        summary: "Init SSL subscription",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InitSubscriptionRequest" },
            },
          },
        },
        responses: { 200: { description: "Session created" } },
      },
    },
    "/payments/subscription/success": {
      post: {
        tags: ["Payments"],
        summary: "SSL success callback",
        responses: { 200: { description: "Success" } },
      },
    },
    "/payments/subscription/fail": {
      post: {
        tags: ["Payments"],
        summary: "SSL fail callback",
        responses: { 200: { description: "Fail" } },
      },
    },
    "/payments/subscription/cancel": {
      post: {
        tags: ["Payments"],
        summary: "SSL cancel callback",
        responses: { 200: { description: "Cancel" } },
      },
    },
    "/payments/my-subscriptions": {
      get: {
        tags: ["Payments"],
        summary: "My subscriptions",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "List" } },
      },
    },
  },
};

module.exports = swaggerSpec;
