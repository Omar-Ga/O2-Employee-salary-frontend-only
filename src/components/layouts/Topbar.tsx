import { Avatar } from "@/components/ui/avatar"
import { Box, Flex, HStack, IconButton, Input, Text } from "@chakra-ui/react"
import { InputGroup } from "@/components/ui/input-group"
import { LuBell, LuSearch } from "react-icons/lu"
import { useTranslation } from "react-i18next"

export const Topbar = () => {
  const { t } = useTranslation()

  return (
    <Flex h="20" align="center" justify="space-between" px="8" bg="white" borderBottomWidth="1px" borderColor="gray.50">
      <Box w="96">
        <InputGroup startElement={<LuSearch color="gray.400" />} w="full">
          <Input placeholder={t('common.search')} bg="gray.50" border="none" _focus={{ bg: "white", ring: "1px", ringColor: "oxygen.400" }} />
        </InputGroup>
      </Box>

      <HStack gap="4">
        <IconButton variant="ghost" aria-label="Notifications" color="gray.500">
          <LuBell />
        </IconButton>

        <HStack gap="3" pl="4" borderStartWidth="1px">
          <Avatar size="sm" name={t('common.hrAdmin')} src="https://bit.ly/broken-link" bg="gray.200" color="gray.600" />
          <Box display={{ base: "none", md: "block" }}>
            <Text fontSize="sm" fontWeight="bold">{t('common.hrAdmin')}</Text>
            <Text fontSize="xs" color="gray.500">{t('common.viewProfile')}</Text>
          </Box>
        </HStack>
      </HStack>
    </Flex>
  )
}
