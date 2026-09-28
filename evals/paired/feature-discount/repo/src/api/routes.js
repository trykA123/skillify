import { createOrder, getOrder, markPaid } from "../orders/orders.js";
import { serializeOrder } from "./serialize.js";
import { receiptEmail } from "../email/receipt.js";

export const routes = {
  "POST /orders": (body) => ({ status: 201, body: serializeOrder(createOrder(body)) }),
  "GET /orders/:id": ({ id }) => {
    const order = getOrder(id);
    return order ? { status: 200, body: serializeOrder(order) } : { status: 404 };
  },
  "POST /orders/:id/pay": ({ id }) => {
    const order = markPaid(id);
    return { status: 200, body: serializeOrder(order), email: receiptEmail(order) };
  },
};
