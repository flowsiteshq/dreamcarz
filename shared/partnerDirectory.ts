export type PartnerDirectoryItem = {
  id: number;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  tags: string | null;
  isActive: number;
};

export type PartnerDirectoryFilters = {
  query?: string;
  category?: string;
};

export function filterPartnerDirectory<T extends PartnerDirectoryItem>(
  items: T[],
  filters: PartnerDirectoryFilters = {},
): T[] {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const category = filters.category?.trim().toLowerCase() ?? "";

  return items.filter(item => {
    if (item.isActive !== 1) return false;
    if (category && category !== "all" && item.category.toLowerCase() !== category) return false;
    if (!query) return true;

    const searchable = [item.name, item.address, item.city, item.state, item.tags ?? ""]
      .join(" ")
      .toLowerCase();
    return searchable.includes(query);
  });
}

export function partnerActivationValue(isActive: boolean): 0 | 1 {
  return isActive ? 1 : 0;
}
