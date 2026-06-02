import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import { OrderStatus, ProductStatus, Prisma } from "@prisma/client";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../../prisma/prisma.service";
import type { AdminOrderDto } from "./admin-orders.types";
import type { CreateOrderInput } from "./dto/create-order.schema";

type AdminOrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: {
      orderBy: {
        createdAt: "asc";
      };
    };
  };
}>;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService
  ) {}

  async create(input: CreateOrderInput) {
    const quantities = this.mergeQuantities(input.items);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: Array.from(quantities.keys()) },
        status: ProductStatus.ACTIVE
      },
      select: {
        id: true,
        price: true,
        currency: true,
        sku: true,
        slug: true,
        title: true
      }
    });

    if (products.length !== quantities.size) {
      throw new BadRequestException("Some products are unavailable");
    }

    const currency = products[0]?.currency ?? "RUB";

    if (products.some((product) => product.currency !== currency)) {
      throw new BadRequestException("Order items must use one currency");
    }

    const orderItems = products.map((product) => {
      const quantity = quantities.get(product.id) ?? 0;
      const unitPrice = new Prisma.Decimal(product.price);
      const totalPrice = unitPrice.mul(quantity);

      return {
        productId: product.id,
        productSnapshotName: product.title,
        productSnapshotSku: product.sku,
        productSnapshotSlug: product.slug,
        quantity,
        totalPrice,
        unitPrice
      };
    });
    const totalAmount = orderItems.reduce(
      (sum, item) => sum.add(item.totalPrice),
      new Prisma.Decimal(0)
    );
    const orderNumber = await this.createOrderNumber();

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        comment: input.comment,
        currency,
        totalAmount,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    });
    const ownerEmail = await this.getOwnerEmail();

    await this.notifyOwner({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      comment: order.comment,
      currency: order.currency,
      ownerEmail,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        title: item.productSnapshotName,
        sku: item.productSnapshotSku,
        slug: item.productSnapshotSlug,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt.toISOString()
    };
  }

  async findAllAdmin(status?: string) {
    const parsedStatus = this.parseOptionalStatus(status);
    const orders = await this.prisma.order.findMany({
      where: parsedStatus ? { status: parsedStatus } : undefined,
      include: this.adminOrderInclude,
      orderBy: [{ createdAt: "desc" }]
    });

    return orders.map((order) => this.mapAdminOrder(order));
  }

  async findAdminById(id: string) {
    const order = await this.findAdminOrderOrThrow(id);
    return this.mapAdminOrder(order);
  }

  async updateStatusAdmin(id: string, status: OrderStatus) {
    await this.findAdminOrderOrThrow(id);

    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: this.adminOrderInclude
    });

    return this.mapAdminOrder(order);
  }

  private readonly adminOrderInclude = {
    items: {
      orderBy: {
        createdAt: "asc"
      }
    }
  } satisfies Prisma.OrderInclude;

  private parseOptionalStatus(status?: string) {
    if (!status) {
      return undefined;
    }

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException("Invalid order status");
    }

    return status as OrderStatus;
  }

  private async findAdminOrderOrThrow(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.adminOrderInclude
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  private mapAdminOrder(order: AdminOrderWithItems): AdminOrderDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      deliveryAddress: order.deliveryAddress,
      comment: order.comment,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      itemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        productSnapshotName: item.productSnapshotName,
        productSnapshotSku: item.productSnapshotSku,
        productSnapshotSlug: item.productSnapshotSlug,
        productId: item.productId
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    };
  }

  private async getOwnerEmail() {
    const setting = await this.prisma.shopSetting.findUnique({
      where: { key: "owner_email" },
      select: { value: true }
    });

    return setting?.value;
  }

  private async notifyOwner(
    input: Parameters<MailService["sendOrderCreated"]>[0]
  ) {
    try {
      await this.mailService.sendOrderCreated(input);
    } catch (error) {
      this.logger.error("Failed to send order notification", error);
    }
  }

  private mergeQuantities(items: CreateOrderInput["items"]) {
    const quantities = new Map<string, number>();

    for (const item of items) {
      quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    }

    return quantities;
  }

  private async createOrderNumber() {
    const date = new Date();
    const datePart = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("");
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate())
        }
      }
    });

    return `${datePart}-${String(count + 1).padStart(4, "0")}`;
  }
}
