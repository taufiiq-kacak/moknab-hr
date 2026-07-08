export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Title Header Skeleton */}
      <div className="space-y-2.5">
        <div className="h-3 w-20 bg-gray-200 rounded-md"></div>
        <div className="h-8 w-56 bg-gray-300/80 rounded-xl"></div>
        <div className="h-3.5 w-80 bg-gray-200 rounded-md"></div>
      </div>

      {/* Metrics Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-gray-100/50 flex items-center justify-between h-[104px]"
          >
            <div className="space-y-3 w-2/3">
              <div className="h-2.5 w-24 bg-gray-200 rounded-md"></div>
              <div className="h-7 w-12 bg-gray-300/80 rounded-lg"></div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-gray-100 shrink-0"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100/50 space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <div className="h-4.5 w-44 bg-gray-300/80 rounded-md"></div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0"
            >
              <div className="space-y-2.5 w-1/3">
                <div className="h-4 w-40 bg-gray-300/80 rounded-md"></div>
                <div className="h-2.5 w-28 bg-gray-200 rounded-md"></div>
              </div>
              <div className="h-3.5 w-24 bg-gray-200 rounded-md hidden md:block"></div>
              <div className="h-6 w-20 bg-gray-100 rounded-lg shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
