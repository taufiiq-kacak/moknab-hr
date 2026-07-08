export default function StaffLoading() {
  return (
    <div className="space-y-6 animate-pulse px-4 py-6 max-w-md mx-auto">
      {/* Header Profile Skeleton */}
      <div className="flex items-center justify-between pb-2">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-300/80 rounded-md"></div>
          <div className="h-3 w-48 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
      </div>

      {/* Main Action Card Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100/50 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-gray-300/80 rounded-md"></div>
          <div className="h-3.5 w-16 bg-gray-100 rounded-lg"></div>
        </div>

        <div className="flex flex-col items-center py-6 space-y-4">
          {/* Big pulsing circle representing the Clock button */}
          <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-50">
            <div className="h-24 w-24 rounded-full bg-gray-200/60"></div>
          </div>
          <div className="h-4 w-36 bg-gray-200 rounded-md"></div>
        </div>

        <div className="h-11 w-full bg-gray-200/80 rounded-xl"></div>
      </div>

      {/* History List Skeleton */}
      <div className="space-y-3">
        <div className="h-3.5 w-32 bg-gray-300/80 rounded-md pl-1"></div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-xl border border-gray-100/30 flex items-center justify-between"
            >
              <div className="space-y-2">
                <div className="h-3 w-28 bg-gray-300/80 rounded-md"></div>
                <div className="h-2 w-20 bg-gray-200 rounded-md"></div>
              </div>
              <div className="h-5 w-16 bg-gray-100 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
