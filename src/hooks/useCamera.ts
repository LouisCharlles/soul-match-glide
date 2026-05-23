import { useCallback, useEffect, useRef, useState } from "react";

type CameraState = "idle" | "active" | "captured" | "error";

export interface UseCameraReturn {
  hasCamera: boolean | null;
  state: CameraState;
  videoRef: React.RefObject<HTMLVideoElement>;
  previewUrl: string | null;
  errorMessage: string | null;
  stream: MediaStream | null;
  startCamera: () => Promise<void>;
  capturePhoto: () => File | null;
  retake: () => void;
  stopCamera: () => void;
}

export function useCamera(): UseCameraReturn {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [state, setState] = useState<CameraState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setHasCamera(false);
      return;
    }
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setHasCamera(devices.some((d) => d.kind === "videoinput"));
    }).catch(() => setHasCamera(false));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("active");
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Permissão para a câmera negada. Verifique as configurações do navegador."
          : "Não foi possível acessar a câmera. Tente novamente.";
      setErrorMessage(msg);
      setState("error");
    }
  }, []);

  const capturePhoto = useCallback((): File | null => {
    const video = videoRef.current;
    if (!video) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(dataUrl);
    stopCamera();
    setState("captured");

    // Convert data URL to File
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new File([ab], "selfie.jpg", { type: mimeString });
  }, [stopCamera]);

  const retake = useCallback(() => {
    setPreviewUrl(null);
    setState("idle");
    setErrorMessage(null);
  }, []);

  return { hasCamera, state, videoRef, previewUrl, errorMessage, stream: streamRef.current, startCamera, capturePhoto, retake, stopCamera };
}
