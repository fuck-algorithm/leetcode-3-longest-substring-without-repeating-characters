import { useState } from 'react';

export function CommunityFloat({ locale }: { locale: 'en' | 'zh-CN' }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="community-float" data-testid="community-float">
      <button
        type="button"
        data-testid="community-btn"
        className="community-btn"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {locale === 'en' ? 'Community' : '交流群'}
      </button>

      {open ? (
        <div
          className="community-pop"
          data-testid="community-pop"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <img
            src="./assets/qrcode-community.png"
            alt={locale === 'en' ? 'Algorithm community QR code' : '算法交流群二维码'}
            data-testid="community-qr"
            className="community-qr"
          />
          <p>{locale === 'en' ? 'Scan with WeChat and send “leetcode” to join.' : '微信扫码发送“leetcode”加入算法交流群'}</p>
        </div>
      ) : null}
    </div>
  );
}
