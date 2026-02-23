import { Box, Heading, HStack, SimpleGrid, Card as ChakraCard, Badge, Flex, Icon, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { LuWallet, LuUsers, LuTrendingDown, LuTrendingUp } from "react-icons/lu"
import { formatCurrency } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { employeeService } from "@/services/employee.service"

export const Dashboard = () => {
  const { t } = useTranslation(['dashboard'])
  const { currentNetTotal, percentChange, activeCount, currentDeductionRate, deductionRateChange } = useDashboardStats()

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'active', 1],
    queryFn: () => employeeService.getActive(1, 5)
  })
  const employees = employeesData?.items || []

  // undefined = still loading, null = confirmed no previous run, number = delta
  const payrollHelpText = percentChange === undefined
    ? undefined // show nothing while loading
    : percentChange === null
      ? t('stats.firstPayout')
      : t('stats.sinceLast', { value: percentChange >= 0 ? `+${percentChange.toFixed(1)}` : percentChange.toFixed(1) })

  // Deduction rate: inverted color logic (higher = worse = red)
  const deductionHelpText = deductionRateChange === undefined
    ? undefined
    : deductionRateChange === null
      ? t('noDeductions')
      : t('sinceLastDeduction', { value: deductionRateChange >= 0 ? `+${deductionRateChange.toFixed(2)}` : deductionRateChange.toFixed(2) })
  const deductionTrendColor = typeof deductionRateChange === 'number'
    ? (deductionRateChange <= 0 ? 'green' : 'red')
    : 'gray'

  return (
    <Box spaceY="8">
      <Box>
        <Heading size="2xl" mb="2">{t('welcome')}</Heading>
        <Text color="gray.500">{t('subtitle')}</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap="6">
        <StatCard
          label={t('stats.totalPayroll')}
          value={formatCurrency(currentNetTotal)}
          helpText={payrollHelpText}
          icon={LuWallet}
          trend={typeof percentChange === 'number' ? (percentChange >= 0 ? 'up' : 'down') : undefined}
          trendColor={typeof percentChange === 'number' ? (percentChange >= 0 ? 'green' : 'red') : 'gray'}
        />
        <StatCard
          label={t('stats.activeEmployees')}
          value={activeCount}
          icon={LuUsers}
          trendColor="gray"
        />
        <StatCard
          label={t('deductionRateLabel')}
          value={`${currentDeductionRate.toFixed(1)}%`}
          helpText={deductionHelpText}
          icon={LuTrendingDown}
          trendColor={deductionTrendColor}
        />
      </SimpleGrid>

      <Box>
        <HStack justify="space-between" mb="6">
          <Heading size="lg">{t('sections.teamOverview')}</Heading>
          <Text color="oxygen.500" fontWeight="bold" cursor="pointer" _hover={{ textDecor: "underline" }}>{t('viewAll')}</Text>
        </HStack>

        <HStack overflowX="auto" gap="6" pb="4" css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
          {employees.slice(0, 5).map(emp => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </HStack>
      </Box>
    </Box>
  )
}

import type { IconType } from "react-icons"

interface StatCardProps {
  label: string
  value: string | number
  helpText?: string
  icon: IconType
  trend?: "up" | "down"
  trendColor: "green" | "red" | "gray"
}

const StatCard = ({ label, value, helpText, icon, trendColor }: StatCardProps) => (
  <ChakraCard.Root size="lg" shadow="sm" borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white">
    <ChakraCard.Body>
      <Flex justify="space-between" align="start">
        <Box>
          <Text color="gray.500" fontWeight="medium" mb="2">{label}</Text>
          <Text fontSize="4xl" fontWeight="bold" letterSpacing="tight" lineHeight="1" mb="2">{value}</Text>
          {helpText && (
            <Text fontSize="sm" color={trendColor === 'green' ? "oxygen.600" : trendColor === 'red' ? "red.500" : "gray.500"} fontWeight="medium">
              {helpText}
            </Text>
          )}
        </Box>
        <Box p="3" bg={trendColor === 'green' ? "oxygen.50" : "gray.50"} borderRadius="xl">
          <Icon as={icon} boxSize="6" color={trendColor === 'green' ? "oxygen.600" : "gray.500"} />
        </Box>
      </Flex>
    </ChakraCard.Body>
  </ChakraCard.Root>
)

import { Employee } from "@/types"

const EmployeeCard = ({ employee }: { employee: Employee }) => {
  const { t } = useTranslation(['dashboard'])
  return (
    <ChakraCard.Root minW="340px" shadow="sm" borderRadius="2xl" border="1px solid" borderColor="gray.100" overflow="hidden" bg="white">
      <ChakraCard.Body p="6">
        <Flex justify="space-between" align="start" mb="6">
          <Box>
            <Text fontWeight="bold" fontSize="lg" lineHeight="1.2">{employee.name}</Text>
            <Text color="gray.500" fontSize="sm">{employee.jobTitle}</Text>
          </Box>
          <Badge
            colorPalette={employee.isArchived ? "orange" : "green"}
            variant="subtle"
            borderRadius="md"
            px="2.5"
            py="0.5"
            fontSize="xs"
            fontWeight="bold"
          >
            {employee.isArchived ? t('archived') : t('active')}
          </Badge>
        </Flex>

        <Box mb="6">
          <HStack justify="space-between" mb="2">
            <Text fontSize="xs" fontWeight="bold" color="gray.400">{t('employee.performanceScore')}</Text>
            <Text fontWeight="bold" fontSize="sm">{employee.scores?.performance ?? '—'}%</Text>
          </HStack>
          <Box w="full" h="1.5" bg="gray.100" borderRadius="full" overflow="hidden">
            <Box w={`${employee.scores?.performance ?? 0}%`} h="full" bg="oxygen.500" borderRadius="full" />
          </Box>
        </Box>

        <Box p="4" borderRadius="xl" border="1px solid" borderColor="oxygen.200" bg="white">
          <Text fontSize="xs" color="gray.500" mb="1">{t('netMonthly')}</Text>
          <Flex justify="space-between" align="center">
            <Text fontSize="xl" fontWeight="bold" letterSpacing="tight">{formatCurrency(employee.monthlySalary)}</Text>
            <Box p="2" bg="oxygen.50" borderRadius="lg">
              <Icon as={LuWallet} color="oxygen.600" boxSize="4" />
            </Box>
          </Flex>
        </Box>

        <Flex justify="space-between" align="center" mt="6">
          <HStack gap="2" color="gray.400" fontSize="xs">
            <Icon as={LuUsers} />
            <Text>{t('employee.email')}</Text>
          </HStack>
          <HStack gap="1" color="gray.400" fontSize="xs" cursor="pointer" _hover={{ color: "oxygen.600" }}>
            <Text>{t('details')}</Text>
            <Icon as={LuTrendingUp} />
          </HStack>
        </Flex>
      </ChakraCard.Body>
    </ChakraCard.Root>
  )
}
