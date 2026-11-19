import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

export default function QRCode({ value, size = 220 }: { value: string; size?: number }) {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    let alive = true;
    QRCodeLib.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: { dark: '#0c0c10', light: '#f4f1ea' },
    }).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [value, size]);
  return url ? <img src={url} width={size} height={size} alt="QR code" className="qr" /> : null;
}
