"use client";

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateYoutubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
  };

  const downloadMp3 = async (youtubeUrl) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

    try {
      const response = await fetch(
        `http://localhost:5000/download?url=${encodeURIComponent(youtubeUrl)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error downloading MP3");
      }

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'audio.mp3';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Download timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateYoutubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    try {
      await downloadMp3(url);
      setSuccess(true);
      setUrl('');
    } catch (err) {
      setError(err.message || 'Failed to process download. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6 transform transition-all duration-300 hover:shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800">
            YouTube Downloader
          </h1>
          <p className="text-gray-500">
            Enter a YouTube URL to download your video
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError('');
                  setSuccess(false);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 ${
                  error 
                    ? 'border-red-500 focus:ring-red-200' 
                    : success 
                    ? 'border-green-500 focus:ring-green-200'
                    : 'border-gray-300 focus:ring-purple-200'
                } focus:outline-none focus:ring-2 focus:border-transparent`}
                disabled={isLoading}
                required
              />
              {(error || success) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {error && <AlertCircle className="w-5 h-5 text-red-500" />}
                  {success && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Download completed successfully!</AlertDescription>
            </Alert>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-purple-600 text-white font-medium py-3 rounded-lg transition duration-200 ease-in-out transform 
              ${!isLoading && 'hover:bg-purple-700 hover:scale-[1.02]'}
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
              disabled:opacity-70 disabled:cursor-not-allowed
              flex items-center justify-center space-x-2`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Download</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}