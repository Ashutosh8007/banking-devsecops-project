const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");
const { adminLogin } = require("../controllers/adminsControllers");

jest.mock("../models/adminModel");
jest.mock("bcryptjs");
jest.mock("../helpers/generateAdminsToken", () => ({
  generateAdminsToken: jest.fn(() => "mock-token"),
}));

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe("adminLogin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when email or password is missing", async () => {
    const req = { body: { email: "" } };
    const res = mockRes();

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("logs in successfully with correct credentials", async () => {
    const req = { body: { email: "admin@example.com", password: "secret123" } };
    const res = mockRes();

    Admin.findOne.mockResolvedValue({
      id: "1",
      email: "admin@example.com",
      admin_name: "Admin User",
      role: "admin",
      password: "hashedpassword",
    });
    bcrypt.compare.mockResolvedValue(true);

    await adminLogin(req, res);

    expect(Admin.findOne).toHaveBeenCalledWith({ email: "admin@example.com" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects login with incorrect password", async () => {
    const req = { body: { email: "admin@example.com", password: "wrongpass" } };
    const res = mockRes();

    Admin.findOne.mockResolvedValue({
      id: "1",
      email: "admin@example.com",
      admin_name: "Admin User",
      role: "admin",
      password: "hashedpassword",
    });
    bcrypt.compare.mockResolvedValue(false);

    await adminLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("safely rejects NoSQL injection style email payloads (regression test)", async () => {
    const req = {
      body: { email: { $gt: "" }, password: "anything" },
    };
    const res = mockRes();

    Admin.findOne.mockResolvedValue(null);

    await adminLogin(req, res);

    expect(Admin.findOne).toHaveBeenCalledWith({
      email: expect.any(String),
    });
  });
});
