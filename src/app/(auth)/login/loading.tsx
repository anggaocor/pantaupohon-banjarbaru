export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg text-center">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-gray-900">
            Memuat Halaman Login
          </h3>
          <p className="text-gray-600">
            Mohon tunggu sebentar...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="pt-4">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      </div>
    </div>
  )
}