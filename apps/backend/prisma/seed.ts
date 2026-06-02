import {
  AdminRole,
  AttributeType,
  PrismaClient,
  ProductImageRole,
  ProductStatus,
  UserType
} from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

type AttributeSeed = {
  categorySlug: string;
  key: string;
  label: string;
  type: AttributeType;
  unit?: string;
  isFilterable: boolean;
  sortOrder: number;
  options?: Array<[value: string, label: string]>;
};

type ProductAttributeSeed =
  | { optionValue: string }
  | { valueBoolean: boolean }
  | { valueNumber: string }
  | { valueString: string };

type ProductSeed = {
  slug: string;
  title: string;
  description: string;
  price: string;
  sku: string;
  stockQuantity: number;
  categorySlug: string;
  image: string;
  attributes: Record<string, ProductAttributeSeed>;
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

async function seedSettings() {
  const settings = [
    {
      key: "contact_phone",
      label: "Контактный телефон",
      value: process.env.SHOP_CONTACT_PHONE ?? "+7 000 000-00-00",
      isPublic: true
    },
    {
      key: "shop_address",
      label: "Адрес магазина",
      value: process.env.SHOP_ADDRESS ?? "г. Симферополь",
      isPublic: true
    },
    {
      key: "owner_email",
      label: "Email владельца для уведомлений",
      value: process.env.SHOP_OWNER_EMAIL ?? "owner@example.com",
      isPublic: false
    }
  ];

  for (const setting of settings) {
    await prisma.shopSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";

  await prisma.adminUser.upsert({
    where: { email },
    update: {
      isActive: true,
      emailVerifiedAt: new Date(),
      passwordHash: hashPassword(password),
      role: AdminRole.SUPER_ADMIN,
      userType: UserType.ADMIN
    },
    create: {
      email,
      isActive: true,
      emailVerifiedAt: new Date(),
      passwordHash: hashPassword(password),
      role: AdminRole.SUPER_ADMIN,
      userType: UserType.ADMIN
    }
  });
}

async function seedCategories() {
  const categories = [
    {
      slug: "matrasy",
      name: "Матрасы",
      description: "Ортопедические и анатомические матрасы",
      imageUrl: "/images/categories/matrasy.svg",
      sortOrder: 10
    },
    {
      slug: "krovati",
      name: "Кровати",
      description: "Кровати для спальни разных размеров",
      imageUrl: "/images/categories/krovati.svg",
      sortOrder: 20
    },
    {
      slug: "podushki",
      name: "Подушки",
      description: "Подушки для сна и отдыха",
      imageUrl: "/images/categories/podushki.svg",
      sortOrder: 30
    }
  ];

  const result = new Map<string, string>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });

    result.set(category.slug, saved.id);
  }

  return result;
}

async function seedAttributeDefinitions(categoryIds: Map<string, string>) {
  const definitions: AttributeSeed[] = [
    {
      categorySlug: "matrasy",
      key: "height_cm",
      label: "Высота",
      type: AttributeType.NUMBER,
      unit: "см",
      isFilterable: true,
      sortOrder: 10
    },
    {
      categorySlug: "matrasy",
      key: "firmness",
      label: "Жесткость",
      type: AttributeType.SELECT,
      isFilterable: true,
      sortOrder: 20,
      options: [
        ["soft", "Мягкая"],
        ["medium", "Средняя"],
        ["firm", "Жесткая"]
      ]
    },
    {
      categorySlug: "matrasy",
      key: "sleeping_place",
      label: "Спальное место",
      type: AttributeType.STRING,
      unit: "см",
      isFilterable: true,
      sortOrder: 30
    },
    {
      categorySlug: "krovati",
      key: "frame_material",
      label: "Материал каркаса",
      type: AttributeType.SELECT,
      isFilterable: true,
      sortOrder: 10,
      options: [
        ["wood", "Дерево"],
        ["metal", "Металл"],
        ["ldsp", "ЛДСП"]
      ]
    },
    {
      categorySlug: "krovati",
      key: "has_storage",
      label: "Ящик для белья",
      type: AttributeType.BOOLEAN,
      isFilterable: true,
      sortOrder: 20
    },
    {
      categorySlug: "podushki",
      key: "filler",
      label: "Наполнитель",
      type: AttributeType.STRING,
      isFilterable: true,
      sortOrder: 10
    }
  ];

  const result = new Map<string, string>();

  for (const definition of definitions) {
    const categoryId = categoryIds.get(definition.categorySlug);

    if (!categoryId) {
      continue;
    }

    const saved = await prisma.attributeDefinition.upsert({
      where: {
        categoryId_key: {
          categoryId,
          key: definition.key
        }
      },
      update: {
        label: definition.label,
        type: definition.type,
        unit: definition.unit,
        isFilterable: definition.isFilterable,
        sortOrder: definition.sortOrder
      },
      create: {
        key: definition.key,
        label: definition.label,
        type: definition.type,
        unit: definition.unit,
        isFilterable: definition.isFilterable,
        sortOrder: definition.sortOrder,
        categoryId
      }
    });

    result.set(`${definition.categorySlug}.${definition.key}`, saved.id);

    for (const [value, label] of definition.options ?? []) {
      await prisma.attributeOption.upsert({
        where: {
          attributeId_value: {
            attributeId: saved.id,
            value
          }
        },
        update: { label },
        create: {
          attributeId: saved.id,
          label,
          value
        }
      });
    }
  }

  return result;
}

async function seedProducts(
  categoryIds: Map<string, string>,
  attributeIds: Map<string, string>
) {
  const products: ProductSeed[] = [
    {
      slug: "ortho-comfort-160x200",
      title: "Ortho Comfort 160x200",
      description: "Универсальный матрас средней жесткости для ежедневного сна.",
      price: "35990.00",
      sku: "MAT-ORTHO-160",
      stockQuantity: 12,
      categorySlug: "matrasy",
      image: "/images/seed/ortho-comfort.svg",
      attributes: {
        height_cm: { valueNumber: "22" },
        firmness: { optionValue: "medium" },
        sleeping_place: { valueString: "160x200" }
      }
    },
    {
      slug: "classic-bed-160x200",
      title: "Classic Bed 160x200",
      description: "Кровать с лаконичным каркасом и мягким изголовьем.",
      price: "48990.00",
      sku: "BED-CLASSIC-160",
      stockQuantity: 5,
      categorySlug: "krovati",
      image: "/images/seed/classic-bed.svg",
      attributes: {
        frame_material: { optionValue: "wood" },
        has_storage: { valueBoolean: true }
      }
    },
    {
      slug: "relax-pillow",
      title: "Relax Pillow",
      description: "Подушка с поддержкой шеи и съемным чехлом.",
      price: "3990.00",
      sku: "PIL-RELAX",
      stockQuantity: 20,
      categorySlug: "podushki",
      image: "/images/seed/relax-pillow.svg",
      attributes: {
        filler: { valueString: "Memory foam" }
      }
    }
  ];

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      continue;
    }

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        categoryId,
        description: product.description,
        price: product.price,
        sku: product.sku,
        status: ProductStatus.ACTIVE,
        stockQuantity: product.stockQuantity,
        title: product.title
      },
      create: {
        categoryId,
        currency: "RUB",
        description: product.description,
        price: product.price,
        sku: product.sku,
        slug: product.slug,
        status: ProductStatus.ACTIVE,
        stockQuantity: product.stockQuantity,
        title: product.title
      }
    });

    await prisma.productImage.upsert({
      where: {
        productId_sortOrder: {
          productId: saved.id,
          sortOrder: 0
        }
      },
      update: {
        alt: product.title,
        role: ProductImageRole.MAIN,
        url: product.image
      },
      create: {
        alt: product.title,
        productId: saved.id,
        role: ProductImageRole.MAIN,
        sortOrder: 0,
        url: product.image
      }
    });

    for (const [key, value] of Object.entries(product.attributes)) {
      const attributeId = attributeIds.get(`${product.categorySlug}.${key}`);

      if (!attributeId) {
        continue;
      }

      let selectedOptionId: string | undefined;

      if ("optionValue" in value) {
        const option = await prisma.attributeOption.findUnique({
          where: {
            attributeId_value: {
              attributeId,
              value: value.optionValue
            }
          }
        });
        selectedOptionId = option?.id;
      }

      await prisma.productAttributeValue.upsert({
        where: {
          productId_attributeId: {
            attributeId,
            productId: saved.id
          }
        },
        update: {
          selectedOptionId: selectedOptionId ?? null,
          valueBoolean: "valueBoolean" in value ? value.valueBoolean : null,
          valueJson: null,
          valueNumber: "valueNumber" in value ? value.valueNumber : null,
          valueString: "valueString" in value ? value.valueString : null
        },
        create: {
          attributeId,
          productId: saved.id,
          selectedOptionId,
          valueBoolean: "valueBoolean" in value ? value.valueBoolean : undefined,
          valueNumber: "valueNumber" in value ? value.valueNumber : undefined,
          valueString: "valueString" in value ? value.valueString : undefined
        }
      });
    }
  }
}

async function main() {
  await seedSettings();
  await seedAdmin();
  const categoryIds = await seedCategories();
  const attributeIds = await seedAttributeDefinitions(categoryIds);
  await seedProducts(categoryIds, attributeIds);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
