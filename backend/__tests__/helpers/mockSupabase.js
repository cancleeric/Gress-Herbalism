/**
 * Supabase Mock 輔助工具
 * 工單 0063
 */

/**
 * 建立 Supabase query builder 的 Mock
 */
function createQueryBuilderMock(data = null, error = null) {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };

  // 讓最終查詢返回 Promise
  mockChain.then = (resolve) => {
    resolve({ data, error });
  };

  return mockChain;
}

/**
 * 建立 Supabase 客戶端的 Mock
 */
function createSupabaseMock() {
  const queryBuilder = createQueryBuilderMock();

  return {
    from: jest.fn(() => queryBuilder),
    _queryBuilder: queryBuilder,
    _setResponse: (data, error = null) => {
      queryBuilder.single.mockResolvedValue({ data, error });
      queryBuilder.maybeSingle.mockResolvedValue({ data, error });
    },
  };
}

module.exports = {
  createQueryBuilderMock,
  createSupabaseMock,
};
