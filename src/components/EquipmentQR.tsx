"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface EquipmentQRProps {
    equipmentId: string;
    equipmentName: string;
}

export default function EquipmentQR({ equipmentId, equipmentName }: EquipmentQRProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!show || !canvasRef.current) return;
        const url = `${window.location.origin}/q/${equipmentId}`;
        QRCode.toCanvas(canvasRef.current, url, { 
            width: 200, 
            margin: 2,
            color: {
                dark: "#0F172A",
                light: "#FFFFFF"
            }
        });

    }, [show, equipmentId]);

    const handlePrint = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL("image/png");
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
      <html><head><title>QR — ${equipmentName}</title></head>
      <body style="text-align:center;font-family:sans-serif;padding:40px">
        <h2>${equipmentName}</h2>
        <img src="${dataUrl}" style="width:200px;height:200px" />
        <p style="font-size:12px;color:#666">Отсканируйте для создания заявки</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
        win.document.close();
    };

    return (
        <div>
            <button
                onClick={() => setShow(!show)}
                style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    cursor: "pointer",
                    fontSize: 13,
                }}
            >
                {show ? "Скрыть QR" : "QR-код"}
            </button>

            {show && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <canvas ref={canvasRef} />
                    <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                        Сканируйте для создания заявки
                    </p>
                    <button
                        onClick={handlePrint}
                        style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "var(--accent)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        Распечатать
                    </button>
                </div>
            )}
        </div>
    );
}

