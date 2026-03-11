import { vi } from "vitest";

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
};

export function createMockDb() {
  const chain: MockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    set: vi.fn(),
    values: vi.fn(),
    limit: vi.fn(),
  };

  // select().from().where().limit() → resolves to []
  chain.select.mockReturnValue({ from: chain.from });
  chain.from.mockReturnValue({ where: chain.where });
  chain.where.mockReturnValue({ limit: chain.limit });
  chain.limit.mockResolvedValue([]);

  // insert().values() → resolves
  chain.insert.mockReturnValue({ values: chain.values });
  chain.values.mockResolvedValue(undefined);

  // update().set().where() → resolves
  chain.update.mockReturnValue({ set: chain.set });
  chain.set.mockReturnValue({ where: chain.where });

  return chain;
}
