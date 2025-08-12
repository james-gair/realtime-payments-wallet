import { getCategories, deleteCategory, addCategory } from "../../handlers/transactions";
import sql from '../../database/client';

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRes = createMockRes();

jest.mock("../../database/client");

describe("transactions backend", () => {
	beforeEach(() => {
    jest.clearAllMocks();
  });

  it('test retrieving Categories', async () => {

    (sql as unknown as jest.Mock).mockResolvedValue([
      { category_id: 1, category: 'Groceries', parent: null },
      { category_id: 2, category: 'Salary', parent: null },
      { category_id: 3, category: 'Electricity', parent: null },
    ]);

    await getCategories({} as any, mockRes as any);

    expect(mockRes.json).toHaveBeenCalledWith({
      categories: [
        { category_id: 1, category: 'Groceries', parent: null },
        { category_id: 2, category: 'Salary', parent: null },
        { category_id: 3, category: 'Electricity', parent: null },
      ],
    });
  });

  
	it('removes a category from a transaction', async () => {
		(sql as unknown as jest.Mock).mockResolvedValueOnce([
			{ category: ['Salary', 'Electricity'] }
		]);

		const mockReq = {
			params: { transactionId: '1' },
			body: { category: ['Groceries'] }
		} as any;

		await deleteCategory(mockReq, mockRes);

		const sqlCallArgs = (sql as unknown as  jest.Mock).mock.calls[0];
		expect(sqlCallArgs[0].join('')).toContain('UPDATE transactions');
		expect(mockRes.json).toHaveBeenCalledWith({
			categories: [{ category: ['Salary', 'Electricity'] }]
		});
	});

	it('adding a category to a transaction', async () => {
		(sql as unknown as jest.Mock).mockResolvedValueOnce([
					{ category: ['Salary', 'Electricity'] }
		]);

				const mockReq = {
					params: { transactionId: '1' },
					body: { category: ['Groceries'] }
				} as any;

				await addCategory(mockReq, mockRes);

				const sqlCallArgs = (sql as unknown as  jest.Mock).mock.calls[0];
				expect(sqlCallArgs[0].join('')).toContain('UPDATE transactions');
				expect(mockRes.json).toHaveBeenCalledWith({
					categories: [{ category: ['Salary', 'Electricity'] }]
				});
			});
});
