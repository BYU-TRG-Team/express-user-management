import bcrypt from "bcrypt";
import { getMockReq, getMockRes } from "@jest-mock/express";
import { Role } from "@typings/auth";
import dependencyInjection from "@di";
import * as mockConstants from "@tests/constants";

jest.mock("pg");

describe("tests updateUser method", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("should update the user profile once with username, email, name, and password", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        name: "TEST",
        password: "TEST",
        roleId: Role.Admin
      },
      params: {
        id: "TEST",
      },
      role: Role.User,
      userId: "TEST"
    });
    const { res } = getMockRes();

    jest.spyOn(dependencyContainer.DB.objects.User, "setAttributes");

    await dependencyContainer.UserController.updateUser(req, res);

    expect(dependencyContainer.DB.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    const mockSetAttributesCall = (dependencyContainer.DB.objects.User.setAttributes as jest.Mock).mock.calls[0];
    expect(mockSetAttributesCall[0]).toBe(req.params.id);
    Object.keys(mockSetAttributesCall[0]).forEach((attr: string, index: number) => {
      const correspondingValue = mockSetAttributesCall[1][index];

      if (attr !== "password") {
        expect(correspondingValue).toBe(req.body[attr]);
      } else {
        expect(bcrypt.compareSync(
          req.body.password,
          correspondingValue,
        )).toBeTruthy();
      }
    });
  });

  test("should update the user profile once with username, email, name, and password, and then a second time with roleId", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        name: "TEST",
        password: "TEST",
        roleId: Role.Admin
      },
      params: {
        id: "TEST",
      },
      role: Role.Admin,
      userId: "TEST"
    });
    const { res } = getMockRes();

    jest.spyOn(dependencyContainer.DB.objects.User, "setAttributes");

    await dependencyContainer.UserController.updateUser(req, res);

    expect(dependencyContainer.DB.objects.User.setAttributes).toHaveBeenCalledTimes(2);
    const mockSetAttributesCall = (dependencyContainer.DB.objects.User.setAttributes as jest.Mock).mock.calls[0];
    expect(mockSetAttributesCall[0]).toBe(req.params.id);
    Object.keys(mockSetAttributesCall[0]).forEach((attr: string, index: number) => {
      const correspondingValue = mockSetAttributesCall[1][index];

      if (attr !== "password") {
        expect(correspondingValue).toBe(req.body[attr]);
      } else {
        expect(bcrypt.compareSync(
          req.body.password,
          correspondingValue,
        )).toBeTruthy();
      }
    });

    expect(dependencyContainer.DB.objects.User.setAttributes).toHaveBeenLastCalledWith(
      req.params.id,
      {
        "role_id": req.body.roleId
      }
    );
  });

  test("should update the user profile once with roleId", async () => {
    const dependencyContainer = dependencyInjection(mockConstants.MOCK_INIT_OPTIONS);
    const req = getMockReq({
      body: {
        username: "TEST",
        email: "TEST",
        name: "TEST",
        password: "TEST",
        roleId: Role.Admin
      },
      params: {
        id: "TEST",
      },
      role: Role.Admin,
      userId: "FOO"
    });
    const { res } = getMockRes();

    jest.spyOn(dependencyContainer.DB.objects.User, "setAttributes");

    await dependencyContainer.UserController.updateUser(req, res);

    expect(dependencyContainer.DB.objects.User.setAttributes).toHaveBeenCalledTimes(1);
    expect(dependencyContainer.DB.objects.User.setAttributes).toHaveBeenLastCalledWith(
      req.params.id,
      {
        "role_id": req.body.roleId
      }
    );
  });
});
