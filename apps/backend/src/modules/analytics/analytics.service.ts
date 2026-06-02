import { Injectable } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { TrackPageViewInput } from "./analytics.schema";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async trackPageView(input: TrackPageViewInput) {
    await this.prisma.pageView.create({
      data: {
        path: input.path,
        productId: input.productId,
        referrer: input.referrer
      }
    });

    return { ok: true };
  }

  async getAdminSummary() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalVisits,
      visitsLast30Days,
      ordersByStatus,
      revenue,
      topProducts
    ] = await Promise.all([
      this.prisma.pageView.count(),
      this.prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      this.prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: OrderStatus.CANCELLED } }
      }),
      this.prisma.orderItem.groupBy({
        by: ["productId", "productSnapshotName"],
        _sum: { quantity: true, totalPrice: true },
        where: { productId: { not: null } },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10
      })
    ]);

    return {
      ordersByStatus: ordersByStatus.map((item) => ({
        count: item._count.id,
        revenue: Number(item._sum.totalAmount ?? new Prisma.Decimal(0)),
        status: item.status
      })),
      revenue: Number(revenue._sum.totalAmount ?? new Prisma.Decimal(0)),
      topProducts: topProducts.map((item) => ({
        productId: item.productId,
        quantity: item._sum.quantity ?? 0,
        revenue: Number(item._sum.totalPrice ?? new Prisma.Decimal(0)),
        title: item.productSnapshotName
      })),
      visitsLast30Days,
      totalVisits
    };
  }
}
