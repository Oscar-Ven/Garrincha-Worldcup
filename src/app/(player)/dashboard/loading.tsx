export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-[28px] bg-white/5" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[24px] bg-white/5" />
        ))}
      </div>
    </div>
  );
}