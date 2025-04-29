
export function formatShippingEta(etaDate: string | null): string {
  if (!etaDate) return 'Pending';
  
  const eta = new Date(etaDate);
  const now = new Date();
  
  if (eta < now) {
    return 'Delivered';
  }
  
  const diffTime = Math.abs(eta.getTime() - now.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  }
  return `${diffHours}h ${Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))}m`;
}
