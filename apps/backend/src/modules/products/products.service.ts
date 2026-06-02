import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ProductImageRole, ProductStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { PrismaService } from "../../prisma/prisma.service";
import type {
  AdminProductDto,
  AdminProductImage
} from "./admin-products.types";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const productQuerySchema = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((value) => value || undefined);
const productSortSchema = z
  .enum(["new", "name_asc", "name_desc", "price_asc", "price_desc"])
  .optional()
  .default("new");

const searchSynonyms: Record<string, string[]> = {
  анатомический: ["ортопедический"],
  диван: ["кровать"],
  кроват: ["кровать", "кровати"],
  матрас: ["матрасы", "ортопедический", "анатомический"],
  матрасы: ["матрас", "ортопедический", "анатомический"],
  ортопедический: ["матрас", "анатомический"],
  подушка: ["подушки"],
  подушки: ["подушка"],
  спальное: ["сон", "спальня"],
  сон: ["спальное", "спальня"]
};

type ProductListInput = {
  category?: string;
  query?: string;
  sort?: string;
};

type PublicProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    attributeValues: {
      include: {
        attribute: true;
        selectedOption: true;
      };
    };
  };
}>;

type AdminProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
  };
}>;

type AdminProductCreateInput = {
  categoryId: string;
  currency: string;
  description?: string;
  images: Array<{
    alt?: string;
    role?: ProductImageRole;
    sortOrder?: number;
    url: string;
  }>;
  price: number;
  sku?: string;
  slug: string;
  status: ProductStatus;
  stockQuantity: number;
  title: string;
};

type AdminProductUpdateInput = Partial<AdminProductCreateInput>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(input: ProductListInput = {}) {
    const category = this.parseOptionalSlug(input.category, "category");
    const query = this.parseOptionalQuery(input.query);
    const sort = this.parseOptionalSort(input.sort);
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        ...(category ? { category: { slug: category } } : {})
      },
      include: this.publicProductInclude,
      orderBy: this.getPublicOrderBy(sort)
    });

    const mappedProducts = products.map((product) => this.mapPublicProduct(product));

    if (!query) {
      return mappedProducts;
    }

    return mappedProducts.filter((product) => this.matchesSearchQuery(product, query));
  }

  async findBySlug(slug: string) {
    const parsedSlug = this.parseSlug(slug, "slug");
    const product = await this.prisma.product.findFirst({
      where: {
        slug: parsedSlug,
        status: ProductStatus.ACTIVE
      },
      include: this.publicProductInclude
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return this.mapPublicProduct(product);
  }

  async findAllAdmin() {
    const products = await this.prisma.product.findMany({
      include: this.adminProductInclude,
      orderBy: [{ updatedAt: "desc" }]
    });

    return products.map((product) => this.mapAdminProduct(product));
  }

  async findAdminById(id: string) {
    const product = await this.findAdminProductOrThrow(id);
    return this.mapAdminProduct(product);
  }

  async createAdmin(input: AdminProductCreateInput) {
    try {
      const images = this.prepareImages(input.images);

      const product = await this.prisma.product.create({
        data: {
          categoryId: input.categoryId,
          currency: input.currency.toUpperCase(),
          description: input.description,
          price: new Prisma.Decimal(input.price),
          sku: input.sku,
          slug: this.parseSlug(input.slug, "slug"),
          status: input.status,
          stockQuantity: input.stockQuantity,
          title: input.title,
          images: {
            create: images
          }
        },
        include: this.adminProductInclude
      });

      return this.mapAdminProduct(product);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async updateAdmin(id: string, input: AdminProductUpdateInput) {
    const existing = await this.findAdminProductOrThrow(id);

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            categoryId: input.categoryId ?? existing.categoryId,
            currency: (input.currency ?? existing.currency).toUpperCase(),
            description:
              input.description === undefined ? existing.description ?? null : input.description,
            price:
              input.price === undefined
                ? existing.price
                : new Prisma.Decimal(input.price),
            sku: input.sku === undefined ? existing.sku ?? null : input.sku,
            slug:
              input.slug === undefined ? existing.slug : this.parseSlug(input.slug, "slug"),
            status: input.status ?? existing.status,
            stockQuantity: input.stockQuantity ?? existing.stockQuantity,
            title: input.title ?? existing.title
          }
        });

        if (input.images) {
          await tx.productImage.deleteMany({
            where: { productId: id }
          });

          const preparedImages = this.prepareImages(input.images);

          if (preparedImages.length > 0) {
            await tx.productImage.createMany({
              data: preparedImages.map((image) => ({
                ...image,
                productId: id
              }))
            });
          }
        }

        return tx.product.findUniqueOrThrow({
          where: { id },
          include: this.adminProductInclude
        });
      });

      return this.mapAdminProduct(product);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async deleteAdmin(id: string) {
    await this.findAdminProductOrThrow(id);

    await this.prisma.product.delete({
      where: { id }
    });

    return { ok: true };
  }

  private readonly publicProductInclude = {
    category: true,
    images: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    },
    attributeValues: {
      include: {
        attribute: true,
        selectedOption: true
      }
    }
  } satisfies Prisma.ProductInclude;

  private readonly adminProductInclude = {
    category: true,
    images: {
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    }
  } satisfies Prisma.ProductInclude;

  private parseOptionalSlug(value: string | undefined, field: string) {
    if (!value) {
      return undefined;
    }

    return this.parseSlug(value, field);
  }

  private parseOptionalQuery(value: string | undefined) {
    const result = productQuerySchema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException("Invalid query");
    }

    return result.data;
  }

  private parseOptionalSort(value: string | undefined) {
    const result = productSortSchema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException("Invalid sort");
    }

    return result.data;
  }

  private getPublicOrderBy(sort: z.infer<typeof productSortSchema>): Prisma.ProductOrderByWithRelationInput[] {
    if (sort === "name_asc") {
      return [{ title: "asc" }];
    }

    if (sort === "name_desc") {
      return [{ title: "desc" }];
    }

    if (sort === "price_asc") {
      return [{ price: "asc" }];
    }

    if (sort === "price_desc") {
      return [{ price: "desc" }];
    }

    return [{ createdAt: "desc" }];
  }

  private parseSlug(value: string, field: string) {
    const result = slugSchema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(`Invalid ${field}`);
    }

    return result.data;
  }

  private mapPublicProduct(product: PublicProductWithRelations) {
    const attributes = this.mapAttributes(product);
    const imageUrl = this.getMainImageUrl(product);

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description ?? undefined,
      price: Number(product.price),
      currency: product.currency,
      imageUrl,
      shortDescription: this.getShortDescription(attributes, product.description),
      stockQuantity: product.stockQuantity,
      category: {
        id: product.category.id,
        slug: product.category.slug,
        name: product.category.name,
        description: product.category.description ?? undefined,
        imageUrl: product.category.imageUrl ?? undefined,
        sortOrder: product.category.sortOrder
      },
      attributes
    };
  }

  private matchesSearchQuery(
    product: ReturnType<ProductsService["mapPublicProduct"]>,
    query: string
  ) {
    const productTokens = this.getSearchTokens(
      [
        product.title,
        product.description,
        product.shortDescription,
        product.category?.name,
        product.category?.slug,
        ...(product.attributes ?? []).flatMap((attribute) => [
          attribute.label,
          attribute.value
        ])
      ]
        .filter(Boolean)
        .join(" ")
    );
    const queryTokens = this.expandQueryTokens(this.getSearchTokens(query));

    if (queryTokens.length === 0) {
      return true;
    }

    return queryTokens.every((queryToken) =>
      productTokens.some((productToken) => this.isTokenMatch(productToken, queryToken))
    );
  }

  private expandQueryTokens(tokens: string[]) {
    return Array.from(
      new Set(tokens.flatMap((token) => [token, ...(searchSynonyms[token] ?? [])]))
    );
  }

  private getSearchTokens(value: string) {
    return this.normalizeSearchText(value).split(" ").filter(Boolean);
  }

  private normalizeSearchText(value: string) {
    return value
      .toLowerCase()
      .replaceAll("ё", "е")
      .replace(/[^a-zа-я0-9]+/giu, " ")
      .trim();
  }

  private isTokenMatch(productToken: string, queryToken: string) {
    if (productToken.includes(queryToken) || queryToken.includes(productToken)) {
      return true;
    }

    if (Math.min(productToken.length, queryToken.length) < 4) {
      return false;
    }

    return this.getEditDistance(productToken, queryToken) <= 1;
  }

  private getEditDistance(left: string, right: string) {
    const distances: number[] = Array.from(
      { length: left.length + 1 },
      (_, index) => index
    );

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      let previous = distances[0] ?? 0;
      distances[0] = rightIndex;

      for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
        const current = distances[leftIndex] ?? 0;
        const previousLeft = distances[leftIndex - 1] ?? 0;
        const previousRight = distances[leftIndex] ?? 0;

        distances[leftIndex] =
          left.charAt(leftIndex - 1) === right.charAt(rightIndex - 1)
            ? previous
            : Math.min(previous, previousRight, previousLeft) + 1;
        previous = current;
      }
    }

    return distances[left.length] ?? 0;
  }

  private mapAdminProduct(product: AdminProductWithRelations): AdminProductDto {
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description ?? undefined,
      price: Number(product.price),
      currency: product.currency,
      sku: product.sku ?? undefined,
      status: product.status,
      stockQuantity: product.stockQuantity,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        slug: product.category.slug,
        name: product.category.name,
        description: product.category.description ?? undefined,
        imageUrl: product.category.imageUrl ?? undefined,
        sortOrder: product.category.sortOrder
      },
      images: product.images.map((image) => this.mapAdminImage(image)),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString()
    };
  }

  private mapAdminImage(image: AdminProductWithRelations["images"][number]): AdminProductImage {
    return {
      id: image.id,
      url: image.url,
      alt: image.alt ?? undefined,
      role: image.role,
      sortOrder: image.sortOrder
    };
  }

  private async findAdminProductOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.adminProductInclude
    });

    if (!product) {
      throw new NotFoundException("Product not found");
    }

    return product;
  }

  private prepareImages(
    images: NonNullable<AdminProductCreateInput["images"] | AdminProductUpdateInput["images"]>
  ) {
    return images.map((image, index) => ({
      alt: image.alt ?? null,
      role: image.role ?? ProductImageRole.GALLERY,
      sortOrder: image.sortOrder ?? index,
      url: image.url
    }));
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

  private mapAttributes(product: PublicProductWithRelations) {
    return [...product.attributeValues]
      .sort((left, right) => left.attribute.sortOrder - right.attribute.sortOrder)
      .map((value) => {
        const formattedValue = this.formatAttributeValue(value);

        if (!formattedValue) {
          return null;
        }

        return {
          key: value.attribute.key,
          label: value.attribute.label,
          value: formattedValue,
          unit: value.attribute.unit ?? undefined
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);
  }

  private formatAttributeValue(
    value: PublicProductWithRelations["attributeValues"][number]
  ) {
    if (value.selectedOption) {
      return value.selectedOption.label;
    }

    if (value.valueString) {
      return value.valueString;
    }

    if (value.valueNumber) {
      return Number(value.valueNumber).toLocaleString("ru-RU", {
        maximumFractionDigits: 2
      });
    }

    if (value.valueBoolean !== null) {
      return value.valueBoolean ? "Да" : "Нет";
    }

    if (value.valueJson !== null) {
      return JSON.stringify(value.valueJson);
    }

    return null;
  }

  private getShortDescription(
    attributes: Array<{ label: string; value: string; unit?: string }>,
    fallback?: string | null
  ) {
    const summary = attributes
      .slice(0, 3)
      .map((attribute) =>
        `${attribute.label}: ${attribute.value}${attribute.unit ? ` ${attribute.unit}` : ""}`
      )
      .join(" · ");

    return summary || fallback || undefined;
  }

  private getMainImageUrl(product: PublicProductWithRelations) {
    return (
      product.images.find((image) => image.role === ProductImageRole.MAIN)?.url ??
      product.images[0]?.url ??
      undefined
    );
  }
}
