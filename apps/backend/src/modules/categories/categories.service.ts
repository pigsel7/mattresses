import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma/prisma.service";
import type { AdminCategoryDto } from "./admin-categories.types";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

type AdminCategory = Prisma.CategoryGetPayload<{
  include: {
    parent: {
      select: {
        id: true;
        slug: true;
        name: true;
      };
    };
    _count: {
      select: {
        children: true;
        products: true;
      };
    };
  };
}>;

type AdminCategoryCreateInput = {
  description?: string;
  imageUrl?: string | null;
  name: string;
  parentId?: string | null;
  slug: string;
  sortOrder: number;
};

type AdminCategoryUpdateInput = Partial<AdminCategoryCreateInput>;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });

    return categories.map((category) => this.mapPublicCategory(category));
  }

  async findAllAdmin() {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            slug: true,
            name: true
          }
        },
        _count: {
          select: {
            children: true,
            products: true
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }]
    });

    return categories.map((category) => this.mapAdminCategory(category));
  }

  async findAdminById(id: string) {
    const category = await this.findAdminCategoryOrThrow(id);
    return this.mapAdminCategory(category);
  }

  async createAdmin(input: AdminCategoryCreateInput) {
    const parentId = this.normalizeOptionalString(input.parentId);

    if (parentId) {
      await this.ensureCategoryExists(parentId, "parentId");
    }

    try {
      const category = await this.prisma.category.create({
        data: {
          description: input.description,
          imageUrl: this.normalizeOptionalString(input.imageUrl),
          name: input.name,
          parentId,
          slug: this.parseSlug(input.slug, "slug"),
          sortOrder: input.sortOrder
        },
        include: this.adminCategoryInclude
      });

      return this.mapAdminCategory(category);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async updateAdmin(id: string, input: AdminCategoryUpdateInput) {
    const existing = await this.findAdminCategoryOrThrow(id);
    const parentId = this.normalizeOptionalString(input.parentId);

    if (parentId === id) {
      throw new BadRequestException("Category cannot be its own parent");
    }

    if (parentId) {
      await this.ensureCategoryExists(parentId, "parentId");
      await this.ensureParentChainDoesNotInclude(id, parentId);
    }

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data: {
          description:
            input.description === undefined ? existing.description ?? null : input.description,
          imageUrl:
            input.imageUrl === undefined
              ? existing.imageUrl ?? null
              : this.normalizeOptionalString(input.imageUrl),
          name: input.name ?? existing.name,
          parentId: input.parentId === undefined ? existing.parentId : parentId,
          slug: input.slug === undefined ? existing.slug : this.parseSlug(input.slug, "slug"),
          sortOrder: input.sortOrder ?? existing.sortOrder
        },
        include: this.adminCategoryInclude
      });

      return this.mapAdminCategory(category);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async deleteAdmin(id: string) {
    const category = await this.findAdminCategoryOrThrow(id);

    if (category._count.children > 0) {
      throw new BadRequestException("Cannot delete category with child categories");
    }

    if (category._count.products > 0) {
      throw new BadRequestException("Cannot delete category with products");
    }

    await this.prisma.category.delete({
      where: { id }
    });

    return { ok: true };
  }

  private readonly adminCategoryInclude = {
    parent: {
      select: {
        id: true,
        slug: true,
        name: true
      }
    },
    _count: {
      select: {
        children: true,
        products: true
      }
    }
  } satisfies Prisma.CategoryInclude;

  private parseSlug(value: string, field: string) {
    const result = slugSchema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return result.data;
  }

  private normalizeOptionalString(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value?.trim();

    return trimmed ? trimmed : null;
  }

  private mapPublicCategory(category: PublicCategory) {
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description ?? undefined,
      imageUrl: category.imageUrl ?? undefined,
      sortOrder: category.sortOrder
    };
  }

  private mapAdminCategory(category: AdminCategory): AdminCategoryDto {
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description ?? undefined,
      imageUrl: category.imageUrl ?? undefined,
      sortOrder: category.sortOrder,
      parentId: category.parentId,
      parent: category.parent ?? null,
      productsCount: category._count.products,
      childrenCount: category._count.children,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString()
    };
  }

  private async findAdminCategoryOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: this.adminCategoryInclude
    });

    if (!category) {
      throw new NotFoundException("Category not found");
    }

    return category;
  }

  private async ensureCategoryExists(id: string, field: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!category) {
      throw new BadRequestException(`Unknown ${field}`);
    }
  }

  private async ensureParentChainDoesNotInclude(
    categoryId: string,
    parentId: string
  ) {
    let currentParentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new BadRequestException("Category parent chain contains a cycle");
      }

      if (visited.has(currentParentId)) {
        throw new BadRequestException("Category parent chain contains a cycle");
      }

      visited.add(currentParentId);

      const current: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      });

      currentParentId = current?.parentId ?? null;
    }
  }

  private handlePrismaError(error: unknown) {
    if (typeof error !== "object" || error === null) {
      return;
    }

    const code = "code" in error ? (error as { code?: string }).code : undefined;

    if (code === "P2002") {
      throw new BadRequestException("Unique field already exists");
    }
  }
}
