
export default function SkeletonDashboard() {
    return (
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-pulse">
            
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                <div>
                    <div className="h-8 w-48 bg-neutral-800/50 rounded-lg mb-2"></div>
                    <div className="h-4 w-64 bg-neutral-800/50 rounded-lg"></div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="h-10 flex-1 md:w-24 bg-neutral-800/50 rounded-xl"></div>
                    <div className="h-10 flex-1 md:w-24 bg-neutral-800/50 rounded-xl"></div>
                </div>
            </div>

            {/* Quick Actions Grid Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-[#111] border border-[#222] rounded-2xl p-4 md:p-5 h-32 md:h-24 flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 text-center md:text-left">
                        <div className="h-12 w-12 bg-neutral-800/50 rounded-xl flex-shrink-0"></div>
                        <div className="flex-1 w-full flex flex-col items-center md:items-start">
                            <div className="h-4 w-20 bg-neutral-800/50 rounded mb-2"></div>
                            <div className="h-3 w-24 bg-neutral-800/50 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                
                {/* AI Insight Skeleton (Left - 2cols) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111] border border-[#222] rounded-2xl p-5 md:p-6 min-h-[250px] relative overflow-hidden">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="h-8 w-8 bg-neutral-800/50 rounded-lg"></div>
                            <div className="h-6 w-48 bg-neutral-800/50 rounded"></div>
                         </div>
                         <div className="space-y-4">
                            <div className="h-6 w-32 bg-neutral-800/50 rounded-full"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-neutral-800/50 rounded"></div>
                                <div className="h-4 w-11/12 bg-neutral-800/50 rounded"></div>
                                <div className="h-4 w-10/12 bg-neutral-800/50 rounded"></div>
                            </div>
                         </div>
                    </div>
                </div>

                {/* Latest Result Skeleton (Right - 1col) */}
                <div className="bg-[#111] border border-[#222] rounded-2xl p-5 md:p-6 min-h-[250px] flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div className="h-5 w-32 bg-neutral-800/50 rounded"></div>
                        <div className="h-4 w-20 bg-neutral-800/50 rounded"></div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center mb-6">
                        <div className="w-32 h-32 rounded-full border-8 border-neutral-800/50 mb-4"></div>
                        <div className="h-6 w-24 bg-neutral-800/50 rounded-full"></div>
                    </div>
                    <div className="h-10 w-full bg-neutral-800/50 rounded-xl"></div>
                </div>

            </div>
        </div>
    );
}
