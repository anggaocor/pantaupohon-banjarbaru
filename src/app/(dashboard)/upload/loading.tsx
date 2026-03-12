export default function UploadLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-400">Memuat halaman upload...</p>
      </div>
    </div>
  );
}