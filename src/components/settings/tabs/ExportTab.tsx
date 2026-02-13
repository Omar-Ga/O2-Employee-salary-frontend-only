import { Box, Heading, Text, SimpleGrid, Icon, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuFileSpreadsheet, LuFileText, LuFileCode2 } from "react-icons/lu"

export const ExportTab = () => {
  const { t } = useTranslation('settings')

  const options = [
    {
      key: 'payslips',
      icon: LuFileText,
      color: 'blue.500',
      bg: 'blue.50',
      action: () => console.log('Generate Payslips')
    },
    {
      key: 'csv',
      icon: LuFileCode2,
      color: 'green.500',
      bg: 'green.50',
      action: () => console.log('Export CSV')
    },
    {
      key: 'excel',
      icon: LuFileSpreadsheet,
      color: 'orange.500',
      bg: 'orange.50',
      action: () => console.log('Export Excel')
    }
  ]

  return (
    <Box maxW="4xl">
      <Heading size="lg" mb={2} color="gray.800">{t('export.title')}</Heading>
      <Text color="gray.500" mb={8}>{t('export.description')}</Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        {options.map((opt) => (
          <Box
            key={opt.key}
            p={6}
            bg="white"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.100"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: opt.color,
              transform: "translateY(-4px)",
              shadow: "lg"
            }}
            onClick={opt.action}
          >
            <VStack gap={4} align="start">
              <Box 
                p={3} 
                bg={opt.bg} 
                color={opt.color} 
                borderRadius="lg"
              >
                <Icon as={opt.icon} boxSize={6} />
              </Box>
              <Box>
                <Heading size="sm" mb={1} color="gray.700">
                  {t(`export.options.${opt.key}.title`)}
                </Heading>
                <Text fontSize="sm" color="gray.500" lineClamp={2}>
                  {t(`export.options.${opt.key}.desc`)}
                </Text>
              </Box>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}
