/** True if the order includes paid DNS setup assistance (add-on or legacy flag). */
export function orderHasDnsHelpPurchase(
  order: { dnsHelp?: boolean; addOns?: unknown } | null | undefined
): boolean {
  if (!order) return false;
  if (order.dnsHelp === true) return true;
  const addOns = order.addOns;
  return Array.isArray(addOns) && addOns.includes("dns");
}
