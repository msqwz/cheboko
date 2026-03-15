"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { X, Camera } from "lucide-react";
import styles from "./QRScanner.module.css";

export default function QRScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Инициализация сканера
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Успешное сканирование
        scanner.clear();
        
        // Пытаемся понять, это наша ссылка или нет
        try {
          const url = new URL(decodedText);
          if (url.origin === window.location.origin && url.pathname.startsWith('/q/')) {
            router.push(url.pathname);
            onClose();
          } else {
            // Если ссылка не наша, просто переходим
            if (window.confirm(`Перейти по внешней ссылке?\n${decodedText}`)) {
              window.location.href = decodedText;
            }
          }
        } catch (e) {
          // Если это просто текст, а не URL
          setError("Код не является ссылкой оборудования");
        }
      },
      (errorMessage) => {
        // Ошибки сканирования можно игнорировать (они частые пока камера ищет)
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(err => console.error("Scanner cleanup failed", err));
    };
  }, [router, onClose]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.title}>
            <Camera size={20} />
            Сканирование QR-кода
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.readerContainer}>
          <div id="qr-reader" className={styles.reader}></div>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            {error}
          </div>
        )}

        <div className={styles.footer}>
          Наведите камеру на QR-код оборудования
        </div>
      </div>
    </div>
  );
}
