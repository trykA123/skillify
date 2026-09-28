import { db, nextId } from "../db.js";
export function addCustomer({ name, email, region = "US" }) {
  const customer = { id: nextId("cus"), name, email, region };
  db.customers.set(customer.id, customer);
  return customer;
}
export const getCustomer = (id) => db.customers.get(id) ?? null;
