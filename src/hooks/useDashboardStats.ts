import { useQuery } from '@tanstack/react-query'
import { payrollService } from '@/services/payroll.service'

export const useDashboardStats = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['payrollStats'],
        queryFn: payrollService.getStats,
        // Stats can change frequently if users are adding transactions, so we keep staleTime low or 0
        staleTime: 0 
    })

    return {
        currentNetTotal: stats?.currentNetTotal || 0,
        currentBasicTotal: stats?.currentGross || 0,
        lastNetTotal: stats?.lastRunTotal ?? null,
        lastPeriod: stats?.lastPeriod ?? null,
        // undefined = loading, null = no previous run, number = actual delta
        percentChange: isLoading ? undefined : (stats?.percentChange ?? null),
        activeCount: stats?.activeCount || 0,
        currentDeductionRate: stats?.currentDeductionRate || 0,
        deductionRateChange: isLoading ? undefined : (stats?.deductionRateChange ?? null),
        isLoading
    }
}
