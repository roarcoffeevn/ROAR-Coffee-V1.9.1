interface TransactionalEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

function escapeEmailHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendTransactionalEmail(
  payload: TransactionalEmailPayload
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: true };
  }

  const from = process.env.EMAIL_FROM?.trim() || 'ROAR COFFEE <orders@roarcoffee.vn>';
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validTo = toList.map((e) => e.trim()).filter((e) => e.includes('@'));
  if (validTo.length === 0) {
    return { sent: false, skipped: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: validTo,
        subject: payload.subject,
        html: payload.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const msg = await response.text().catch(() => '');
      return { sent: false, error: msg || `HTTP ${response.status}` };
    }
    return { sent: true };
  } catch (err: any) {
    return { sent: false, error: err?.message || 'Mailer request failed' };
  }
}

export function dispatchOrderConfirmationEmail(opts: {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  totalVnd: number;
  paymentMethod: string;
  memberCode?: string;
  invoiceInfo?: {
    required?: boolean;
    companyName?: string;
    taxId?: string;
    companyAddress?: string;
    invoiceEmail?: string;
  };
}): void {
  if (!process.env.RESEND_API_KEY?.trim()) return;
  if (!opts.customerEmail || !opts.customerEmail.includes('@')) return;

  const formattedTotal = `${Number(opts.totalVnd || 0).toLocaleString('vi-VN')} ₫`;
  const vatBlock = opts.invoiceInfo?.required
    ? `
      <div style="background:#FFFBF2;border:1px solid #C6A667;border-radius:8px;padding:12px 14px;margin:12px 0;font-size:12.5px;">
        <div style="font-weight:700;color:#003D25;margin-bottom:4px;">Yêu cầu Xuất Hóa Đơn VAT Công Ty</div>
        <div><strong>Đơn vị:</strong> ${escapeEmailHtml(opts.invoiceInfo.companyName || '')}</div>
        <div><strong>Mã số thuế (MST):</strong> ${escapeEmailHtml(opts.invoiceInfo.taxId || '')}</div>
        <div><strong>Địa chỉ GPKD:</strong> ${escapeEmailHtml(opts.invoiceInfo.companyAddress || '')}</div>
        <div><strong>Email nhận hóa đơn:</strong> ${escapeEmailHtml(opts.invoiceInfo.invoiceEmail || opts.customerEmail)}</div>
      </div>
    `
    : '';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;border:1px solid #e5e0d5;border-radius:10px;overflow:hidden;color:#202020;">
      <div style="background:#003D25;color:#F8F5EF;padding:20px 24px;">
        <div style="font-size:18px;font-weight:800;letter-spacing:0.06em;">ROAR COFFEE®</div>
        <div style="font-size:11px;color:#C6A667;letter-spacing:0.14em;margin-top:2px;">KHƠI BẢN LĨNH · ĐẬM CHẤT RIÊNG</div>
      </div>
      <div style="padding:24px;line-height:1.6;font-size:14px;">
        <p>Xin chào <strong>${escapeEmailHtml(opts.customerName)}</strong>,</p>
        <p>ROAR COFFEE® đã tiếp nhận đơn hàng của bạn:</p>
        <div style="background:#F8F5EF;border-radius:8px;padding:14px 16px;margin:14px 0;font-size:13px;">
          <div><strong>Mã đơn hàng:</strong> ${escapeEmailHtml(opts.orderNumber)}</div>
          <div><strong>Tổng thanh toán:</strong> ${escapeEmailHtml(formattedTotal)}</div>
          <div><strong>Phương thức:</strong> ${escapeEmailHtml(opts.paymentMethod.toUpperCase())}</div>
          ${opts.memberCode ? `<div><strong>Mã thành viên ROAR:</strong> ${escapeEmailHtml(opts.memberCode)}</div>` : ''}
        </div>
        ${vatBlock}
        <p style="font-size:12.5px;color:#555;">Bạn có thể tra cứu tiến trình giao hàng trực tiếp tại mục <em>Tra cứu đơn hàng</em> trên website ROAR COFFEE®.</p>
      </div>
    </div>
  `;

  void sendTransactionalEmail({
    to: opts.customerEmail,
    subject: `[ROAR COFFEE®] Xác nhận đơn hàng ${opts.orderNumber}`,
    html,
  }).catch(() => {});
}

export function dispatchB2BInquiryEmail(opts: {
  inquiryId: number;
  inquiryType: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  productSku?: string;
  estimatedVolume?: string;
  message: string;
}): void {
  if (!process.env.RESEND_API_KEY?.trim()) return;
  const adminRecipient = process.env.B2B_NOTIFY_EMAIL?.trim() || 'b2b@roarcoffee.vn';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;border:1px solid #e5e0d5;border-radius:10px;padding:20px;color:#202020;font-size:13.5px;line-height:1.55;">
      <h2 style="margin-top:0;color:#00552B;">ROAR COFFEE® — Yêu cầu B2B / Liên hệ mới (#${opts.inquiryId})</h2>
      <p><strong>Phân loại:</strong> ${escapeEmailHtml(opts.inquiryType)}</p>
      <p><strong>Công ty / Tổ chức:</strong> ${escapeEmailHtml(opts.companyName || '—')}</p>
      <p><strong>Người liên hệ:</strong> ${escapeEmailHtml(opts.contactName)} (${escapeEmailHtml(opts.email)} · ${escapeEmailHtml(opts.phone)})</p>
      ${opts.productSku ? `<p><strong>Mã SKU quan tâm:</strong> ${escapeEmailHtml(opts.productSku)}</p>` : ''}
      ${opts.estimatedVolume ? `<p><strong>Sản lượng dự kiến:</strong> ${escapeEmailHtml(opts.estimatedVolume)}</p>` : ''}
      <div style="background:#F8F5EF;padding:12px;border-radius:6px;margin-top:10px;white-space:pre-line;">${escapeEmailHtml(opts.message)}</div>
    </div>
  `;

  void sendTransactionalEmail({
    to: adminRecipient,
    replyTo: opts.email,
    subject: `[ROAR B2B #${opts.inquiryId}] ${opts.inquiryType} — ${opts.companyName || opts.contactName}`,
    html,
  }).catch(() => {});
}
