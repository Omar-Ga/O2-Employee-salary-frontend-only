import { Avatar } from "@/components/ui/avatar"
import { Box, Flex, HStack, IconButton, Input, Text } from "@chakra-ui/react"
import { InputGroup } from "@/components/ui/input-group"
import { LuBell, LuSearch, LuLogOut, LuUser } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { useAuthStore } from "@/store/auth.store"
import { useNavigate } from "react-router-dom"
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu"

export const Topbar = () => {
  const { t } = useTranslation(['topbar', 'translation'])
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Flex h="20" align="center" justify="space-between" px="8" bg="white" borderBottomWidth="1px" borderColor="gray.50">
      <Box w="96">
        <InputGroup startElement={<LuSearch color="gray.400" />} w="full">
          <Input placeholder={t('search')} bg="gray.50" border="none" _focus={{ bg: "white", ring: "1px", ringColor: "oxygen.400" }} />
        </InputGroup>
      </Box>

      <HStack gap="4">
        <IconButton variant="ghost" aria-label="Notifications" color="gray.500">
          <LuBell />
        </IconButton>

        <MenuRoot positioning={{ placement: "bottom-end" }}>
          <MenuTrigger asChild>
            <HStack
              gap="3"
              pl="4"
              borderStartWidth="1px"
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              <Avatar
                size="sm"
                name={user?.name || "User"}
                src={user?.avatar ? `${import.meta.env.VITE_PB_URL}/api/files/users/${user.id}/${user.avatar}` : undefined}
                bg="oxygen.100"
                color="oxygen.600"
              />
              <Box display={{ base: "none", md: "block" }} textAlign="start">
                <Text fontSize="sm" fontWeight="bold" lineHeight="tight">
                  {user?.name || t('profile.hrAdmin')}
                </Text>
                <Text fontSize="xs" color="gray.500" lineHeight="tight">
                  {user?.email || t('profile.viewProfile')}
                </Text>
              </Box>
            </HStack>
          </MenuTrigger>
          <MenuContent minW="200px">
            <MenuItem value="profile">
              <LuUser />
              <Box flex="1">{t('profile.settings')}</Box>
            </MenuItem>
            <MenuItem
              value="logout"
              color="fg.error"
              _hover={{ bg: "bg.error", color: "fg.error" }}
              onClick={handleLogout}
            >
              <LuLogOut />
              <Box flex="1">{t('profile.logout')}</Box>
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </HStack>
    </Flex>
  )
}
