export interface ShippingTimelineStep {
  key: 'placed' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'returned';
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
  completed: boolean;
  active: boolean;
  timestamp?: string;
}

export interface LiveShippingTracking {
  orderNumber: string;
  orderStatus: string;
  shippingStatusCode:
    | 'awaiting_confirmation'
    | 'confirmed'
    | 'packing_roasting'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'returned';
  shippingStatusVi: string;
  shippingStatusEn: string;
  carrierName: string;
  trackingCode: string;
  destinationAddress: string;
  estimatedArrivalDate: string | null;
  estimatedArrivalDisplayVi: string;
  estimatedArrivalDisplayEn: string;
  currentLocationVi: string;
  currentLocationEn: string;
  progressPercent: number;
  lastUpdatedAt: string;
  syncedAt: string;
  timeline: ShippingTimelineStep[];
}

function parseSqlDate(raw?: string): Date {
  if (!raw) return new Date();
  const normalized = raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatViDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function detectCarrier(trackingCode: string): string {
  const code = trackingCode.trim().toUpperCase();
  if (!code) return 'ROAR Logistics (Đang điều phối)';
  if (code.startsWith('GHN')) return 'Giao Hàng Nhanh (GHN Express)';
  if (code.startsWith('GHTK')) return 'Giao Hàng Tiết Kiệm (GHTK)';
  if (code.startsWith('VTP')) return 'Viettel Post';
  if (code.startsWith('VN-')) return 'Vietnam Post / Express Partner';
  return 'ROAR Express Partner';
}

function computeTransitDays(address: string): number {
  const lower = address.toLowerCase();
  if (
    lower.includes('hồ chí minh') ||
    lower.includes('ho chi minh') ||
    lower.includes('tp.hcm') ||
    lower.includes('tphcm') ||
    lower.includes('quận')
  ) {
    return 2;
  }
  if (
    lower.includes('hà nội') ||
    lower.includes('ha noi') ||
    lower.includes('đà nẵng') ||
    lower.includes('da nang') ||
    lower.includes('bình dương') ||
    lower.includes('đồng nai') ||
    lower.includes('cần thơ')
  ) {
    return 3;
  }
  return 4;
}

export function buildLiveShippingTracking(order: any): LiveShippingTracking {
  const status = String(order.order_status || 'Pending');
  const trackingCode = String(order.tracking_code || '').trim();
  const address = String(order.shipping_address || '');
  const createdAt = parseSqlDate(order.created_at);
  const updatedAt = parseSqlDate(order.updated_at || order.created_at);
  const now = new Date();
  const syncedAt = now.toISOString();

  const transitDays = computeTransitDays(address);
  let etaIso: string | null = null;
  let etaVi = '';
  let etaEn = '';

  if (status === 'Completed') {
    etaIso = toIsoDate(updatedAt);
    etaVi = `Đã giao thành công ngày ${formatViDate(etaIso)}`;
    etaEn = `Delivered on ${etaIso}`;
  } else if (status === 'Cancelled') {
    etaIso = null;
    etaVi = 'Đơn hàng đã hủy — Không giao vận';
    etaEn = 'Order cancelled — Shipment stopped';
  } else if (status === 'Returned') {
    etaIso = null;
    etaVi = 'Đơn hàng đã hoàn trả về kho ROAR';
    etaEn = 'Shipment returned to ROAR warehouse';
  } else {
    const rawEta = addDays(createdAt, transitDays);
    const minFutureDays = status === 'Shipping' ? 1 : 2;
    const minFloor = addDays(now, minFutureDays);
    const effectiveEta = rawEta.getTime() < minFloor.getTime() ? minFloor : rawEta;
    etaIso = toIsoDate(effectiveEta);
    etaVi = `Dự kiến nhận: ${formatViDate(etaIso)} (09:00 – 18:00)`;
    etaEn = `Estimated arrival: ${etaIso} (09:00 – 18:00)`;
  }

  let shippingStatusCode: LiveShippingTracking['shippingStatusCode'] = 'awaiting_confirmation';
  let shippingStatusVi = 'Chờ xác nhận đơn hàng';
  let shippingStatusEn = 'Awaiting Order Confirmation';
  let currentLocationVi = 'Trung tâm tiếp nhận đơn ROAR COFFEE (TP.HCM)';
  let currentLocationEn = 'ROAR COFFEE Order Desk (Ho Chi Minh City)';
  let progressPercent = 20;

  if (status === 'Confirmed') {
    shippingStatusCode = 'confirmed';
    shippingStatusVi = 'Đã xác nhận · Chuẩn bị rang & đóng gói';
    shippingStatusEn = 'Confirmed · Scheduled for Roast & Pack';
    currentLocationVi = 'Xưởng rang ROAR Roastery — Khu phân bổ đơn';
    currentLocationEn = 'ROAR Roastery Fulfillment Queue';
    progressPercent = 40;
  } else if (status === 'Processing') {
    shippingStatusCode = 'packing_roasting';
    shippingStatusVi = 'Đang rang mới & đóng gói niêm phong';
    shippingStatusEn = 'Freshly Roasting & Sealing Parcel';
    currentLocationVi = 'Xưởng đóng gói ROAR Roastery (TP.HCM)';
    currentLocationEn = 'ROAR Roastery Packing Station (HCMC)';
    progressPercent = 65;
  } else if (status === 'Shipping') {
    shippingStatusCode = 'in_transit';
    shippingStatusVi = 'Đang vận chuyển tới địa chỉ nhận';
    shippingStatusEn = 'In Transit · Out for Delivery';
    currentLocationVi = `Đang trung chuyển tới: ${address || 'Địa chỉ khách hàng'}`;
    currentLocationEn = `In transit toward: ${address || 'Customer destination'}`;
    progressPercent = 85;
  } else if (status === 'Completed') {
    shippingStatusCode = 'delivered';
    shippingStatusVi = 'Giao hàng thành công';
    shippingStatusEn = 'Delivered Successfully';
    currentLocationVi = `Đã giao tại: ${address || 'Địa chỉ người nhận'}`;
    currentLocationEn = `Delivered to: ${address || 'Recipient address'}`;
    progressPercent = 100;
  } else if (status === 'Cancelled') {
    shippingStatusCode = 'cancelled';
    shippingStatusVi = 'Đơn hàng đã hủy';
    shippingStatusEn = 'Order Cancelled';
    currentLocationVi = 'Đơn hàng đã ngừng xử lý';
    currentLocationEn = 'Order processing stopped';
    progressPercent = 0;
  } else if (status === 'Returned') {
    shippingStatusCode = 'returned';
    shippingStatusVi = 'Đã hoàn trả hàng';
    shippingStatusEn = 'Shipment Returned';
    currentLocationVi = 'Đã tiếp nhận hoàn trả tại kho ROAR (TP.HCM)';
    currentLocationEn = 'Returned to ROAR Warehouse (HCMC)';
    progressPercent = 0;
  }

  const stageRank: Record<string, number> = {
    Pending: 1,
    Confirmed: 2,
    Processing: 3,
    Shipping: 4,
    Completed: 5,
    Cancelled: 0,
    Returned: 5,
  };
  const rank = stageRank[status] ?? 1;
  const createdTs = String(order.created_at || '').slice(0, 16);
  const updatedTs = String(order.updated_at || order.created_at || '').slice(0, 16);

  const timeline: ShippingTimelineStep[] = [
    {
      key: 'placed',
      labelVi: 'Tiếp nhận đơn hàng',
      labelEn: 'Order Placed',
      descVi: `Đơn ${order.order_number} đã được ghi nhận trên hệ thống`,
      descEn: `Order ${order.order_number} recorded`,
      completed: rank >= 1 || status === 'Cancelled',
      active: status === 'Pending',
      timestamp: createdTs,
    },
    {
      key: 'confirmed',
      labelVi: 'Xác nhận & Đối soát',
      labelEn: 'Order Confirmed',
      descVi: 'Kiểm tra thông tin nhận hàng và phương thức thanh toán',
      descEn: 'Shipping & payment details verified',
      completed: rank >= 2,
      active: status === 'Confirmed',
      timestamp: rank >= 2 ? updatedTs : undefined,
    },
    {
      key: 'processing',
      labelVi: 'Rang xay & Đóng gói',
      labelEn: 'Roasting & Packing',
      descVi: 'Kiểm tra niêm phong bao bì van 1 chiều & chống sốc',
      descEn: 'One-way valve bag sealing & protective packing',
      completed: rank >= 3,
      active: status === 'Processing',
      timestamp: rank >= 3 ? updatedTs : undefined,
    },
    {
      key: 'shipping',
      labelVi: 'Đang giao vận',
      labelEn: 'In Transit',
      descVi: trackingCode
        ? `Bàn giao ${detectCarrier(trackingCode)} · Mã ${trackingCode}`
        : 'Đang bàn giao đơn vị vận chuyển chuyên tuyến',
      descEn: trackingCode
        ? `Handed to ${detectCarrier(trackingCode)} · ${trackingCode}`
        : 'Dispatching with partner courier',
      completed: rank >= 4,
      active: status === 'Shipping',
      timestamp: rank >= 4 ? updatedTs : undefined,
    },
    {
      key: 'completed',
      labelVi: 'Giao hàng thành công',
      labelEn: 'Delivered',
      descVi: etaIso ? (status === 'Completed' ? `Hoàn tất giao hàng (${etaIso})` : `Dự kiến giao: ${formatViDate(etaIso)}`) : 'Hoàn tất đơn hàng',
      descEn: etaIso ? (status === 'Completed' ? `Delivered on ${etaIso}` : `Est. arrival: ${etaIso}`) : 'Delivery completed',
      completed: status === 'Completed',
      active: status === 'Completed',
      timestamp: status === 'Completed' ? updatedTs : undefined,
    },
  ];

  if (status === 'Cancelled') {
    timeline.push({
      key: 'cancelled',
      labelVi: 'Đơn hàng đã hủy',
      labelEn: 'Cancelled',
      descVi: 'Đơn hàng đã được hủy theo yêu cầu hoặc hết hạn xác nhận',
      descEn: 'Order was cancelled before completion',
      completed: true,
      active: true,
      timestamp: updatedTs,
    });
  } else if (status === 'Returned') {
    timeline.push({
      key: 'returned',
      labelVi: 'Hoàn trả kiện hàng',
      labelEn: 'Returned',
      descVi: 'Kiện hàng đã được hoàn trả về kho ROAR COFFEE',
      descEn: 'Parcel returned to ROAR COFFEE hub',
      completed: true,
      active: true,
      timestamp: updatedTs,
    });
  }

  return {
    orderNumber: String(order.order_number || ''),
    orderStatus: status,
    shippingStatusCode,
    shippingStatusVi,
    shippingStatusEn: shippingStatusEn,
    carrierName: detectCarrier(trackingCode),
    trackingCode: trackingCode || 'Chờ cấp mã vận đơn',
    destinationAddress: address,
    estimatedArrivalDate: etaIso,
    estimatedArrivalDisplayVi: etaVi,
    estimatedArrivalDisplayEn: etaEn,
    currentLocationVi,
    currentLocationEn,
    progressPercent,
    lastUpdatedAt: updatedTs,
    syncedAt,
    timeline,
  };
}
