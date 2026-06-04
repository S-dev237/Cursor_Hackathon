/** Skeleton loader — même silhouette qu'une DocumentCard. */
export default function SkeletonCard({ detailed = false }) {
  return (
    <div
      className="rounded-xl border border-gray-200/60 bg-white p-5 shadow-card dark:border-navy-700 dark:bg-navy-800"
      aria-hidden="true"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="skeleton h-5 w-16" />
        <div className="skeleton h-5 w-14" />
        <div className="skeleton ml-auto h-4 w-10" />
      </div>

      <div className="skeleton mb-2 h-5 w-[85%]" />
      <div className="skeleton mb-3 h-3 w-[55%]" />

      {detailed && (
        <>
          <div className="skeleton mb-2 h-3 w-full" />
          <div className="skeleton mb-3 h-3 w-4/5" />
        </>
      )}

      <div className="mb-4 flex gap-1.5">
        <div className="skeleton h-5 w-14 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>

      <div className="flex items-center justify-between border-t border-gray-200/60 pt-3 dark:border-navy-700">
        <div className="flex gap-3">
          <div className="skeleton h-3 w-10" />
          <div className="skeleton h-3 w-10" />
        </div>
        <div className="skeleton h-3 w-16" />
      </div>
    </div>
  )
}
