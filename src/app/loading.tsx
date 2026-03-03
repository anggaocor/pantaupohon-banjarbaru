// app/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <header className="bg-gray-100 py-4 px-6">
        <div className="container mx-auto">
          <div className="h-8 bg-gray-300 rounded w-32 animate-pulse"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section Skeleton */}
        <div className="mb-12">
          <div className="h-12 bg-gray-300 rounded w-3/4 mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-48 bg-gray-300 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Memuat data...</span>
          </div>
        </div>
      </main>
    </div>
  );
}