const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { userLogin } = require("../controllers/usersControllers");

jest.mock("../models/userModel");
jest.mock("bcryptjs");
jest.mock("../helpers/generateUsersToken", () => ({
  generateUsersToken: jest.fn(() => "mock-token"),
}));

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

describe("userLogin", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when email or password is missing", async () => {
    const req = { body: { email: "" } };
    const res = mockRes();

    await userLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("logs in successfully with correct credentials", async () => {
    const req = { body: { email: "test@example.com", password: "secret123" } };
    const res = mockRes();

    User.findOne.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      password: "hashedpassword",
    });
    bcrypt.compare.mockResolvedValue(true);

    await userLogin(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("rejects login with incorrect password", async () => {
    const req = { body: { email: "test@example.com", password: "wrongpass" } };
    const res = mockRes();

    User.findOne.mockResolvedValue({
      id: "1",
      email: "test@example.com",
      name: "Test User",
      password: "hashedpassword",
    });
    bcrypt.compare.mockResolvedValue(false);

    await userLogin(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("safely rejects NoSQL injection style email payloads (regression test)", async () => {
    const req = {
      body: { email: { $gt: "" }, password: "anything" },
    };
    const res = mockRes();

    User.findOne.mockResolvedValue(null);

    await userLogin(req, res);

    // email must be coerced to a string before hitting the query,
    // never passed through as a raw object/operator
    expect(User.findOne).toHaveBeenCalledWith({
      email: expect.any(String),
    });
  });
});
