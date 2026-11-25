import type { Lang } from '../i18n/I18nContext';
import type { Product } from '../context/StoreContext';

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerHiddenIframePrint(htmlDocument: string, isVi = true, filenameBase = 'ROAR-Document'): boolean {
  if (typeof document === 'undefined') return false;
  const existing = document.getElementById('roar-print-overlay');
  if (existing) existing.remove();

  // Inject @media print helper once so direct fallback printing hides app chrome cleanly
  let printStyle = document.getElementById('roar-print-media-style') as HTMLStyleElement | null;
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'roar-print-media-style';
    printStyle.textContent = `
      @media print {
        body > *:not(#roar-print-direct-sheet) { display: none !important; }
        #roar-print-direct-sheet { display: block !important; position: static !important; width: 100% !important; background: #fff !important; color: #111 !important; padding: 0 !important; margin: 0 !important; }
      }
      #roar-print-direct-sheet { display: none; }
    `;
    document.head.appendChild(printStyle);
  }

  // Prepare sanitized direct-DOM print sheet fallback (strip head/style into isolated container)
  const existingDirect = document.getElementById('roar-print-direct-sheet');
  if (existingDirect) existingDirect.remove();
  const directSheet = document.createElement('div');
  directSheet.id = 'roar-print-direct-sheet';
  const bodyMatch = htmlDocument.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const styleMatch = htmlDocument.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch?.[1]) {
    const scoped = document.createElement('style');
    scoped.textContent = styleMatch[1];
    directSheet.appendChild(scoped);
  }
  const contentWrap = document.createElement('div');
  contentWrap.innerHTML = bodyMatch?.[1] || htmlDocument;
  directSheet.appendChild(contentWrap);
  document.body.appendChild(directSheet);

  // Build visible Print Preview & Save PDF Modal
  const overlay = document.createElement('div');
  overlay.id = 'roar-print-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:rgba(10,16,13,0.78);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;';

  const card = document.createElement('div');
  card.style.cssText =
    'width:100%;max-width:860px;height:min(90vh,860px);background:#fff;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,0.45);border:1px solid rgba(198,166,103,0.45);';

  const toolbar = document.createElement('div');
  toolbar.style.cssText =
    'display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:#003D25;color:#F8F5EF;border-bottom:1px solid rgba(198,166,103,0.3);';

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;';
  titleEl.textContent = isVi ? 'ROAR COFFEE® · Xem trước & In / Lưu PDF' : 'ROAR COFFEE® · Print Preview & Save PDF';

  const btnGroup = document.createElement('div');
  btnGroup.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:8px;';

  const iframe = document.createElement('iframe');
  iframe.id = 'roar-print-frame';
  iframe.title = titleEl.textContent;
  iframe.style.cssText = 'flex:1;width:100%;border:0;background:#fff;';
  iframe.srcdoc = htmlDocument;

  const printBtn = document.createElement('button');
  printBtn.type = 'button';
  printBtn.textContent = isVi ? '🖨 In / Lưu PDF' : '🖨 Print / Save PDF';
  printBtn.style.cssText =
    'padding:8px 14px;border-radius:8px;border:0;background:#C6A667;color:#111111;font-weight:800;font-size:12px;cursor:pointer;';
  printBtn.onclick = () => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        return;
      }
    } catch {
      // fallback to top-level print sheet
    }
    try {
      window.focus();
      window.print();
    } catch {
      // ignore
    }
  };

  const downloadBtn = document.createElement('button');
  downloadBtn.type = 'button';
  downloadBtn.textContent = isVi ? '⬇ Tải Hóa Đơn (.html)' : '⬇ Download (.html)';
  downloadBtn.style.cssText =
    'padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.28);background:rgba(255,255,255,0.1);color:#fff;font-weight:700;font-size:12px;cursor:pointer;';
  downloadBtn.onclick = () => {
    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase.replace(/[^a-zA-Z0-9_-]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = isVi ? 'Đóng' : 'Close';
  closeBtn.style.cssText =
    'padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.22);background:transparent;color:#F8F5EF;font-weight:600;font-size:12px;cursor:pointer;';

  const cleanup = () => {
    window.removeEventListener('keydown', onKeyDown);
    overlay.remove();
    directSheet.remove();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cleanup();
  };
  window.addEventListener('keydown', onKeyDown);

  closeBtn.onclick = cleanup;
  overlay.onclick = (e) => {
    if (e.target === overlay) cleanup();
  };

  btnGroup.appendChild(printBtn);
  btnGroup.appendChild(downloadBtn);
  btnGroup.appendChild(closeBtn);
  toolbar.appendChild(titleEl);
  toolbar.appendChild(btnGroup);
  card.appendChild(toolbar);
  card.appendChild(iframe);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  return true;
}

export interface PrintableOrderItem {
  sku?: string;
  product_name_vi?: string;
  product_name_en?: string;
  variant_label?: string;
  quantity: number;
  unit_price_vnd?: number;
  line_total_vnd?: number;
}

export interface PrintableOrderData {
  orderNumber: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  subtotal?: number;
  discountAmount?: number;
  pointsDiscount?: number;
  shippingFee?: number;
  total: number;
  items?: PrintableOrderItem[];
  invoiceInfo?: {
    required?: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    invoiceEmail?: string;
  };
}

export function printOrderInvoice(
  order: PrintableOrderData,
  lang: Lang,
  formatPrice: (vnd: number, usd?: number) => string,
  companySettings?: Record<string, string>
): boolean {
  const isVi = lang === 'vi';
  const rows = (order.items || [])
    .map((it, idx) => {
      const name = isVi
        ? it.product_name_vi || it.product_name_en || it.sku || `Item ${idx + 1}`
        : it.product_name_en || it.product_name_vi || it.sku || `Item ${idx + 1}`;
      const lineTotal =
        Number(it.line_total_vnd ?? 0) ||
        Number(it.unit_price_vnd ?? 0) * Number(it.quantity || 1);
      const unitPrice =
        Number(it.unit_price_vnd ?? 0) ||
        Math.round(lineTotal / Math.max(1, Number(it.quantity || 1)));
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;">${idx + 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;">
            <strong>${escapeHtml(name)}</strong>
            ${it.variant_label ? `<div style="font-size:11px;color:#555;">${escapeHtml(it.variant_label)}</div>` : ''}
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:center;">${Number(it.quantity || 1)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:right;">${escapeHtml(formatPrice(unitPrice))}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:600;">${escapeHtml(formatPrice(lineTotal))}</td>
        </tr>
      `;
    })
    .join('');

  const subtotal = Number(order.subtotal ?? order.total);
  const discount = Number(order.discountAmount ?? 0);
  const ptsDisc = Number(order.pointsDiscount ?? 0);
  const shipping = Number(order.shippingFee ?? 0);
  const contactEmail = companySettings?.contact_email || 'hello@roarcoffee.vn';
  const hotline = companySettings?.hotline || '0901 234 567';
  const office = isVi
    ? companySettings?.office_address_vi || 'TP. Hồ Chí Minh, Việt Nam'
    : companySettings?.office_address_en || 'Ho Chi Minh City, Vietnam';

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${isVi ? 'Hóa đơn ROAR COFFEE' : 'ROAR COFFEE Receipt'} — ${escapeHtml(order.orderNumber)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: 'Plus Jakarta Sans', 'Be Vietnam Pro', Arial, sans-serif; color: #1b1b1b; font-size: 13px; line-height: 1.5; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00552B; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { color: #00552B; font-size: 20px; font-weight: 800; letter-spacing: 0.06em; }
    .tagline { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #8c6d2c; margin-top: 2px; }
    .meta-box { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #F8F5EF; border: 1px solid #e2ddd2; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12.5px; }
    th { background: #003D25; color: #F8F5EF; text-align: left; padding: 9px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    .totals { max-width: 320px; margin-left: auto; font-size: 12.5px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
    .totals-final { font-size: 15px; font-weight: 800; color: #00552B; border-top: 2px solid #00552B; border-bottom: none; padding-top: 8px; margin-top: 4px; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ROAR COFFEE®</div>
      <div class="tagline">${isVi ? 'KHƠI BẢN LĨNH · ĐẬM CHẤT RIÊNG' : 'IGNITING COURAGE · DEFINING CHARACTER'}</div>
      <div style="font-size:11px;color:#555;margin-top:6px;">${escapeHtml(office)} · ${escapeHtml(contactEmail)} · Hotline: ${escapeHtml(hotline)}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:800;color:#003D25;">${isVi ? 'PHIẾU XÁC NHẬN & HÓA ĐƠN' : 'ORDER RECEIPT & INVOICE'}</div>
      <div style="font-family:monospace;font-size:14px;font-weight:700;margin-top:4px;">${escapeHtml(order.orderNumber)}</div>
      <div style="font-size:11px;color:#666;">${escapeHtml(order.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '))}</div>
    </div>
  </div>

  <div class="meta-box">
    <div>
      <div style="font-weight:700;color:#003D25;margin-bottom:4px;">${isVi ? 'Thông tin Khách hàng' : 'Customer Details'}</div>
      <div><strong>${escapeHtml(order.customerName || 'ROAR Customer')}</strong></div>
      ${order.customerEmail ? `<div>Email: ${escapeHtml(order.customerEmail)}</div>` : ''}
      ${order.customerPhone ? `<div>${isVi ? 'SĐT' : 'Phone'}: ${escapeHtml(order.customerPhone)}</div>` : ''}
      ${order.shippingAddress ? `<div>${isVi ? 'Giao tới' : 'Address'}: ${escapeHtml(order.shippingAddress)}</div>` : ''}
    </div>
    <div>
      <div style="font-weight:700;color:#003D25;margin-bottom:4px;">${isVi ? 'Thanh toán & Xử lý' : 'Payment & Status'}</div>
      <div>${isVi ? 'Phương thức' : 'Method'}: <strong>${escapeHtml((order.paymentMethod || 'cod').toUpperCase())}</strong></div>
      ${order.paymentStatus ? `<div>${isVi ? 'Thanh toán' : 'Payment'}: ${escapeHtml(order.paymentStatus)}</div>` : ''}
      ${order.orderStatus ? `<div>${isVi ? 'Trạng thái đơn' : 'Order Status'}: ${escapeHtml(order.orderStatus)}</div>` : ''}
    </div>
  </div>

  ${
    order.invoiceInfo?.required
      ? `<div style="background:#FFFBF2;border:1px solid #C6A667;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;">
    <div style="font-weight:700;color:#003D25;margin-bottom:4px;">${isVi ? 'THÔNG TIN XUẤT HÓA ĐƠN VAT CÔNG TY' : 'COMPANY VAT INVOICE DETAILS'}</div>
    <div><strong>${isVi ? 'Tên công ty:' : 'Company:'}</strong> ${escapeHtml(order.invoiceInfo.companyName || '')}</div>
    <div><strong>${isVi ? 'Mã số thuế (MST):' : 'Tax ID:'}</strong> <span style="font-family:monospace;">${escapeHtml(order.invoiceInfo.taxId || '')}</span></div>
    <div><strong>${isVi ? 'Địa chỉ GPKD:' : 'Registered Address:'}</strong> ${escapeHtml(order.invoiceInfo.companyAddress || '')}</div>
    <div><strong>${isVi ? 'Email nhận hóa đơn:' : 'E-Invoice Email:'}</strong> ${escapeHtml(order.invoiceInfo.invoiceEmail || order.customerEmail || '')}</div>
  </div>`
      : ''
  }

  ${
    rows
      ? `<table>
    <thead>
      <tr>
        <th style="width:36px;">#</th>
        <th>${isVi ? 'Sản phẩm' : 'Product'}</th>
        <th style="text-align:center;width:64px;">${isVi ? 'SL' : 'Qty'}</th>
        <th style="text-align:right;width:120px;">${isVi ? 'Đơn giá' : 'Unit'}</th>
        <th style="text-align:right;width:130px;">${isVi ? 'Thành tiền' : 'Subtotal'}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
      : ''
  }

  <div class="totals">
    <div class="totals-row">
      <span>${isVi ? 'Tạm tính' : 'Subtotal'}</span>
      <span>${escapeHtml(formatPrice(subtotal))}</span>
    </div>
    ${
      discount > 0
        ? `<div class="totals-row"><span>${isVi ? 'Giảm giá Voucher' : 'Voucher Discount'}</span><span>-${escapeHtml(formatPrice(discount))}</span></div>`
        : ''
    }
    ${
      ptsDisc > 0
        ? `<div class="totals-row"><span>${isVi ? 'Quy đổi điểm thưởng' : 'Points Redeemed'}</span><span>-${escapeHtml(formatPrice(ptsDisc))}</span></div>`
        : ''
    }
    <div class="totals-row">
      <span>${isVi ? 'Phí vận chuyển' : 'Shipping Fee'}</span>
      <span>${shipping === 0 ? (isVi ? 'Miễn phí' : 'Free') : escapeHtml(formatPrice(shipping))}</span>
    </div>
    <div class="totals-row totals-final">
      <span>${isVi ? 'Tổng thanh toán' : 'Total Due'}</span>
      <span>${escapeHtml(formatPrice(order.total))}</span>
    </div>
  </div>

  <div class="footer">
    ${
      isVi
        ? 'Cảm ơn Quý khách đã đồng hành cùng ROAR COFFEE®. Phiếu được xuất trực tiếp từ hệ thống xác thực đơn hàng.'
        : 'Thank you for choosing ROAR COFFEE®. This receipt is generated directly from our verified order ledger.'
    }
  </div>
</body>
</html>`;

  return triggerHiddenIframePrint(html, isVi, `ROAR-Invoice-${order.orderNumber || 'Order'}`);
}

export function printB2BQuoteSheet(opts: {
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  products: Product[];
  lang: Lang;
  mode: 'green_bean' | 'roasted_beans';
  formatPrice: (vnd: number, usd?: number) => string;
  companySettings?: Record<string, string>;
}): boolean {
  const { lang, mode, products, formatPrice, companySettings } = opts;
  const isVi = lang === 'vi';
  const today = new Date().toISOString().slice(0, 10);
  const b2bEmail = companySettings?.b2b_email || 'b2b@roarcoffee.vn';
  const hotline = companySettings?.hotline || '0901 234 567';

  const bodyRows = products
    .map((p, idx) => {
      const name = isVi ? p.name_vi : p.name_en;
      if (mode === 'green_bean') {
        return `
          <tr>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;">${idx + 1}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;font-family:monospace;font-weight:700;color:#00552B;">${escapeHtml(p.sku)}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;"><strong>${escapeHtml(name)}</strong><div style="font-size:10.5px;color:#555;">${escapeHtml(p.origin_region)}</div></td>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;">${escapeHtml(p.screen_size)} · ${escapeHtml(p.processing_method)}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;font-size:11px;">${escapeHtml(p.moisture_content)}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;">${escapeHtml(p.moq || '30 kg')}</td>
            <td style="padding:7px 8px;border-bottom:1px solid #e5e5e5;text-align:right;font-weight:700;">${escapeHtml(formatPrice(p.price_vnd, p.price_usd))}/kg</td>
          </tr>
        `;
      }

      const tiers = Array.isArray(p.pricing_tiers) ? p.pricing_tiers : [];
      const tierSummary =
        tiers.length > 0
          ? tiers
              .map((tr) => `${escapeHtml(isVi ? tr.labelVi : tr.labelEn)}: <strong>${escapeHtml(formatPrice(tr.priceVnd, tr.priceUsd))}</strong>`)
              .join(' &nbsp;|&nbsp; ')
          : `${escapeHtml(formatPrice(p.price_vnd, p.price_usd))}/kg`;

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;">${idx + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;font-family:monospace;font-weight:700;color:#00552B;">${escapeHtml(p.sku)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;"><strong>${escapeHtml(name)}</strong><div style="font-size:10.5px;color:#555;">${escapeHtml(p.coffee_type)} · ${escapeHtml(p.screen_size)}</div></td>
          <td style="padding:8px;border-bottom:1px solid #e5e5e5;font-size:11.5px;">${tierSummary}</td>
        </tr>
      `;
    })
    .join('');

  const tableHeader =
    mode === 'green_bean'
      ? `<tr>
          <th>#</th>
          <th>SKU</th>
          <th>${isVi ? 'Tên lô & Vùng trồng' : 'Lot & Origin'}</th>
          <th>${isVi ? 'Sàng & Chế biến' : 'Screen / Proc'}</th>
          <th>${isVi ? 'Độ ẩm / Tỷ trọng' : 'Moisture'}</th>
          <th>MOQ</th>
          <th style="text-align:right;">${isVi ? 'Giá tham chiếu' : 'Ref. Price'}</th>
        </tr>`
      : `<tr>
          <th>#</th>
          <th>SKU</th>
          <th>${isVi ? 'Dòng Hạt Rang (S18)' : 'Roasted Bean Line'}</th>
          <th>${isVi ? 'Bảng giá 5 Mức Sản Lượng (theo kg)' : '5-Tier Volume Pricing (per kg)'}</th>
        </tr>`;

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(isVi ? opts.titleVi : opts.titleEn)} — ${today}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Plus Jakarta Sans', 'Be Vietnam Pro', Arial, sans-serif; color: #1b1b1b; font-size: 12px; line-height: 1.45; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00552B; padding-bottom: 12px; margin-bottom: 14px; }
    .brand { color: #00552B; font-size: 19px; font-weight: 800; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11.5px; }
    th { background: #003D25; color: #F8F5EF; text-align: left; padding: 8px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
    .note { margin-top: 16px; background: #F8F5EF; border: 1px solid #e2ddd2; border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #444; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ROAR COFFEE® · B2B COMMERCIAL QUOTATION</div>
      <div style="font-size:14px;font-weight:700;margin-top:4px;">${escapeHtml(isVi ? opts.titleVi : opts.titleEn)}</div>
      <div style="font-size:11px;color:#555;">${escapeHtml(isVi ? opts.subtitleVi : opts.subtitleEn)}</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#444;">
      <div><strong>${isVi ? 'Ngày xuất:' : 'Issued:'}</strong> ${today}</div>
      <div><strong>B2B Desk:</strong> ${escapeHtml(b2bEmail)}</div>
      <div><strong>Hotline:</strong> ${escapeHtml(hotline)}</div>
      <div><strong>${isVi ? 'Số dòng:' : 'SKUs:'}</strong> ${products.length}</div>
    </div>
  </div>

  <table>
    <thead>${tableHeader}</thead>
    <tbody>${bodyRows}</tbody>
  </table>

  <div class="note">
    <strong>${isVi ? 'Ghi chú Thương mại & COA:' : 'Commercial & COA Terms:'}</strong>
    ${
      isVi
        ? 'Giá trên là giá tham chiếu tại thời điểm xuất bảng báo giá. Bao bì tiêu chuẩn 30kg / 60kg / 69kg / 1,000kg hoặc đóng gói theo hợp đồng OEM. Vui lòng liên hệ ' +
          escapeHtml(b2bEmail) +
          ' để chốt sản lượng và COA lô hàng.'
        : 'Prices shown reflect current reference schedules. Standard commercial bags (30/60/69/1,000kg) or OEM private-label packing available. Contact ' +
          escapeHtml(b2bEmail) +
          ' to lock volume allocations and lot COA.'
    }
  </div>
</body>
</html>`;

  return triggerHiddenIframePrint(html, isVi, `ROAR-B2B-Quote-${mode}-${today}`);
}
