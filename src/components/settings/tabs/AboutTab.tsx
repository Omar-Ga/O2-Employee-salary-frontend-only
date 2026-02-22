import {
  Box,
  Heading,
  Text,
  Grid,
  Stack,
  IconButton,
  Flex,
  Separator,
  Icon
} from "@chakra-ui/react"
import { LuCopy, LuCheck, LuMail, LuPhone, LuMapPin, LuBuilding, LuFileText } from "react-icons/lu"
import { toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { IconType } from "react-icons"

const CopyButton = ({ value, label }: { value: string, label: string }) => {
  const [hasCopied, setHasCopied] = useState(false)
  const { t } = useTranslation('about')

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setHasCopied(true)
    toaster.create({
      title: t('actions.copy'),
      description: t('actions.copySuccess', { label }),
      type: "success",
    })
    setTimeout(() => setHasCopied(false), 2000)
  }

  return (
    <IconButton
      aria-label="Copy"
      variant="ghost"
      size="xs"
      color="gray.400"
      _hover={{ color: "gray.700", bg: "gray.100" }}
      onClick={handleCopy}
    >
      {hasCopied ? <LuCheck /> : <LuCopy />}
    </IconButton>
  )
}

const DetailRow = ({
  label,
  value,
  icon,
  canCopy = false
}: {
  label: string,
  value: string,
  icon: IconType,
  canCopy?: boolean
}) => (
  <Flex
    direction={{ base: "column", sm: "row" }}
    py={4}
    borderBottomWidth="1px"
    borderColor="gray.100"
    _last={{ borderBottomWidth: 0 }}
    align={{ base: "start", sm: "center" }}
    justify="space-between"
    gap={2}
    className="group"
    transition="background-color 0.2s"
    _hover={{ bg: "gray.50/50" }}
    px={2}
    borderRadius="md"
    mx={-2}
  >
    <Flex align="center" gap={4} flex={1}>
      <Flex
        align="center"
        justify="center"
        boxSize={10}
        bg="gray.50"
        color="gray.500"
        borderRadius="full"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <Icon as={icon} boxSize={4} />
      </Flex>
      <Box>
        <Text
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="wider"
          color="gray.400"
          mb={0.5}
        >
          {label}
        </Text>
        <Text
          fontSize="md"
          fontWeight="medium"
          color="gray.800"
          fontFamily="mono" // Editorial choice for data
        >
          {value}
        </Text>
      </Box>
    </Flex>

    {canCopy && (
      <Box opacity={{ base: 1, sm: 0 }} _groupHover={{ opacity: 1 }} transition="opacity 0.2s">
        <CopyButton value={value} label={label} />
      </Box>
    )}
  </Flex>
)

export const AboutTab = () => {
  const { t } = useTranslation('about')

  return (
    <Box position="relative" css={{ isolation: "isolate" }}>
      {/* Background Watermark - Avant-Garde Detail */}
      <Box
        position="absolute"
        right="-10%"
        bottom="-10%"
        fontSize="400px"
        fontWeight="bold"
        lineHeight="1"
        color="gray.900"
        opacity={0.02}
        zIndex={-1}
        userSelect="none"
        pointerEvents="none"
        fontFamily="heading"
      >
        O2
      </Box>

      <Stack gap={10} animation="slide-fade-in 0.5s ease-out">
        {/* Header Section */}
        <Box>
          <Text
            fontSize="sm"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="widest"
            color="oxygen.600"
            mb={2}
          >
            {t('title')}
          </Text>
          <Heading
            size="5xl"
            fontWeight="bold"
            letterSpacing="-0.04em"
            color="gray.900"
            lineHeight="1.1"
          >
            {t('companyName')}<Box as="span" color="oxygen.500">.</Box>
          </Heading>
          <Text fontSize="xl" color="gray.500" mt={4} maxW="2xl" lineHeight="relaxed">
            {t('subtitle')}
          </Text>
        </Box>

        <Separator borderColor="gray.100" />

        {/* Details Grid */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={12}>
          <Stack gap={0}>
            <Text fontSize="lg" fontWeight="semibold" mb={6} color="gray.900">
              {t('sections.contact')}
            </Text>
            <DetailRow
              label={t('fields.email')}
              value="contact@o2mation.com"
              icon={LuMail}
              canCopy
            />
            <DetailRow
              label={t('fields.phone')}
              value="+1 234 567 890"
              icon={LuPhone}
              canCopy
            />
            <DetailRow
              label={t('fields.headquarters')}
              value={t('values.headquarters')}
              icon={LuMapPin}
            />
          </Stack>

          <Stack gap={0}>
            <Text fontSize="lg" fontWeight="semibold" mb={6} color="gray.900">
              {t('sections.legal')}
            </Text>
            <DetailRow
              label={t('fields.taxId')}
              value="XX-XXXXXXX"
              icon={LuFileText}
              canCopy
            />
            <DetailRow
              label={t('fields.registration')}
              value="REG-2024-O2M-88"
              icon={LuBuilding}
              canCopy
            />
            <DetailRow
              label={t('fields.license')}
              value="O2-ENT-2024-LICENSE-ACTIVE"
              icon={LuCheck}
              canCopy
            />
          </Stack>
        </Grid>
      </Stack>
    </Box>
  )
}
