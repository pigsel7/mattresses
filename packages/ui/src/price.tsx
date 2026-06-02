type PriceProps = {
  amount: number;
  currency?: string;
  locale?: string;
};

export function Price({ amount, currency = "RUB", locale = "ru-RU" }: PriceProps) {
  return (
    <span className="ui-price">
      {new Intl.NumberFormat(locale, {
        currency,
        style: "currency"
      }).format(amount)}
    </span>
  );
}
