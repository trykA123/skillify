export async function syncSeats(workspace, seats) {
  // Stripe subscription quantity follows the member count.
  return { subscription: workspace.subscriptionId, quantity: seats };
}
