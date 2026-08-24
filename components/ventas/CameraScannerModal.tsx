"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Camera, Flashlight, RefreshCw, X, Check, Volume2, Sparkles } from "lucide-react";
import { playScanBeep } from "@/lib/audio";

interface CameraScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => boolean | Promise<boolean>;
}

export default function CameraScannerModal({ open, onClose, onScan }: CameraScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [continuous, setContinuous] = useState(true);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);

  const html5QrCodeRef = useRef<any>(null);
  const lastScanTimeRef = useRef<number>(0);

  useEffect(() => {
    let scannerInstance: any = null;

    if (open) {
      setCameraError(null);
      setLastScanned(null);
      setScanCount(0);

      const startScanner = async () => {
        try {
          // Dynamic import to prevent SSR issues
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

          const scanner = new Html5Qrcode("camera-barcode-reader", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
            verbose: false,
          });

          html5QrCodeRef.current = scanner;
          scannerInstance = scanner;

          const config = {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.333334,
          };

          await scanner.start(
            { facingMode: "environment" },
            config,
            async (decodedText: string) => {
              const now = Date.now();
              // Debounce identical scans within 1.5 seconds
              if (decodedText === lastScanned && now - lastScanTimeRef.current < 1500) {
                return;
              }

              lastScanTimeRef.current = now;
              setLastScanned(decodedText);

              const handled = await onScan(decodedText);
              if (handled) {
                playScanBeep(true);
                setScanCount((c) => c + 1);

                if (!continuous) {
                  await scanner.stop();
                  onClose();
                }
              } else {
                playScanBeep(false);
              }
            },
            () => {
              // Ignore frame errors
            }
          );

          setIsScanning(true);

          // Check torch capability
          try {
            const track = scanner.getRunningTrackCameraCapabilities();
            if (track && track.torchFeature && track.torchFeature().isSupported()) {
              setTorchSupported(true);
            }
          } catch {
            setTorchSupported(false);
          }
        } catch (err: any) {
          console.error("Error al iniciar cámara:", err);
          setCameraError(
            err?.message ||
              "No se pudo acceder a la cámara. Asegúrate de dar permisos de cámara en tu navegador."
          );
          setIsScanning(false);
        }
      };

      startScanner();
    }

    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
          html5QrCodeRef.current.clear();
        } catch {}
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
    };
  }, [open, continuous, onClose, onScan, lastScanned]);

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn("No se pudo alternar linterna:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white text-slate-900 border-slate-200 shadow-2xl">
        <DialogHeader className="p-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
            <Camera className="h-4 w-4 text-blue-600" />
            Lector de Código de Barras Móvil
          </DialogTitle>
          <div className="flex items-center gap-2">
            {scanCount > 0 && (
              <Badge variant="success" className="text-xs">
                {scanCount} {scanCount === 1 ? "leído" : "leídos"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Contenedor del visor de cámara */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border-2 border-slate-300 shadow-lg">
            <div id="camera-barcode-reader" className="w-full h-full" />

            {/* Animación de línea láser de escaneo */}
            {isScanning && !cameraError && (
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center text-xs text-red-500 max-w-xs space-y-2">
                <p className="font-semibold">Permiso de Cámara Requerido</p>
                <p className="text-[11px] text-slate-300">{cameraError}</p>
                <p className="text-[10px] text-slate-400">
                  En Chrome/Safari, presiona el candado en la barra de direcciones y activa la cámara.
                </p>
              </div>
            )}
          </div>

          {/* Último código detectado */}
          {lastScanned && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[10px]">Último código escaneado:</span>
                  <span className="font-mono font-bold text-slate-900">{lastScanned}</span>
                </div>
              </div>
              <Badge variant="info">Agregado</Badge>
            </div>
          )}

          {/* Opciones y Controles */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={continuous}
                onChange={(e) => setContinuous(e.target.checked)}
                className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
              />
              <span>Modo continuo (múltiples prendas)</span>
            </label>

            {torchSupported && (
              <Button
                size="sm"
                variant={torchOn ? "primary" : "outline"}
                onClick={toggleTorch}
                className="h-7 text-xs flex items-center gap-1"
              >
                <Flashlight className="h-3.5 w-3.5" />
                {torchOn ? "Flash ON" : "Flash OFF"}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <Volume2 className="h-3.5 w-3.5 text-slate-400" />
            Emite sonido BEEP al detectar
          </div>
          <Button variant="outline" onClick={onClose} className="text-slate-700 border-slate-300 hover:bg-slate-100">
            Terminar y Volver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
