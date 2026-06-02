import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";

type OrderNotificationItem = {
  title: string;
  sku?: string | null;
  slug?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type OrderNotificationInput = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  deliveryAddress: string;
  comment?: string | null;
  totalAmount: number;
  currency: string;
  ownerEmail?: string | null;
  items: OrderNotificationItem[];
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOrderCreated(input: OrderNotificationInput) {
    const config = this.getSmtpConfig();
    const to = input.ownerEmail || this.configService.get<string>("SHOP_OWNER_EMAIL");

    if (!to) {
      this.logger.warn(
        `Order ${input.orderNumber} notification skipped: owner email is not configured`
      );
      return;
    }

    if (!config) {
      this.logger.warn(
        `Order ${input.orderNumber} notification skipped: SMTP is not configured`
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.password
          ? {
              user: config.user,
              pass: config.password
            }
          : undefined
    });

    await transporter.sendMail({
      from: config.from,
      to,
      subject: `Новый заказ ${input.orderNumber}`,
      text: this.renderText(input),
      html: this.renderHtml(input)
    });
  }

  async sendEmailVerification(input: {
    email: string;
    name: string;
    verificationUrl: string;
  }) {
    const config = this.getSmtpConfig();

    if (!config) {
      this.logger.warn(
        `Email verification skipped: SMTP is not configured. URL: ${input.verificationUrl}`
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.password
          ? {
              user: config.user,
              pass: config.password
            }
          : undefined
    });

    await transporter.sendMail({
      from: config.from,
      to: input.email,
      subject: "Подтвердите email",
      text: [
        `Здравствуйте, ${input.name}.`,
        "",
        "Подтвердите email для входа в профиль:",
        input.verificationUrl
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; color: #1d1d1f;">
          <p>Здравствуйте, ${this.escapeHtml(input.name)}.</p>
          <p>Подтвердите email для входа в профиль.</p>
          <p><a href="${this.escapeHtml(input.verificationUrl)}">Подтвердить email</a></p>
        </div>
      `
    });
  }

  private getSmtpConfig() {
    const host = this.configService.get<string>("SMTP_HOST")?.trim();

    if (!host) {
      return null;
    }

    const port = Number(this.configService.get<string>("SMTP_PORT") ?? 587);
    const secureValue = this.configService.get<string>("SMTP_SECURE");
    const secure = secureValue ? secureValue === "true" : port === 465;
    const user = this.configService.get<string>("SMTP_USER")?.trim();
    const password = this.configService.get<string>("SMTP_PASSWORD");
    const from =
      this.configService.get<string>("SMTP_FROM")?.trim() ||
      user ||
      this.configService.get<string>("SHOP_OWNER_EMAIL") ||
      "no-reply@example.com";

    return {
      from,
      host,
      password,
      port,
      secure,
      user
    };
  }

  private renderText(input: OrderNotificationInput) {
    const items = input.items
      .map(
        (item) =>
          `- ${item.title}${item.sku ? ` (${item.sku})` : ""}: ${item.quantity} x ${this.formatMoney(item.unitPrice, input.currency)} = ${this.formatMoney(item.totalPrice, input.currency)}`
      )
      .join("\n");

    return [
      `Новый заказ ${input.orderNumber}`,
      "",
      `Покупатель: ${input.customerName}`,
      `Телефон: ${input.customerPhone}`,
      `Email: ${input.customerEmail || "не указан"}`,
      `Адрес доставки: ${input.deliveryAddress}`,
      `Комментарий: ${input.comment || "нет"}`,
      "",
      "Товары:",
      items,
      "",
      `Итого: ${this.formatMoney(input.totalAmount, input.currency)}`
    ].join("\n");
  }

  private renderHtml(input: OrderNotificationInput) {
    const rows = input.items
      .map(
        (item) => `
          <tr>
            <td>${this.escapeHtml(item.title)}${item.sku ? `<br><small>${this.escapeHtml(item.sku)}</small>` : ""}</td>
            <td align="right">${item.quantity}</td>
            <td align="right">${this.formatMoney(item.unitPrice, input.currency)}</td>
            <td align="right">${this.formatMoney(item.totalPrice, input.currency)}</td>
          </tr>
        `
      )
      .join("");

    return `
      <div style="font-family: Arial, sans-serif; color: #1d1d1f;">
        <h1>Новый заказ ${this.escapeHtml(input.orderNumber)}</h1>
        <p><b>Покупатель:</b> ${this.escapeHtml(input.customerName)}</p>
        <p><b>Телефон:</b> ${this.escapeHtml(input.customerPhone)}</p>
        <p><b>Email:</b> ${this.escapeHtml(input.customerEmail || "не указан")}</p>
        <p><b>Адрес доставки:</b> ${this.escapeHtml(input.deliveryAddress)}</p>
        <p><b>Комментарий:</b> ${this.escapeHtml(input.comment || "нет")}</p>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th align="left">Товар</th>
              <th align="right">Кол-во</th>
              <th align="right">Цена</th>
              <th align="right">Сумма</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size: 18px;"><b>Итого:</b> ${this.formatMoney(input.totalAmount, input.currency)}</p>
      </div>
    `;
  }

  private formatMoney(amount: number, currency: string) {
    return new Intl.NumberFormat("ru-RU", {
      currency,
      style: "currency"
    }).format(amount);
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character] ?? character;
    });
  }
}
