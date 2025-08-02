import { useRef, useState } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 400,
  height: 300,
  facingMode: "user",
};

import type { WebcamCaptureProps } from "../types";

export function WebcamCapture({ onCapture, label }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    // imageSrc is a based 64 encoded image looks like url
    // use fetch here to treat it like a url to convert it to a file object
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${label}.jpeg`, { type: "image/jpeg" });
        setPreview(URL.createObjectURL(file));
        onCapture(file);
      });
  };

  return (
    <div className="space-y-2">
      {!preview && (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
          />
          <button
            type="button"
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={capture}
          >
            Take Photo: {label}
          </button>
        </>
      )}

      {preview && (
        <div className="space-y-2">
          <p className="text-green-700 font-medium">✅ Photo captured</p>
          <img
            src={preview}
            alt="Captured preview"
            className="w-48 border rounded"
          />
          <button
            type="button"
            className="bg-yellow-500 text-white px-4 py-2 rounded"
            onClick={() => setPreview(null)} // allow retake
          >
            Retake Photo
          </button>
        </div>
      )}
    </div>
  );
}
