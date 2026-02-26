export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto animate-pulse"></div>
        </div>
        
        {/* Form dengan 4 input fields */}
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
              <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}

          {/* Terms Checkbox */}
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>

          {/* Button */}
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}