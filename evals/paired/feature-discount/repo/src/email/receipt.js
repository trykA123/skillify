import { renderInvoice } from "../invoices/invoice.js";
import { getCustomer } from "../customers/customers.js";

export function receiptEmail(order) {
  const customer = getCustomer(order.customerId);
  return { to: customer.email, subject: `Your receipt for order ${order.id}`, text: `Thanks for your order!\n\n${renderInvoice(order)}` };
}
