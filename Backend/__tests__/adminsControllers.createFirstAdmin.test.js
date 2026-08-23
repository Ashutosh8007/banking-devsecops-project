const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");
const { createFirstAdmin } = require("../controllers/adminsControllers");

jest.mock("../models/adminModel");
jest.mock("bcryptjs");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe("createFirstAdmin (owner bootstrap)", () => {
  const originalEnv = process.env.ALLOW_OWNER_BOOTSTRAP;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.ALLOW_OWNER_BOOTSTRAP = originalEnv;
  });

  it("blocks the request with 403 when ALLOW_OWNER_BOOTSTRAP is not set", async () => {
    delete process.env.ALLOW_OWNER_BOOTSTRAP;
    const req = { body: { name: "Owner", email: "owner@example.com", password: "secret123" } };
    const res = mockRes();

    await createFirstAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Admin.create).not.toHaveBeenCalled();
  });

  it("blocks the request with 403 when ALLOW_OWNER_BOOTSTRAP is false", async () => {
    process.env.ALLOW_OWNER_BOOTSTRAP = "false";
    const req = { body: { name: "Owner", email: "owner@example.com", password: "secret123" } };
    const res = mockRes();

    await createFirstAdmin(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("creates the owner admin when ALLOW_OWNER_BOOTSTRAP is true", async () => {
    process.env.ALLOW_OWNER_BOOTSTRAP = "true";
    const req = { body: { name: "Owner", email: "owner@example.com", password: "secret123" } };
    const res = mockRes();

    bcrypt.hash.mockResolvedValue("hashedpassword");
    Admin.create.mockResolvedValue({
      id: "1",
      admin_name: "Owner",
      email: "owner@example.com",
      role: "owner",
    });

    await createFirstAdmin(req, res);

    expect(Admin.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
