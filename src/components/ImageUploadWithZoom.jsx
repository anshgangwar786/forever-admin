'use client';

import React, { useState, useEffect } from 'react';

const getImageSrc = (img) => (typeof img === 'object' && img?.src ? img.src : img);

export default function ImageUploadWithZoom({
  id,
  file,
  onChange,
  onRemove,
  label = 'Upload Image',
  placeholderSrc,
  index = 0,
}) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);

  // Generate object URL for uploaded File or string URL
  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    if (typeof file === 'string') {
      setPreviewUrl(file);
      return;
    }

    if (file instanceof File || file instanceof Blob) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onChange(selected);
    }
  };

  // Close lightbox on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && lightboxOpen) {
        setLightboxOpen(false);
        setLightboxScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  // Formatted file size string
  const fileSizeString =
    file && file.size
      ? `${(file.size / 1024).toFixed(1)} KB`
      : '';

  return (
    <div className="relative inline-block select-none">
      <input
        type="file"
        id={id}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* THUMBNAIL CONTAINER */}
      {!previewUrl ? (
        // EMPTY STATE: Upload trigger
        <label
          htmlFor={id}
          className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-gray-300 hover:border-black/50 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50/70 hover:bg-gray-100 transition group"
          title={`Click to upload ${label}`}
        >
          {placeholderSrc ? (
            <img
              src={getImageSrc(placeholderSrc)}
              alt="Upload"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain opacity-60 group-hover:opacity-90 group-hover:scale-110 transition duration-200"
            />
          ) : (
            <svg
              className="w-7 h-7 text-gray-400 group-hover:text-gray-700 group-hover:scale-110 transition duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          )}
          <span className="text-[10px] text-gray-500 font-medium mt-1 group-hover:text-gray-800">
            Upload
          </span>
        </label>
      ) : (
        // UPLOADED STATE: Image with controls
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-gray-200 hover:border-black/60 shadow-xs overflow-hidden group bg-white transition duration-150">
          {/* Main Thumbnail Image */}
          <img
            src={previewUrl}
            alt={file?.name || label}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />

          {/* Action Overlay: Expand Full Screen (Eye) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="absolute bottom-1 left-1 bg-white/90 hover:bg-white text-gray-800 p-1 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
            title="Click to view enlarged full image"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Action Overlay: Replace / Change Image */}
          <label
            htmlFor={id}
            className="absolute bottom-1 right-1 bg-white/90 hover:bg-white text-gray-800 p-1 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition cursor-pointer z-10"
            title="Change image file"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </label>

          {/* Action Overlay: Remove Image */}
          {onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer z-10"
              title="Remove this image"
            >
              &times;
            </button>
          )}

          {/* Slot Number Badge */}
          <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.2 rounded font-mono pointer-events-none">
            #{index + 1}
          </div>
        </div>
      )}

      {/* FULL-SIZE LIGHTBOX MODAL (Click to View Full Size) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => {
            setLightboxOpen(false);
            setLightboxScale(1);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="bg-gradient-to-r from-gray-900 to-black text-white px-5 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Image Preview: {file?.name || `Slot #${index + 1}`}
                </span>
                {fileSizeString && (
                  <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded">
                    {fileSizeString}
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxScale((prev) => Math.min(3, prev + 0.25))}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold cursor-pointer"
                  title="Zoom In"
                >
                  + Zoom In
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxScale((prev) => Math.max(0.5, prev - 0.25))}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold cursor-pointer"
                  title="Zoom Out"
                >
                  - Zoom Out
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxScale(1)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold cursor-pointer"
                  title="Reset Zoom"
                >
                  Reset ({Math.round(lightboxScale * 100)}%)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLightboxOpen(false);
                    setLightboxScale(1);
                  }}
                  className="p-1 text-gray-400 hover:text-white rounded text-xl font-bold cursor-pointer"
                  title="Close (Esc)"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Lightbox Image Stage */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-stone-100 min-h-[350px]">
              <img
                src={previewUrl}
                alt={file?.name || 'Full preview'}
                className="max-h-[70vh] max-w-full object-contain rounded-lg transition-transform duration-200 shadow-md"
                style={{ transform: `scale(${lightboxScale})` }}
              />
            </div>

            {/* Lightbox Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-2.5 flex justify-between items-center text-xs text-gray-500 shrink-0">
              <span>Use zoom buttons or mouse wheel to inspect image quality</span>
              <button
                type="button"
                onClick={() => {
                  setLightboxOpen(false);
                  setLightboxScale(1);
                }}
                className="px-3.5 py-1 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
