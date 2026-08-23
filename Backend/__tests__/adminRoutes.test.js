const request = require("supertest");
const express = require("express");

jest.mock("../models/adminModel");
jest.mock("bcryptjs");
jest.mock("../helpers/generateAdminsToken", () => ({
  generateAdminsToken: jest.fn(() => "mock-token"),
}));

const adminRoutes = require("../routes/adminRoutes");

describe("adminRoutes", () => {
  const app = express();
  app.use(express.json());
  app.use("/api/admins", adminRoutes);

  it("blocks POST /owner/create when bootstrap is disabled", async () => {
    delete process.env.ALLOW_OWNER_BOOTSTRAP;

    const res = await request(app)
      .post("/api/admins/owner/create")
      .send({ name: "Owner", email: "owner@example.com", password: "secret123" });

    expect(res.status).toBe(403);
  });
});
