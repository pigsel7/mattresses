export type AdminCategoryDto = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  parentId?: string | null;
  parent?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  productsCount: number;
  childrenCount: number;
  createdAt: string;
  updatedAt: string;
};
