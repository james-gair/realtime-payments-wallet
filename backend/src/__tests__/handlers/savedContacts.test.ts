import sql from "../../database/client";
import { getAccountId } from "../../utils/getAccountId";
import {
  addContact,
  deleteContact,
  getSavedContacts,
  updateContactNickname,
} from "../../handlers/savedContacts";

import * as payidService from "../../services/payidService";
import * as bankService from "../../services/bankAccountService";
import * as usBankService from "../../services/usBankAccountService";

const mockReq = {
  user: { uid: "firebase_uid" },
} as any;

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

jest.mock("../../database/client");
jest.mock("../../utils/getAccountId");
jest.mock("../../services/payidService");
jest.mock("../../services/bankAccountService");
jest.mock("../../services/usBankAccountService");

describe("savedContacts handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAccountId as jest.MockedFunction<typeof getAccountId>).mockResolvedValue(
      "42"
    );
  });

  describe("getSavedContacts", () => {
    it("returns normalised contacts", async () => {
      const res = createMockRes();
      const rows = [
        // sendit account
        {
          id: 1,
          nickname: "Al",
          name: "Alice Smith",
          added_by: "username",
          added_value: "@alice",
          contact_account_id: 7,
          account_username: "alice",
          email: "alice@example.com",
          phone: "0400000000",
          bank_account: null,
        },
        // AU bank account
        {
          id: 2,
          nickname: null,
          name: "Bob AU",
          added_by: "bank_account",
          added_value: "802985-12345678",
          contact_account_id: null,
          account_username: null,
          email: null,
          phone: null,
          bank_account: "802985-12345678",
        },
        // PayID email
        {
          id: 3,
          nickname: null,
          name: "Carol",
          added_by: "email",
          added_value: "carol@example.com",
          contact_account_id: null,
          account_username: null,
          email: "carol@example.com",
          phone: null,
          bank_account: null,
        },
      ];

      (sql as any as jest.Mock).mockResolvedValueOnce(rows);

      await getSavedContacts(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const sent = (res.json as jest.Mock).mock.calls[0][0];
      expect(Array.isArray(sent)).toBe(true);
      // sendit
      expect(sent[0]).toEqual(
        expect.objectContaining({ id: 1, contact_type: "sendit", username: "alice" })
      );
      // AU bank - bsb parsed
      expect(sent[1]).toEqual(
        expect.objectContaining({ id: 2, contact_type: "bank", bsb: "802985" })
      );
      // payid (email)
      expect(sent[2]).toEqual(
        expect.objectContaining({ id: 3, contact_type: "payid", email: "carol@example.com" })
      );
    });
  });

  describe("updateContactNickname", () => {
    it("400 when invalid id", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { contactId: "1", nickname: "X" } } as any;
      await updateContactNickname(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("400 when nickname too long", async () => {
      const res = createMockRes();
      const req = {
        ...mockReq,
        body: { contactId: 1, nickname: "x".repeat(41) },
      } as any;
      await updateContactNickname(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 when contact not found for user", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { contactId: 1, nickname: "Al" } } as any;
      (sql as any as jest.Mock).mockResolvedValueOnce([]); // existingContact
      await updateContactNickname(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("200 on success", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { contactId: 1, nickname: "Al" } } as any;
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([{ id: 1 }]) // existingContact
        .mockResolvedValueOnce([{ id: 1, nickname: "Al", name: "Alice" }]); // update

      await updateContactNickname(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, nickname: "Al", name: "Alice" })
      );
    });
  });

  describe("deleteContact", () => {
    it("400 for invalid id", async () => {
      const res = createMockRes();
      const req = { ...mockReq, params: { contactId: "abc" } } as any;
      await deleteContact(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 when not found", async () => {
      const res = createMockRes();
      const req = { ...mockReq, params: { contactId: "1" } } as any;
      (sql as any as jest.Mock).mockResolvedValueOnce([]); // existingContact
      await deleteContact(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("200 on success", async () => {
      const res = createMockRes();
      const req = { ...mockReq, params: { contactId: "1" } } as any;
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([{ id: 1 }]) // existingContact
        .mockResolvedValueOnce([{ id: 1 }]); // delete
      await deleteContact(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Contact deleted successfully" });
    });
  });

  describe("addContact - account", () => {
    it("400 without searchValue", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "account", nickname: "N" } } as any;
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("404 when account not found", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "account", searchValue: "@nope" } } as any;
      (sql as any as jest.Mock).mockResolvedValueOnce([]); // accountQuery
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("400 when adding self", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "account", searchValue: "@me" } } as any;
      (sql as any as jest.Mock).mockResolvedValueOnce([
        { account_id: 42, username: "me", first_name: "Me", last_name: "", email: "me@e", phone: "040" },
      ]); // accountQuery
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("409 when duplicate exists", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "account", searchValue: "@alice" } } as any;
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([
          { account_id: 7, username: "alice", first_name: "Alice", last_name: "S", email: "a@e", phone: "040" },
        ]) // accountQuery
        .mockResolvedValueOnce([{ id: 99 }]); // existingByContactId
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("200 on success", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "account", searchValue: "@alice" } } as any;
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([
          { account_id: 7, username: "alice", first_name: "Alice", last_name: "S", email: "a@e", phone: "040" },
        ]) // accountQuery
        .mockResolvedValueOnce([]) // existingByContactId
        .mockResolvedValueOnce([]) // existingContact (post-switch)
        .mockResolvedValueOnce([{ id: 55 }]); // insert
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 55, name: expect.any(String) })
      );
    });
  });

  describe("addContact - payid", () => {
    it("409 on duplicate", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "payid", payid: "me@example.com" } } as any;
      (payidService.lookupPayIDContact as jest.Mock).mockResolvedValue({
        name: "Me",
        email: "me@example.com",
        phone: "040",
      });
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([{ id: 10 }]); // existingPayId
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("200 on success", async () => {
      const res = createMockRes();
      const req = { ...mockReq, body: { type: "payid", payid: "me@example.com" } } as any;
      (payidService.lookupPayIDContact as jest.Mock).mockResolvedValue({
        name: "Me",
        email: "me@example.com",
        phone: "040",
      });
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([]) // existingPayId
        .mockResolvedValueOnce([]) // existingContact (post-switch)
        .mockResolvedValueOnce([{ id: 66 }]); // insert
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 66 })
      );
    });
  });

  describe("addContact - bank AU", () => {
    it("400 when missing bsb", async () => {
      const res = createMockRes();
      const req = {
        ...mockReq,
        body: { type: "bank_account", country: "AU", accountNumber: "123" },
      } as any;
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("409 on duplicate", async () => {
      const res = createMockRes();
      const req = {
        ...mockReq,
        body: {
          type: "bank_account",
          country: "AU",
          bsb: "802985",
          accountNumber: "12345678",
          accountHolderName: "Bob AU",
        },
      } as any;
      (bankService.lookupBankAccountContact as jest.Mock).mockResolvedValue({
        name: "Bob AU",
        email: "bob@example.com",
      });
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([]) // lookupBankAccountContact not via sql
        .mockResolvedValueOnce([{ id: 1 }]); // existingBank
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it("200 on success", async () => {
      const res = createMockRes();
      const req = {
        ...mockReq,
        body: {
          type: "bank_account",
          country: "AU",
          bsb: "802985",
          accountNumber: "12345678",
          accountHolderName: "Bob AU",
        },
      } as any;
      (bankService.lookupBankAccountContact as jest.Mock).mockResolvedValue({
        name: "Bob AU",
        email: "bob@example.com",
      });
      (sql as any as jest.Mock)
        .mockResolvedValueOnce([]) // existingBank
        .mockResolvedValueOnce([]) // existingContact (post-switch)
        .mockResolvedValueOnce([{ id: 77 }]); // insert
      await addContact(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 77 })
      );
    });
  });
});


